import { createClient } from '@supabase/supabase-js';
import { AccessToken } from 'livekit-server-sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, readBody, sendJson } from '../_lib/http';
import { rateLimit } from '../_lib/redis';

interface TokenBody {
  room?: unknown;
  identity?: unknown;
  name?: unknown;
}

function adminClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Mints a short-lived LiveKit token for a Nova Live room. The API key and
 * secret never reach the browser; the client only receives the token and the
 * public media URL.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  const url =
    process.env.LIVEKIT_URL?.trim() || process.env.VITE_LIVEKIT_URL?.trim();

  if (!apiKey || !apiSecret || !url) {
    sendJson(res, 503, {
      error:
        'Nova Live media is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET.',
    });
    return;
  }

  const supabase = adminClient();
  if (!supabase) {
    sendJson(res, 503, {
      error: 'Live rooms require the server Supabase keys before tokens can be issued.',
    });
    return;
  }

  const authorization = req.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    sendJson(res, 401, { error: 'A signed-in session is required to join a live room.' });
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const caller = userData?.user;

  if (userError || !caller) {
    sendJson(res, 401, { error: 'Your session is invalid or has expired. Sign in again.' });
    return;
  }

  const body = readBody<TokenBody>(req.body);
  if (!body) {
    sendJson(res, 400, { error: 'A JSON body is required.' });
    return;
  }

  const room = clean(body.room, 80);
  const identity = clean(body.identity, 80);
  const name = clean(body.name, 80) || 'Nova participant';

  if (!/^[a-zA-Z0-9:_-]{3,80}$/.test(room)) {
    sendJson(res, 400, { error: 'A valid room name is required.' });
    return;
  }

  if (!/^[a-zA-Z0-9:_-]{3,80}$/.test(identity)) {
    sendJson(res, 400, { error: 'A valid participant identity is required.' });
    return;
  }

  const limit = await rateLimit(`live-token:${caller.id}`, 30, 10 * 60);
  if (!limit.success) {
    res.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)))
    );
    sendJson(res, 429, { error: 'Too many room joins. Try again shortly.' });
    return;
  }

  const accessToken = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: '2h',
  });

  accessToken.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  sendJson(res, 200, {
    token: await accessToken.toJwt(),
    url,
    room,
  });
}

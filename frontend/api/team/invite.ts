import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, readBody, sendJson } from '../_lib/http';
import { rateLimit } from '../_lib/redis';

const INVITE_ROLES = ['admin', 'member', 'viewer'] as const;
type InviteRole = (typeof INVITE_ROLES)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InviteBody {
  email?: unknown;
  role?: unknown;
  organizationId?: unknown;
}

function isInviteRole(value: unknown): value is InviteRole {
  return typeof value === 'string' && INVITE_ROLES.includes(value as InviteRole);
}

function adminClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secret) return null;

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  const supabase = adminClient();
  if (!supabase) {
    sendJson(res, 503, {
      error: 'Invitations are unavailable until the server Supabase keys are configured.',
    });
    return;
  }

  const authorization = req.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    sendJson(res, 401, { error: 'A signed-in session is required to send invitations.' });
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const caller = userData?.user;

  if (userError || !caller) {
    sendJson(res, 401, { error: 'Your session is invalid or has expired. Sign in again.' });
    return;
  }

  const body = readBody<InviteBody>(req.body);
  if (!body) {
    sendJson(res, 400, { error: 'A JSON body is required.' });
    return;
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = body.role;
  const organizationId =
    typeof body.organizationId === 'string' ? body.organizationId.trim() : '';

  if (!EMAIL_PATTERN.test(email)) {
    sendJson(res, 400, { error: 'Enter a valid email address.' });
    return;
  }

  if (!isInviteRole(role)) {
    sendJson(res, 400, { error: 'Choose a valid role: admin, member or viewer.' });
    return;
  }

  if (!UUID_PATTERN.test(organizationId)) {
    sendJson(res, 400, { error: 'A valid workspace is required.' });
    return;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', caller.id)
    .maybeSingle<{ role: string; status: string }>();

  if (membershipError) {
    sendJson(res, 500, { error: 'The workspace could not be verified.' });
    return;
  }

  const canInvite =
    membership?.status === 'active' &&
    (membership.role === 'owner' || membership.role === 'admin');

  if (!canInvite) {
    sendJson(res, 403, { error: 'Only workspace owners and admins can invite members.' });
    return;
  }

  const limit = await rateLimit(`invite:${caller.id}`, 10, 60 * 60);
  if (!limit.success) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))));
    sendJson(res, 429, {
      error: 'Too many invitations. Try again later.',
      limit: limit.limit,
      remaining: limit.remaining,
    });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .limit(1)
    .maybeSingle<{ id: string; full_name: string | null }>();

  if (profile) {
    const { data: existing } = await supabase
      .from('organization_members')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('user_id', profile.id)
      .maybeSingle<{ status: string }>();

    if (existing) {
      sendJson(res, 409, { error: 'This person is already part of the workspace.' });
      return;
    }
  }

  const appUrl = process.env.VITE_APP_URL?.trim() || 'http://localhost:5173';
  const redirectTo = `${appUrl.replace(/\/$/, '')}/login`;

  let invitedUserId = profile?.id ?? null;
  let delivery: 'email' | 'existing-account' = 'email';

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo,
      data: { organization_id: organizationId, role },
    }
  );

  if (inviteError) {
    const alreadyRegistered = /already (been )?registered|already exists/i.test(
      inviteError.message
    );

    if (!alreadyRegistered || !profile) {
      sendJson(res, 400, {
        error: alreadyRegistered
          ? 'This email already has an account. Ask them to join from their own workspace.'
          : inviteError.message,
      });
      return;
    }

    invitedUserId = profile.id;
    delivery = 'existing-account';
  } else if (inviteData?.user?.id) {
    invitedUserId = inviteData.user.id;
  }

  if (!invitedUserId) {
    sendJson(res, 500, { error: 'The invitation was sent but the account could not be resolved.' });
    return;
  }

  const { error: insertError } = await supabase.from('organization_members').insert({
    organization_id: organizationId,
    user_id: invitedUserId,
    role,
    status: 'invited',
  });

  if (insertError) {
    sendJson(res, 500, { error: 'The invitation was sent but the membership could not be saved.' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    delivery,
    member: {
      id: invitedUserId,
      email,
      fullName: profile?.full_name ?? email.split('@')[0].replace(/[._-]/g, ' '),
      role,
      status: 'invited',
    },
  });
}

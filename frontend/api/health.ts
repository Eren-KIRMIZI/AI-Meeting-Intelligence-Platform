import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodNotAllowed, sendJson } from './_lib/http';
import { getRedis } from './_lib/redis';

interface HealthCheck {
  ok: boolean;
  detail: string;
}

/**
 * Lightweight readiness probe. It never exposes secret values — only whether
 * each dependency is configured and reachable.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const supabaseConfigured = Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim()
  );

  const redis = getRedis();
  let redisCheck: HealthCheck = redis
    ? { ok: false, detail: 'Configured' }
    : { ok: true, detail: 'Not configured (rate limiting fails open)' };

  if (redis) {
    try {
      await redis.ping();
      redisCheck = { ok: true, detail: 'Reachable' };
    } catch {
      redisCheck = { ok: false, detail: 'Configured but unreachable' };
    }
  }

  const checks: Record<string, HealthCheck> = {
    supabase: supabaseConfigured
      ? { ok: true, detail: 'Configured' }
      : { ok: true, detail: 'Not configured (demo mode)' },
    redis: redisCheck,
  };

  sendJson(res, 200, {
    status: 'ok',
    service: 'nova-api',
    mode: supabaseConfigured ? 'live' : 'demo',
    checks,
    timestamp: new Date().toISOString(),
  });
}

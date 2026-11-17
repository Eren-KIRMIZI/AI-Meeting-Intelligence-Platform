import { Redis } from '@upstash/redis';

let cached: Redis | null | undefined;

/**
 * Upstash is optional. When the REST credentials are missing the helpers
 * fail open so local/demo environments never break.
 */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();

  if (!redis) {
    return { success: true, limit, remaining: limit, reset: now + windowSeconds * 1000 };
  }

  const key = `nova:ratelimit:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: ttl > 0 ? now + ttl * 1000 : now + windowSeconds * 1000,
  };
}

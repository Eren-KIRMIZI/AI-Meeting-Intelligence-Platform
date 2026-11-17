import type { VercelResponse } from '@vercel/node';

export function sendJson(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>
): void {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.json(body);
}

export function methodNotAllowed(res: VercelResponse, allow: string[]): void {
  res.setHeader('Allow', allow.join(', '));
  sendJson(res, 405, { error: `Method not allowed. Use ${allow.join(' or ')}.` });
}

export function readBody<T = Record<string, unknown>>(body: unknown): T | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T;
    } catch {
      return null;
    }
  }
  if (typeof body === 'object') return body as T;
  return null;
}

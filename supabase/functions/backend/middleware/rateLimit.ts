import type { Context, Next } from 'hono';
import { AppError } from '../lib/errors.ts';

interface Bucket { count: number; reset: number; }
const store = new Map<string, Bucket>();

function limiter(max: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const key = `${c.req.path}:${c.req.header('x-forwarded-for') ?? 'unknown'}`;
    const now = Date.now();
    const bucket = store.get(key);
    if (!bucket || now > bucket.reset) {
      store.set(key, { count: 1, reset: now + windowMs });
    } else {
      bucket.count++;
      if (bucket.count > max) throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.');
    }
    await next();
  };
}

export const authLimiter = limiter(10, 15 * 60 * 1000);
export const publicLimiter = limiter(30, 15 * 60 * 1000);
export const chatLimiter = limiter(20, 15 * 60 * 1000);

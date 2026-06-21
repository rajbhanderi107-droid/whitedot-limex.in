import type { Context, Next } from 'hono';
import { db } from '../lib/db.ts';
import { verifyToken } from '../lib/tokens.ts';
import { AppError } from '../lib/errors.ts';

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  try {
    const payload = await verifyToken(token);
    const { data: user, error } = await db
      .from('User')
      .select('id,email,name,role,isActive')
      .eq('id', payload.userId)
      .single();
    if (error || !user || !user.isActive) throw new AppError(401, 'UNAUTHORIZED', 'Account inactive or not found');
    c.set('user', user);
    await next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as { role: string } | undefined;
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    if (!roles.includes(user.role)) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    await next();
  };
}

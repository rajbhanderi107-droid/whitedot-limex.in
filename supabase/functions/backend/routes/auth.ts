import { Hono } from 'hono';
import { zValidator } from 'hono/zod-validator';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db } from '../lib/db.ts';
import { env } from '../lib/env.ts';
import { signToken, verifyToken } from '../lib/tokens.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';
import { sendSuccess, sendError } from '../lib/response.ts';
import { AppError } from '../lib/errors.ts';
import { requireAuth } from '../middleware/auth.ts';
import { authLimiter } from '../middleware/rateLimit.ts';
import { logActivity } from '../services/activity.ts';
import { sendMail, buildPasswordResetEmail } from '../services/mail.ts';

const app = new Hono();
const RESET_TTL = 60 * 60 * 1000;

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

app.post('/login', authLimiter, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const { data: user } = await db.from('User').select('*').eq('email', email).single();
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  if (!user.isActive) throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');
  if (!await verifyPassword(password, user.passwordHash)) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const token = await signToken({ userId: user.id, role: user.role });
  await logActivity({ userId: user.id, action: 'LOGIN', entityType: 'USER', entityId: user.id });
  return sendSuccess(c, { id: user.id, name: user.name, email: user.email, role: user.role, token }, 'Login successful');
});

app.post('/logout', requireAuth, async (c) => {
  const user = c.get('user') as { id: string };
  await logActivity({ userId: user.id, action: 'LOGOUT', entityType: 'USER', entityId: user.id });
  return sendSuccess(c, null, 'Logged out');
});

app.get('/me', requireAuth, (c) => sendSuccess(c, c.get('user')));

app.post('/forgot-password', authLimiter, zValidator('json', forgotSchema), async (c) => {
  const { email } = c.req.valid('json');
  const msg = 'If that email is registered, a reset link is on its way.';
  const { data: user } = await db.from('User').select('*').eq('email', email).single();
  if (user?.isActive) {
    await db.from('PasswordResetToken').delete().eq('userId', user.id).is('usedAt', null);
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL).toISOString();
    await db.from('PasswordResetToken').insert({ tokenHash, userId: user.id, expiresAt });
    const resetUrl = `${env.FRONTEND_URL}/#/admin/reset-password?token=${raw}`;
    sendMail({ to: user.email, ...buildPasswordResetEmail(user.name, resetUrl) }).catch(console.error);
  }
  return sendSuccess(c, null, msg);
});

app.get('/verify-reset-token/:token', async (c) => {
  const raw = c.req.param('token');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const { data: record } = await db.from('PasswordResetToken').select('*').eq('tokenHash', tokenHash).single();
  const valid = !!(record && !record.usedAt && new Date(record.expiresAt) > new Date());
  return sendSuccess(c, { valid });
});

app.post('/reset-password', authLimiter, zValidator('json', resetSchema), async (c) => {
  const { token: raw, password } = c.req.valid('json');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const { data: record } = await db.from('PasswordResetToken').select('*').eq('tokenHash', tokenHash).single();
  if (!record || record.usedAt || new Date(record.expiresAt) <= new Date()) {
    throw new AppError(400, 'INVALID_TOKEN', 'This reset link is invalid or has expired.');
  }
  const passwordHash = await hashPassword(password);
  await db.from('User').update({ passwordHash }).eq('id', record.userId);
  await db.from('PasswordResetToken').update({ usedAt: new Date().toISOString() }).eq('id', record.id);
  await db.from('PasswordResetToken').delete().eq('userId', record.userId).is('usedAt', null);
  return sendSuccess(c, null, 'Password updated. You can now sign in with your new password.');
});

app.get('/google/config', (c) =>
  sendSuccess(c, { enabled: env.googleOAuthEnabled, ...(env.googleOAuthEnabled && { clientId: env.GOOGLE_CLIENT_ID }) })
);

app.post('/google', authLimiter, async (c) => {
  const { accessToken } = await c.req.json();
  if (!accessToken) throw new AppError(400, 'MISSING_TOKEN', 'Access token required');

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw new AppError(401, 'GOOGLE_AUTH_FAILED', 'Failed to verify Google token');

  const gUser = await userRes.json();
  const { data: user } = await db.from('User').select('*').eq('email', gUser.email).single();
  if (!user) throw new AppError(401, 'NOT_REGISTERED', 'No admin account found for this Google account');
  if (!user.isActive) throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account is inactive');

  const token = await signToken({ userId: user.id, role: user.role });
  await logActivity({ userId: user.id, action: 'LOGIN_GOOGLE', entityType: 'USER', entityId: user.id });
  return sendSuccess(c, { id: user.id, name: user.name, email: user.email, role: user.role, token }, 'Login successful');
});

export default app;

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './lib/env.ts';
import { db } from './lib/db.ts';
import { AppError } from './lib/errors.ts';
import authRoutes from './routes/auth.ts';
import publicRoutes from './routes/public.ts';
import adminRoutes from './routes/admin.ts';
import portalRoutes from './routes/portal.ts';
import workforceRoutes from './routes/workforce.ts';

const app = new Hono().basePath('/backend');

const ALLOWED = [
  ...env.FRONTEND_ORIGINS,
  'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173',
];

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (ALLOWED.includes(origin)) return origin;
    try {
      const o = new URL(origin);
      const ok = ALLOWED.some(a => { try { const u = new URL(a); return o.protocol === u.protocol && o.hostname === u.hostname && o.port === u.port; } catch { return false; } });
      if (ok) return origin;
    } catch { /* */ }
    return null;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
}));

app.use('*', secureHeaders());

app.get('/api/health', async (c) => {
  const start = Date.now();
  const { error } = await db.from('User').select('id').limit(1);
  if (error) return c.json({ success: false, status: 'degraded', db: 'disconnected', latency: `${Date.now() - start}ms` }, 503);
  return c.json({ success: true, status: 'ok', db: 'connected', latency: `${Date.now() - start}ms`, timestamp: new Date().toISOString() });
});
app.get('/health', (c) => c.json({ success: true, message: 'WhiteDot API healthy' }));
app.get('/', (c) => c.json({ service: 'White Dot LLP — LIMEX CRM API', status: 'ok', platform: 'supabase-edge' }));

app.route('/api/auth', authRoutes);
app.route('/api/public', publicRoutes);
app.route('/api', workforceRoutes);
app.route('/api', adminRoutes);
app.route('/api', workforceRoutes);
app.route('/api/portal', portalRoutes);

app.notFound((c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found' } }, 404));

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ success: false, error: { code: err.code, message: err.message } }, err.status as Parameters<typeof c.json>[1]);
  }
  console.error('[edge-fn error]', err);
  return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
});

Deno.serve(app.fetch);

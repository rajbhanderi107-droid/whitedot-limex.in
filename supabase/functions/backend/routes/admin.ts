import { Hono } from 'hono';
import { db } from '../lib/db.ts';
import { env } from '../lib/env.ts';
import { sendSuccess, sendPaginated } from '../lib/response.ts';
import { AppError } from '../lib/errors.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { hashPassword } from '../lib/password.ts';
import { logActivity } from '../services/activity.ts';
import { notifyAdmins } from '../services/notify.ts';

const app = new Hono();
app.use('*', requireAuth);

// Helpers
const page = (c: { req: { query: (k: string) => string | undefined } }) => Math.max(1, parseInt(c.req.query('page') ?? '1'));
const limit = (c: { req: { query: (k: string) => string | undefined } }) => Math.min(100, parseInt(c.req.query('limit') ?? '20'));
const offset = (p: number, l: number) => (p - 1) * l;

// ─── Dashboard ───────────────────────────────────
app.get('/dashboard', async (c) => {
  const [inquiries, quotes, samples, companies, followUps, notifications] = await Promise.all([
    db.from('Inquiry').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
    db.from('QuoteRequest').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
    db.from('SampleRequest').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
    db.from('Company').select('*', { count: 'exact', head: true }),
    db.from('FollowUpTask').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    db.from('Notification').select('*', { count: 'exact', head: true }).eq('isRead', false),
  ]);
  const { data: recentInquiries } = await db.from('Inquiry').select('id,name,email,createdAt,status').order('createdAt', { ascending: false }).limit(5);
  return sendSuccess(c, {
    counts: {
      newInquiries: inquiries.count ?? 0,
      newQuotes: quotes.count ?? 0,
      newSamples: samples.count ?? 0,
      totalCompanies: companies.count ?? 0,
      openFollowUps: followUps.count ?? 0,
      unreadNotifications: notifications.count ?? 0,
    },
    recentInquiries: recentInquiries ?? [],
  });
});

// ─── Google overview (admin) ─────────────────────
app.get('/google/overview', async (c) => {
  const { data } = await db.from('WebsiteSetting').select('value').eq('key', 'google_overview_data').single();
  if (data?.value) { try { return sendSuccess(c, JSON.parse(data.value)); } catch { /* */ } }
  return sendSuccess(c, null);
});
app.get('/google/sync-status', async (c) => {
  const { data } = await db.from('WebsiteSetting').select('value').eq('key', 'google_last_sync').single();
  return sendSuccess(c, { lastSync: data?.value ?? null });
});
app.post('/google/sync', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  return sendSuccess(c, null, 'Google sync is not available in this deployment.');
});

// ─── Inquiries ───────────────────────────────────
app.get('/inquiries', async (c) => {
  const p = page(c), l = limit(c), status = c.req.query('status');
  let q = db.from('Inquiry').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).range(offset(p, l), offset(p, l) + l - 1);
  if (status) q = q.eq('status', status);
  const { data, count, error } = await q;
  if (error) throw error;
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.get('/inquiries/:id', async (c) => {
  const { data, error } = await db.from('Inquiry').select('*').eq('id', c.req.param('id')).single();
  if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Inquiry not found');
  const { data: notes } = await db.from('AdminNote').select('*').eq('inquiryId', data.id).order('createdAt');
  return sendSuccess(c, { ...data, notes: notes ?? [] });
});
app.patch('/inquiries/:id', async (c) => {
  const id = c.req.param('id');
  const { data, error } = await db.from('Inquiry').update(await c.req.json()).eq('id', id).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/inquiries/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  await db.from('Inquiry').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Inquiry deleted');
});
app.post('/inquiries/:id/notes', async (c) => {
  const user = c.get('user') as { id: string };
  const body = await c.req.json();
  const { data, error } = await db.from('AdminNote').insert({ content: body.content, inquiryId: c.req.param('id'), createdById: user.id }).select().single();
  if (error) throw error;
  return sendSuccess(c, data, 'Note added', 201);
});

// ─── Quote requests ──────────────────────────────
app.get('/quote-requests', async (c) => {
  const p = page(c), l = limit(c);
  const { data, count } = await db.from('QuoteRequest').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).range(offset(p, l), offset(p, l) + l - 1);
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.get('/quote-requests/:id', async (c) => {
  const { data, error } = await db.from('QuoteRequest').select('*').eq('id', c.req.param('id')).single();
  if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Quote request not found');
  return sendSuccess(c, data);
});
app.patch('/quote-requests/:id', async (c) => {
  const { data, error } = await db.from('QuoteRequest').update(await c.req.json()).eq('id', c.req.param('id')).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/quote-requests/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  await db.from('QuoteRequest').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Quote request deleted');
});

// ─── Sample requests ─────────────────────────────
app.get('/sample-requests', async (c) => {
  const p = page(c), l = limit(c);
  const { data, count } = await db.from('SampleRequest').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).range(offset(p, l), offset(p, l) + l - 1);
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.get('/sample-requests/:id', async (c) => {
  const { data, error } = await db.from('SampleRequest').select('*').eq('id', c.req.param('id')).single();
  if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Sample request not found');
  return sendSuccess(c, data);
});
app.patch('/sample-requests/:id', async (c) => {
  const { data, error } = await db.from('SampleRequest').update(await c.req.json()).eq('id', c.req.param('id')).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/sample-requests/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  await db.from('SampleRequest').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Sample request deleted');
});

// ─── Companies ───────────────────────────────────
app.get('/companies', async (c) => {
  const p = page(c), l = limit(c);
  const { data, count } = await db.from('Company').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).range(offset(p, l), offset(p, l) + l - 1);
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.get('/companies/:id', async (c) => {
  const { data, error } = await db.from('Company').select('*').eq('id', c.req.param('id')).single();
  if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Company not found');
  return sendSuccess(c, data);
});
app.post('/companies', async (c) => {
  const { data, error } = await db.from('Company').insert(await c.req.json()).select().single();
  if (error) throw error;
  return sendSuccess(c, data, 'Company created', 201);
});
app.patch('/companies/:id', async (c) => {
  const { data, error } = await db.from('Company').update(await c.req.json()).eq('id', c.req.param('id')).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/companies/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  await db.from('Company').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Company deleted');
});

// ─── Calculator submissions ──────────────────────
app.get('/calculator-submissions', async (c) => {
  const p = page(c), l = limit(c);
  const { data, count } = await db.from('CalculatorSubmission').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).range(offset(p, l), offset(p, l) + l - 1);
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.get('/calculator-submissions/:id', async (c) => {
  const { data, error } = await db.from('CalculatorSubmission').select('*').eq('id', c.req.param('id')).single();
  if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
  return sendSuccess(c, data);
});
app.patch('/calculator-submissions/:id/convert-to-lead', async (c) => {
  const { data: sub } = await db.from('CalculatorSubmission').select('*').eq('id', c.req.param('id')).single();
  if (!sub) throw new AppError(404, 'NOT_FOUND', 'Submission not found');
  const { data: inquiry } = await db.from('Inquiry').insert({ name: sub.contactPerson, email: sub.email, message: `Converted from calculator submission` }).select().single();
  return sendSuccess(c, inquiry, 'Converted to lead');
});

// ─── Follow-ups ──────────────────────────────────
app.get('/follow-ups', async (c) => {
  const p = page(c), l = limit(c);
  const { data, count } = await db.from('FollowUpTask').select('*', { count: 'exact' }).order('dueDate', { ascending: true, nullsFirst: false }).range(offset(p, l), offset(p, l) + l - 1);
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.post('/follow-ups', async (c) => {
  const user = c.get('user') as { id: string };
  const { data, error } = await db.from('FollowUpTask').insert({ ...await c.req.json(), assignedToId: user.id }).select().single();
  if (error) throw error;
  return sendSuccess(c, data, 'Follow-up created', 201);
});
app.patch('/follow-ups/:id', async (c) => {
  const { data, error } = await db.from('FollowUpTask').update(await c.req.json()).eq('id', c.req.param('id')).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/follow-ups/:id', async (c) => {
  await db.from('FollowUpTask').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Follow-up deleted');
});

// ─── Documents ───────────────────────────────────
app.get('/documents', async (c) => {
  const { data } = await db.from('DocumentAsset').select('*').order('createdAt', { ascending: false });
  return sendSuccess(c, data ?? []);
});
app.post('/documents', async (c) => {
  const user = c.get('user') as { id: string };
  const { data, error } = await db.from('DocumentAsset').insert({ ...await c.req.json(), uploadedById: user.id }).select().single();
  if (error) throw error;
  return sendSuccess(c, data, 'Document created', 201);
});
app.patch('/documents/:id', async (c) => {
  const { data, error } = await db.from('DocumentAsset').update(await c.req.json()).eq('id', c.req.param('id')).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/documents/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  await db.from('DocumentAsset').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Document deleted');
});

// ─── Website settings ────────────────────────────
app.get('/website-settings', async (c) => {
  const { data } = await db.from('WebsiteSetting').select('*').order('key');
  return sendSuccess(c, data ?? []);
});
app.put('/website-settings/brand-logo', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  const { url } = await c.req.json();
  const { data } = await db.from('WebsiteSetting').upsert({ key: 'brand_logo', value: url, type: 'TEXT', description: 'Brand logo URL' }, { onConflict: 'key' }).select().single();
  return sendSuccess(c, data, 'Brand logo updated');
});
app.patch('/website-settings/:key', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  const { value, description, type } = await c.req.json();
  const { data } = await db.from('WebsiteSetting').upsert({ key: c.req.param('key'), value, ...(description && { description }), ...(type && { type }) }, { onConflict: 'key' }).select().single();
  return sendSuccess(c, data, 'Setting updated');
});

// ─── Users ───────────────────────────────────────
app.get('/users', requireRole('SUPER_ADMIN'), async (c) => {
  const { data } = await db.from('User').select('id,name,email,role,isActive,createdAt').order('createdAt', { ascending: false });
  return sendSuccess(c, data ?? []);
});
app.post('/users', requireRole('SUPER_ADMIN'), async (c) => {
  const body = await c.req.json();
  const passwordHash = await hashPassword(body.password);
  const { data, error } = await db.from('User').insert({ ...body, passwordHash }).select('id,name,email,role,isActive').single();
  if (error) throw error;
  return sendSuccess(c, data, 'User created', 201);
});
app.patch('/users/:id', requireRole('SUPER_ADMIN'), async (c) => {
  const body = await c.req.json();
  const updateData: Record<string, unknown> = { ...body };
  if (body.password) { updateData.passwordHash = await hashPassword(body.password); delete updateData.password; }
  const { data, error } = await db.from('User').update(updateData).eq('id', c.req.param('id')).select('id,name,email,role,isActive').single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/users/:id', requireRole('SUPER_ADMIN'), async (c) => {
  const user = c.get('user') as { id: string };
  if (user.id === c.req.param('id')) throw new AppError(400, 'CANNOT_DELETE_SELF', 'Cannot delete your own account');
  await db.from('User').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'User deleted');
});

// ─── Notifications ───────────────────────────────
app.get('/notifications', async (c) => {
  const user = c.get('user') as { id: string };
  const { data } = await db.from('Notification').select('*').eq('userId', user.id).order('createdAt', { ascending: false }).limit(50);
  return sendSuccess(c, data ?? []);
});
app.patch('/notifications/:id/read', async (c) => {
  const user = c.get('user') as { id: string };
  await db.from('Notification').update({ isRead: true }).eq('id', c.req.param('id')).eq('userId', user.id);
  return sendSuccess(c, null, 'Marked as read');
});
app.patch('/notifications/read-all', async (c) => {
  const user = c.get('user') as { id: string };
  await db.from('Notification').update({ isRead: true }).eq('userId', user.id).eq('isRead', false);
  return sendSuccess(c, null, 'All marked as read');
});

// ─── Activity log ────────────────────────────────
app.get('/activity-log', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  const p = page(c), l = limit(c);
  const { data, count } = await db.from('ActivityLog').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).range(offset(p, l), offset(p, l) + l - 1);
  return sendPaginated(c, data ?? [], count ?? 0, p, l);
});
app.delete('/activity-log/:id', requireRole('SUPER_ADMIN'), async (c) => {
  await db.from('ActivityLog').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Entry deleted');
});
app.delete('/activity-log', requireRole('SUPER_ADMIN'), async (c) => {
  await db.from('ActivityLog').delete().neq('id', '');
  return sendSuccess(c, null, 'Activity log cleared');
});

export default app;

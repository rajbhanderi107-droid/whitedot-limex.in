import { Hono } from 'hono';
import { db } from '../lib/db.ts';
import { sendSuccess, sendError } from '../lib/response.ts';
import { AppError } from '../lib/errors.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { logActivity } from '../services/activity.ts';
import { runAgent, aiAgentConfigured } from '../services/aiAgent.ts';

const app = new Hono();
app.use('*', requireAuth);

const user = (c: { get: (k: string) => unknown }) => c.get('user') as { id: string; role: string };

// ─── Portal state ────────────────────────────────
app.get('/state', async (c) => {
  const { data } = await db.from('PortalState').upsert({ id: 'global' }, { onConflict: 'id' }).select().single();
  const { data: fresh } = await db.from('PortalState').select('*').eq('id', 'global').single();
  return sendSuccess(c, fresh);
});
app.patch('/state', async (c) => {
  const body = await c.req.json();
  const { data } = await db.from('PortalState').update({ ...body, updatedById: user(c).id }).eq('id', 'global').select().single();
  await logActivity({ userId: user(c).id, action: body.emergencyStop ? 'EMERGENCY_STOP' : 'UPDATE_PORTAL_STATE', entityType: 'PORTAL', entityId: 'global', metadata: body });
  return sendSuccess(c, data, 'Portal state updated');
});

// ─── Automations ─────────────────────────────────
app.get('/automations', async (c) => {
  const { data } = await db.from('PortalAutomation').select('*');
  return sendSuccess(c, data ?? []);
});
app.patch('/automations/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { data } = await db.from('PortalAutomation').upsert({ id, ...body }, { onConflict: 'id' }).select().single();
  await logActivity({ userId: user(c).id, action: 'UPDATE_AUTOMATION', entityType: 'AUTOMATION', entityId: id, metadata: body });
  return sendSuccess(c, data, 'Automation updated');
});

// ─── Approvals ───────────────────────────────────
app.get('/approvals', async (c) => {
  const status = c.req.query('status') ?? 'PENDING';
  let q = db.from('Approval').select('*').order('createdAt', { ascending: false }).limit(100);
  if (status !== 'ALL') q = q.eq('status', status);
  const { data } = await q;
  return sendSuccess(c, data ?? []);
});
app.post('/approvals', async (c) => {
  const { data, error } = await db.from('Approval').insert({ ...await c.req.json(), createdById: user(c).id }).select().single();
  if (error) throw error;
  await logActivity({ userId: user(c).id, action: 'CREATE_APPROVAL', entityType: 'APPROVAL', entityId: data.id });
  return sendSuccess(c, data, 'Approval queued', 201);
});
app.post('/approvals/:id/decide', async (c) => {
  const { decision, note } = await c.req.json();
  const id = c.req.param('id');
  if (decision === 'APPROVED') {
    const { data: state } = await db.from('PortalState').select('emergencyStop,automationMode').eq('id', 'global').single();
    if (state?.emergencyStop || state?.automationMode === 'LOCKDOWN') {
      return sendError(c, 'LOCKDOWN_ACTIVE', 'Approvals are blocked while lockdown is active.', 423);
    }
  }
  const { data, error } = await db.from('Approval').update({ status: decision, decidedById: user(c).id, decidedNote: note, decidedAt: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity({ userId: user(c).id, action: `APPROVAL_${decision}`, entityType: 'APPROVAL', entityId: id });
  return sendSuccess(c, data, `Approval ${decision.toLowerCase()}`);
});

// ─── Workflows ───────────────────────────────────
app.get('/workflows', async (c) => {
  const { data } = await db.from('Workflow').select('*').order('createdAt', { ascending: false });
  return sendSuccess(c, data ?? []);
});
app.post('/workflows', async (c) => {
  const { data, error } = await db.from('Workflow').insert({ ...await c.req.json(), createdById: user(c).id }).select().single();
  if (error) throw error;
  return sendSuccess(c, data, 'Workflow created', 201);
});
app.delete('/workflows/:id', async (c) => {
  await db.from('Workflow').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Workflow deleted');
});

// ─── Incidents ───────────────────────────────────
app.get('/incidents', async (c) => {
  const { data } = await db.from('Incident').select('*').order('createdAt', { ascending: false });
  return sendSuccess(c, data ?? []);
});
app.post('/incidents', async (c) => {
  const { data, error } = await db.from('Incident').insert({ ...await c.req.json(), reportedById: user(c).id }).select().single();
  if (error) throw error;
  return sendSuccess(c, data, 'Incident created', 201);
});
app.patch('/incidents/:id', async (c) => {
  const { data, error } = await db.from('Incident').update(await c.req.json()).eq('id', c.req.param('id')).select().single();
  if (error) throw error;
  return sendSuccess(c, data);
});
app.delete('/incidents/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (c) => {
  await db.from('Incident').delete().eq('id', c.req.param('id'));
  return sendSuccess(c, null, 'Incident deleted');
});

// ─── Integrations ────────────────────────────────
app.get('/integrations', async (c) => {
  const { data } = await db.from('PortalIntegration').select('*');
  return sendSuccess(c, data ?? []);
});
app.patch('/integrations/:id', async (c) => {
  const id = c.req.param('id');
  const { data } = await db.from('PortalIntegration').upsert({ id, ...await c.req.json() }, { onConflict: 'id' }).select().single();
  return sendSuccess(c, data, 'Integration updated');
});

// ─── AI agents ───────────────────────────────────
app.get('/ai-agents', async (c) => {
  const { data } = await db.from('PortalAiAgent').select('*');
  return sendSuccess(c, data ?? []);
});
app.patch('/ai-agents/:id', async (c) => {
  const id = c.req.param('id');
  const { data } = await db.from('PortalAiAgent').upsert({ id, ...await c.req.json() }, { onConflict: 'id' }).select().single();
  return sendSuccess(c, data, 'Agent updated');
});
app.post('/ai-agents/:id/run', async (c) => {
  if (!aiAgentConfigured()) {
    return sendSuccess(c, { status: 'unavailable', message: 'OPENAI_API_KEY not configured' }, undefined, 503);
  }
  const { input, tier } = await c.req.json();
  const result = await runAgent(c.req.param('id'), input, tier ?? 'specialist');
  const { data: run } = await db.from('AgentRun').insert({ agentId: c.req.param('id'), input, output: result.content, model: result.model, tokensUsed: result.tokens, triggeredById: user(c).id }).select().single();
  return sendSuccess(c, run, 'Agent run completed');
});

// ─── AI tools ────────────────────────────────────
app.get('/ai/tools', (c) => sendSuccess(c, []));
app.post('/ai/tool', async (c) => {
  if (!aiAgentConfigured()) return sendSuccess(c, { status: 'unavailable' }, undefined, 503);
  const { toolId, inputs } = await c.req.json();
  const result = await runAgent(toolId, JSON.stringify(inputs), 'content');
  return sendSuccess(c, { output: result.content });
});
app.post('/ai-draft', async (c) => {
  if (!aiAgentConfigured()) return sendSuccess(c, { status: 'unavailable' }, undefined, 503);
  const body = await c.req.json();
  const result = await runAgent('draft', JSON.stringify(body), 'content');
  const { data } = await db.from('Approval').insert({ type: 'AI_DRAFT', content: result.content, createdById: user(c).id, status: 'PENDING' }).select().single();
  return sendSuccess(c, data, 'Draft queued for approval', 201);
});

// ─── Intelligence ─────────────────────────────────
app.get('/security/summary', async (c) => {
  const { data, count } = await db.from('SecurityEvent').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).limit(20);
  return sendSuccess(c, { events: data ?? [], total: count ?? 0 });
});
app.get('/ai/stats', async (c) => {
  const { data, count } = await db.from('AgentRun').select('*', { count: 'exact' }).order('createdAt', { ascending: false }).limit(20);
  return sendSuccess(c, { runs: data ?? [], total: count ?? 0 });
});
app.get('/bi/summary', async (c) => {
  const [inq, qt, sr, co] = await Promise.all([
    db.from('Inquiry').select('*', { count: 'exact', head: true }),
    db.from('QuoteRequest').select('*', { count: 'exact', head: true }),
    db.from('SampleRequest').select('*', { count: 'exact', head: true }),
    db.from('Company').select('*', { count: 'exact', head: true }),
  ]);
  return sendSuccess(c, { inquiries: inq.count, quotes: qt.count, samples: sr.count, companies: co.count });
});
app.get('/health/detailed', async (c) => {
  const start = Date.now();
  const { error } = await db.from('User').select('id').limit(1);
  return sendSuccess(c, { db: error ? 'error' : 'ok', latency: `${Date.now() - start}ms`, platform: 'supabase-edge' });
});
app.get('/seo/audit', (c) => sendSuccess(c, { status: 'unavailable', message: 'SEO audit runs separately' }));
app.get('/devops/runs', (c) => sendSuccess(c, []));
app.get('/backup/stats', async (c) => {
  const tables = ['Inquiry', 'QuoteRequest', 'SampleRequest', 'Company', 'User'];
  const counts = await Promise.all(tables.map(t => db.from(t).select('*', { count: 'exact', head: true })));
  return sendSuccess(c, Object.fromEntries(tables.map((t, i) => [t, counts[i].count])));
});
app.get('/backup/export', requireRole('SUPER_ADMIN'), async (c) => {
  const tables = ['Inquiry', 'QuoteRequest', 'SampleRequest', 'Company', 'User', 'ActivityLog'];
  const result: Record<string, unknown[]> = {};
  for (const t of tables) {
    const { data } = await db.from(t).select('*');
    result[t] = data ?? [];
  }
  return c.json(result, 200, { 'Content-Disposition': 'attachment; filename="whitedot-backup.json"' });
});

// ─── Generic resource CRUD ────────────────────────
const RESOURCE_MAP: Record<string, string> = {
  attendance: 'AttendanceDay', 'location-pings': 'LocationPing',
  employees: 'EmployeeProfile', tasks: 'WorkTask', 'leave-requests': 'LeaveRequest',
};

function flattenItem(row: Record<string, unknown>) {
  return { ...(row.data as object), id: row.id, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

app.get('/r/:resource', async (c) => {
  const resource = c.req.param('resource');
  const table = RESOURCE_MAP[resource];
  if (table) {
    const { data } = await db.from(table).select('*').order('createdAt', { ascending: false });
    return sendSuccess(c, data ?? []);
  }
  const { data } = await db.from('PortalItem').select('*').eq('resource', resource).order('createdAt', { ascending: false });
  return sendSuccess(c, (data ?? []).map(flattenItem));
});
app.post('/r/:resource', async (c) => {
  const resource = c.req.param('resource');
  const table = RESOURCE_MAP[resource];
  const body = await c.req.json();
  if (table) {
    const { data, error } = await db.from(table).insert(body).select().single();
    if (error) throw error;
    return sendSuccess(c, data, 'Created', 201);
  }
  const { status, ...rest } = body;
  const row = { id: crypto.randomUUID(), resource, status: status ?? 'ACTIVE', data: rest };
  const { data: created, error } = await db.from('PortalItem').insert(row).select().single();
  if (error) throw error;
  return sendSuccess(c, flattenItem(created), 'Created', 201);
});
app.patch('/r/:resource/:id', async (c) => {
  const resource = c.req.param('resource');
  const id = c.req.param('id');
  const table = RESOURCE_MAP[resource];
  const body = await c.req.json();
  if (table) {
    const { data, error } = await db.from(table).update(body).eq('id', id).select().single();
    if (error) throw error;
    return sendSuccess(c, data);
  }
  const { status, ...rest } = body;
  const { data: existing } = await db.from('PortalItem').select('data').eq('id', id).eq('resource', resource).single();
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString(), data: { ...(existing?.data ?? {}), ...rest } };
  if (status !== undefined) patch.status = status;
  const { data: updated, error } = await db.from('PortalItem').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return sendSuccess(c, flattenItem(updated));
});
app.delete('/r/:resource/:id', async (c) => {
  const resource = c.req.param('resource');
  const id = c.req.param('id');
  const table = RESOURCE_MAP[resource];
  if (table) {
    await db.from(table).delete().eq('id', id);
    return sendSuccess(c, null, 'Deleted');
  }
  await db.from('PortalItem').delete().eq('id', id).eq('resource', resource);
  return sendSuccess(c, null, 'Deleted');
});

export default app;

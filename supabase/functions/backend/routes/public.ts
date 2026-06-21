import { Hono } from 'hono';
import { db } from '../lib/db.ts';
import { env } from '../lib/env.ts';
import { sendSuccess } from '../lib/response.ts';
import { publicLimiter, chatLimiter } from '../middleware/rateLimit.ts';
import { notifyAdmins } from '../services/notify.ts';
import { sendMail } from '../services/mail.ts';
import { chatWithLLM } from '../services/chat.ts';

const app = new Hono();

const LIMEX_SYSTEM = `You are the LIMEX Assistant for White Dot LLP — authorized distributor of LIMEX in western India (Gujarat, Rajasthan, Diu, Daman, Goa). LIMEX is a sustainable material made from calcium carbonate that replaces plastic and paper. Be helpful, professional, and concise.`;

app.post('/inquiry', publicLimiter, async (c) => {
  const body = await c.req.json();
  const { data: inquiry, error } = await db.from('Inquiry').insert(body).select().single();
  if (error) throw error;

  await notifyAdmins('New inquiry', `${inquiry.name} (${inquiry.email}) submitted an inquiry.`, 'LEAD');
  sendMail({
    to: env.ADMIN_INQUIRY_EMAIL,
    subject: `New LIMEX inquiry from ${inquiry.name}`,
    text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPortal: ${env.FRONTEND_URL}/#/admin/inquiries/${inquiry.id}`,
    html: `<p><strong>${inquiry.name}</strong> (${inquiry.email}) submitted an inquiry. <a href="${env.FRONTEND_URL}/#/admin/inquiries/${inquiry.id}">View in portal →</a></p>`,
  }).catch(console.error);

  return sendSuccess(c, { id: inquiry.id }, 'Inquiry submitted successfully. We will contact you soon.', 201);
});

app.post('/quote-request', publicLimiter, async (c) => {
  const body = await c.req.json();
  const { companyName, ...data } = body;
  if (companyName) {
    const { data: co } = await db.from('Company').select('id').ilike('companyName', companyName).single();
    if (co) data.companyId = co.id;
  }
  const { data: quote, error } = await db.from('QuoteRequest').insert(data).select().single();
  if (error) throw error;
  await notifyAdmins('New quote request', `${quote.contactPerson} (${quote.email}) requested a LIMEX quote.`, 'QUOTE');
  return sendSuccess(c, { id: quote.id }, 'Quote request submitted. Our team will review it.', 201);
});

app.post('/sample-request', publicLimiter, async (c) => {
  const body = await c.req.json();
  const { companyName, ...data } = body;
  if (companyName) {
    const { data: co } = await db.from('Company').select('id').ilike('companyName', companyName).single();
    if (co) data.companyId = co.id;
  }
  const { data: sample, error } = await db.from('SampleRequest').insert(data).select().single();
  if (error) throw error;
  await notifyAdmins('New sample request', `${sample.contactPerson} (${sample.email}) requested a material sample.`, 'SAMPLE');
  return sendSuccess(c, { id: sample.id }, 'Sample request submitted. We will follow up shortly.', 201);
});

app.post('/calculator-submission', publicLimiter, async (c) => {
  const body = await c.req.json();
  const { data: submission, error } = await db.from('CalculatorSubmission').insert(body).select().single();
  if (error) throw error;
  if (body.email) await notifyAdmins('Calculator submission', `${body.contactPerson || 'A visitor'} used the LIMEX calculator.`, 'LEAD');
  return sendSuccess(c, { id: submission.id }, 'Calculator results saved.', 201);
});

app.get('/settings', async (c) => {
  const { data: settings } = await db.from('WebsiteSetting').select('key,value,type,updatedAt').order('key');
  const arr = settings ?? [];
  const hasPublicLoading = arr.some(s => s.key === 'public_loading_enabled');
  if (!hasPublicLoading) arr.push({ key: 'public_loading_enabled', value: 'false', type: 'BOOLEAN', updatedAt: new Date(0).toISOString() });
  return c.json({ success: true, data: arr }, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
});

app.post('/chat', chatLimiter, async (c) => {
  const { messages } = await c.req.json();
  const reply = await chatWithLLM(messages, LIMEX_SYSTEM);
  return sendSuccess(c, { message: reply });
});

app.get('/google-overview', async (c) => {
  const { data: setting } = await db.from('WebsiteSetting').select('value').eq('key', 'google_overview_data').single();
  if (setting?.value) {
    try { return sendSuccess(c, JSON.parse(setting.value)); } catch { /* fall through */ }
  }
  return sendSuccess(c, null);
});

export default app;

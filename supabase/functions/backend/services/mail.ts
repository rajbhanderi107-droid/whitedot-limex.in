import { env } from '../lib/env.ts';

interface MailPayload { to: string; subject: string; html: string; text: string; }

export async function sendMail({ to, subject, html, text }: MailPayload): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.warn(`[mailer] RESEND_API_KEY not set — To: ${to}  Subject: ${subject}\n${text}`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.SMTP_FROM, to, subject, html, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) { console.error('[mailer] Resend error', res.status, await res.text()); return false; }
  return true;
}

export function buildPasswordResetEmail(name: string, resetUrl: string) {
  const subject = 'Reset your White Dot admin password';
  const text = `Hello ${name},\n\nReset your password: ${resetUrl}\n\nExpires in 1 hour.`;
  const html = `<p>Hello ${name},</p><p><a href="${resetUrl}">Reset password</a> — expires in 1 hour.</p>`;
  return { subject, html, text };
}

import nodemailer from "nodemailer";
import { env } from "../config/env.js";
let transporter = null;
function getTransporter() {
    if (!env.smtpConfigured)
        return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE, // true for 465, false for 587/STARTTLS
            auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        });
    }
    return transporter;
}
/**
 * Send an email. If SMTP is not configured, the message is logged to the
 * console instead (so the reset flow remains usable in dev/preview).
 * Returns true if handed to an SMTP server, false if only logged.
 */
export async function sendMail({ to, subject, html, text }) {
    const tx = getTransporter();
    if (!tx) {
        console.warn(`[mailer] SMTP not configured — email not sent.\n  To: ${to}\n  Subject: ${subject}\n  ${text}`);
        return false;
    }
    await tx.sendMail({ from: env.SMTP_FROM, to, subject, html, text });
    return true;
}
/** Build the password-reset email content. */
export function buildPasswordResetEmail(name, resetUrl) {
    const subject = "Reset your White Dot admin password";
    const text = `Hello ${name},\n\n` +
        `A password reset was requested for your White Dot admin account.\n` +
        `Open the link below to set a new password. It expires in 1 hour.\n\n` +
        `${resetUrl}\n\n` +
        `If you did not request this, you can safely ignore this email — your password will not change.`;
    const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
    <p style="font-size:15px;">Hello ${name},</p>
    <p style="font-size:15px;line-height:1.5;">A password reset was requested for your White Dot admin account. Set a new password using the button below. This link expires in <strong>1 hour</strong>.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#050706;color:#f5f1e8;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;display:inline-block;">Reset password</a>
    </p>
    <p style="font-size:13px;color:#666;line-height:1.5;">If the button doesn't work, paste this link into your browser:<br><span style="word-break:break-all;color:#444;">${resetUrl}</span></p>
    <p style="font-size:13px;color:#666;line-height:1.5;">If you did not request this, you can safely ignore this email — your password will not change.</p>
  </div>`;
    return { subject, html, text };
}
//# sourceMappingURL=mailer.service.js.map
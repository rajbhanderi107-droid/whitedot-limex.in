interface MailOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
}
/**
 * Send an email. If SMTP is not configured, the message is logged to the
 * console instead (so the reset flow remains usable in dev/preview).
 * Returns true if handed to an SMTP server, false if only logged.
 */
export declare function sendMail({ to, subject, html, text }: MailOptions): Promise<boolean>;
/** Build the password-reset email content. */
export declare function buildPasswordResetEmail(name: string, resetUrl: string): {
    subject: string;
    html: string;
    text: string;
};
export {};
//# sourceMappingURL=mailer.service.d.ts.map
const g = (k: string) => Deno.env.get(k);

export const env = {
  JWT_SECRET: g('JWT_SECRET') ?? 'changeme',
  FRONTEND_URL: g('FRONTEND_URL') ?? 'https://whitedotindia.in',
  FRONTEND_ORIGINS: (g('FRONTEND_ORIGINS') ?? 'https://whitedotindia.in')
    .split(',').map(s => s.trim()).filter(Boolean),
  ADMIN_INQUIRY_EMAIL: g('ADMIN_INQUIRY_EMAIL') ?? g('SMTP_USER') ?? 'office@whitedotindia.in',
  GOOGLE_CLIENT_ID: g('GOOGLE_CLIENT_ID') ?? '',
  GOOGLE_CLIENT_SECRET: g('GOOGLE_CLIENT_SECRET') ?? '',
  RESEND_API_KEY: g('RESEND_API_KEY'),
  SMTP_FROM: g('SMTP_FROM') ?? g('RESEND_FROM') ?? 'no-reply@whitedotindia.in',
  LLM_API_KEY: g('LLM_API_KEY'),
  LLM_BASE_URL: g('LLM_BASE_URL') ?? 'https://api.groq.com/openai/v1',
  LLM_MODEL: g('LLM_MODEL') ?? 'llama-3.3-70b-versatile',
  OPENAI_API_KEY: g('OPENAI_API_KEY'),
  OPENAI_MODEL: g('OPENAI_MODEL') ?? '',
  get smtpConfigured() { return !!this.RESEND_API_KEY; },
  get googleOAuthEnabled() { return !!this.GOOGLE_CLIENT_ID; },
};

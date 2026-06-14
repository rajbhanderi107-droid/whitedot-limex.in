import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  PORT: parseInt(process.env.PORT || "4000", 10),
  NODE_ENV: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  FRONTEND_ORIGINS: (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL || "admin@whitedot.in",
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD,
  ADMIN_INQUIRY_EMAIL: process.env.ADMIN_INQUIRY_EMAIL || "rajbhanderi107@gmail.com",
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,

  // Google OAuth (optional — leave blank to disable Google login)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  // SMTP (optional). If unset, password-reset emails are logged to the console
  // instead of being sent — so the flow still works in dev/preview.
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@whitedot-limex.in",

  // LIMEX Assistant (chat). Provider-agnostic, OpenAI-compatible endpoint.
  // Defaults target Groq's free tier. If LLM_API_KEY is unset, the chat endpoint
  // returns a graceful "unavailable" message instead of erroring.
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_BASE_URL: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1",
  LLM_MODEL: process.env.LLM_MODEL || "llama-3.3-70b-versatile",

  // AI Agents (real Claude-backed runs). ANTHROPIC_API_KEY is set in the Render
  // dashboard (sync: false). If unset, the agent-run endpoint returns a graceful
  // 503 — the rest of the portal is unaffected. ANTHROPIC_MODEL overrides the
  // default for every agent; leave blank to use the per-tier defaults.
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || "",

  get isProduction() {
    return this.NODE_ENV === "production";
  },
  get smtpConfigured() {
    return Boolean(this.SMTP_HOST && this.SMTP_USER && this.SMTP_PASS);
  },

  get googleOAuthEnabled() {
    return Boolean(this.GOOGLE_CLIENT_ID);
  },
  get googleCodeOAuthEnabled() {
    return Boolean(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET);
  },
} as const;

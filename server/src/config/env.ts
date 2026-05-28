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

  get isProduction() {
    return this.NODE_ENV === "production";
  },
} as const;

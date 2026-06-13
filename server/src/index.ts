import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { startGoogleSyncCron } from "./services/googleSync.service.js";

const server = app.listen(env.PORT, () => {
  console.log(`
╭─────────────────────────────────────────╮
│  WhiteDot Backend                       │
│  Mode:  ${env.NODE_ENV.padEnd(30)}  │
│  Port:  ${String(env.PORT).padEnd(30)}  │
│  CORS:  ${env.FRONTEND_URL.padEnd(30).slice(0, 30)}  │
╰─────────────────────────────────────────╯
  `);

  // ─── Keep-alive self-ping (Render free tier sleeps after 15 min) ──
  // Ping own health endpoint every 14 min to prevent cold starts.
  if (env.isProduction) {
    const KEEP_ALIVE_MS = 14 * 60 * 1000; // 14 minutes
    const selfUrl = env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT}`;
    setInterval(() => {
      fetch(`${selfUrl}/api/health`).catch(() => {});
    }, KEEP_ALIVE_MS);
    console.log(`  Keep-alive ping every 14m → ${selfUrl}/api/health`);
  }

  // ─── Google data auto-sync cron (every 6h) ──
  startGoogleSyncCron();
});

// ─── Graceful shutdown ──────────────────────────
const shutdown = async (signal: string) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);

  // 1. Stop accepting new connections
  server.close(async () => {
    try {
      // 2. Disconnect Prisma (releases DB connection pool)
      await prisma.$disconnect();
      console.log("  Prisma disconnected.");
    } catch (err) {
      console.error("  Error disconnecting Prisma:", err);
    }
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown stalls
  setTimeout(() => {
    console.error("  Forced shutdown after 10s timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Uncaught error safety net ──────────────────
process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
  // Don't crash — log and continue serving
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
  // Crash on uncaught exceptions — something is fundamentally wrong
  shutdown("UNCAUGHT_EXCEPTION");
});

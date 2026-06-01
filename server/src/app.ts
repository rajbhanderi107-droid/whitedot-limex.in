import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import { requestTimeout } from "./middleware/timeout.middleware.js";
import { adminLimiter } from "./middleware/rateLimit.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { prisma } from "./config/prisma.js";

const app = express();

app.set("trust proxy", 1);

// ─── Security headers (hardened) ────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin API calls
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

app.use(compression());

// ─── CORS — multi-origin support ────────────────
const ALLOWED_ORIGINS = [...env.FRONTEND_ORIGINS];
if (!env.isProduction) {
  ALLOWED_ORIGINS.push("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, health checks, mobile)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o) || o.startsWith(origin))) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // Preflight cache 24h
  }),
);

// ─── Body parsing ───────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request logging (production: concise, dev: verbose) ──
app.use(requestLogger);
app.use(morgan(env.isProduction ? "combined" : "dev"));

// ─── Request timeout (30s for all routes) ───────
app.use(requestTimeout(30_000));

// ─── Root landing — friendly status for browsers hitting / ──
app.get("/", (_req, res) => {
  res.json({
    service: "White Dot LLP — LIMEX CRM API",
    status: "ok",
    docs: "/api/health for health check",
  });
});

// ─── Health check (verifies DB connectivity) ─
app.get("/api/health", async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "connected",
      latency: `${Date.now() - start}ms`,
    });
  } catch {
    res.status(503).json({
      success: false,
      status: "degraded",
      timestamp: new Date().toISOString(),
      db: "disconnected",
      latency: `${Date.now() - start}ms`,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "WhiteDot API healthy" });
});

// ─── Routes ─────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", adminLimiter, adminRoutes);

// ─── 404 for unknown API routes ─────────────────
app.use(/^\/api(?:\/.*)?$/, (_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "API endpoint not found" },
  });
});

// ─── Global error handler (must be last) ────────
app.use(errorHandler);

export default app;

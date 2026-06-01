import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

/**
 * Lightweight request logger.
 * Production: one-line summary per request (method, path, status, duration).
 * Development: adds query params and user info for debugging.
 *
 * Skips health-check spam so logs stay useful.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip noisy health pings from keep-alive and monitors
  if (req.path === "/api/health" || req.path === "/") {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.originalUrl;
    const userId = (req as any).currentUser?.id || "-";

    // Color-code by status range for easier scanning
    const statusTag = status >= 500 ? "ERR" : status >= 400 ? "WARN" : "OK";

    if (env.isProduction) {
      // Concise structured line — easy to parse with log aggregators
      console.log(
        `[${statusTag}] ${method} ${path} → ${status} (${duration}ms) user=${userId}`,
      );
    } else {
      // Verbose in development
      console.log(
        `[${statusTag}] ${method} ${path} → ${status} (${duration}ms) user=${userId}`,
        req.query && Object.keys(req.query).length > 0 ? `query=${JSON.stringify(req.query)}` : "",
      );
    }
  });

  next();
}

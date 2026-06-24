import type { Request, Response, NextFunction } from "express";
/**
 * Lightweight request logger.
 * Production: one-line summary per request (method, path, status, duration).
 * Development: adds query params and user info for debugging.
 *
 * Skips health-check spam so logs stay useful.
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=logger.middleware.d.ts.map
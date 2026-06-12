import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { recordSecurityEvent } from "../services/securityEvents.service.js";

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On failure, the ZodError is forwarded to the error handler.
 *
 * Rejected payloads on PUBLIC endpoints are recorded as security telemetry —
 * malformed bodies against an open endpoint are how probing usually looks.
 * Admin-side rejections are just typos by logged-in staff, so they're skipped.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      if ((req.baseUrl + req.path).startsWith("/api/public")) {
        recordSecurityEvent({
          kind: "VALIDATION_REJECTED",
          req,
          severity: "LOW",
          detail: result.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
            .join("; "),
        });
      }
      return next(result.error);  // caught by errorHandler as ZodError
    }
    req.body = result.data;  // replace body with parsed/stripped data
    next();
  };
}

import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On failure, the ZodError is forwarded to the error handler.
 *
 * Rejected payloads on PUBLIC endpoints are recorded as security telemetry —
 * malformed bodies against an open endpoint are how probing usually looks.
 * Admin-side rejections are just typos by logged-in staff, so they're skipped.
 */
export declare function validate(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.middleware.d.ts.map
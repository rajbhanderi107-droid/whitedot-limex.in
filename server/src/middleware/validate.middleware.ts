import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On failure, the ZodError is forwarded to the error handler.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error);  // caught by errorHandler as ZodError
    }
    req.body = result.data;  // replace body with parsed/stripped data
    next();
  };
}

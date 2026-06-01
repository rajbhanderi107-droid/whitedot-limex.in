import type { Request, Response, NextFunction } from "express";

/**
 * Request timeout middleware.
 * Aborts if a response hasn't been sent within `ms` milliseconds.
 * Prevents hung Prisma queries or external calls from blocking the server.
 */
export function requestTimeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: {
            code: "REQUEST_TIMEOUT",
            message: "Request took too long. Please try again.",
          },
        });
      }
    }, ms);

    // Clear timeout when response finishes (success or error)
    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
}

import type { Request, Response, NextFunction } from "express";
/**
 * Request timeout middleware.
 * Aborts if a response hasn't been sent within `ms` milliseconds.
 * Prevents hung Prisma queries or external calls from blocking the server.
 */
export declare function requestTimeout(ms: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=timeout.middleware.d.ts.map
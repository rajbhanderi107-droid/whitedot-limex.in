import type { Request, Response, NextFunction } from "express";
/** Application-level error with an HTTP status code */
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, code: string, message: string);
}
/** Central error handler — must be registered LAST on the Express app */
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=error.middleware.d.ts.map
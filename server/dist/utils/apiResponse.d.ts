import type { Response } from "express";
/** Standard success response */
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response<any, Record<string, any>>;
/** Standard error response */
export declare function sendError(res: Response, code: string, message: string, statusCode?: number): Response<any, Record<string, any>>;
/** Paginated list response */
export declare function sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number): Response<any, Record<string, any>>;
//# sourceMappingURL=apiResponse.d.ts.map
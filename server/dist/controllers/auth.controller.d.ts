import type { Request, Response } from "express";
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function me(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Request a password reset. Always responds with the same generic success
 * message so the endpoint never reveals whether an email is registered.
 */
export declare function forgotPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/** Check whether a reset token is valid (exists, not used, not expired). */
export declare function verifyResetToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/** Complete a password reset using a valid token. */
export declare function resetPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map
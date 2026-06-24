import type { Request, Response } from "express";
/**
 * POST /api/auth/google
 * Body: { accessToken: string } or legacy { code: string }
 *
 * Exchanges a browser-issued Google access token for a session.
 * Only allows login for existing, active users — no auto-registration.
 */
export declare function googleLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/auth/google/config
 * Returns the Google OAuth client ID + redirect URI for the frontend.
 * No secrets exposed.
 */
export declare function googleConfig(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=googleAuth.controller.d.ts.map
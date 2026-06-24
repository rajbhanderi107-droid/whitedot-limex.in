import type { Response } from "express";
export interface JWTPayload {
    userId: string;
    role: string;
}
export declare function signToken(payload: JWTPayload): string;
export declare function verifyToken(token: string): JWTPayload;
/** Attach JWT as a secure HTTP-only cookie */
export declare function setAuthCookie(res: Response, token: string): void;
/** Clear the auth cookie on logout */
export declare function clearAuthCookie(res: Response): void;
//# sourceMappingURL=tokens.d.ts.map
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
const TOKEN_EXPIRY = "7d";
export function signToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
/** Attach JWT as a secure HTTP-only cookie */
export function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
    });
}
/** Clear the auth cookie on logout */
export function clearAuthCookie(res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        path: "/",
    });
}
//# sourceMappingURL=tokens.js.map
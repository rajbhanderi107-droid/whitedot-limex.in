import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";

export interface JWTPayload {
  userId: string;
  role: string;
}

const TOKEN_EXPIRY = "7d";

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}

/** Attach JWT as a secure HTTP-only cookie */
export function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

/** Clear the auth cookie on logout */
export function clearAuthCookie(res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
  });
}

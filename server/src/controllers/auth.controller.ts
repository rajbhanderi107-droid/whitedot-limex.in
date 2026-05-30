import crypto from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/tokens.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { sendMail, buildPasswordResetEmail } from "../services/mailer.service.js";
import { AppError } from "../middleware/error.middleware.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Hash a raw reset token for storage/lookup (never store the raw token). */
function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  if (!user.isActive) throw new AppError(403, "ACCOUNT_INACTIVE", "Account is inactive. Contact an administrator.");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const token = signToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);

  await logActivity({
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  }, "Login successful");
}

export async function logout(req: Request, res: Response) {
  if (req.currentUser) {
    await logActivity({
      userId: req.currentUser.id,
      action: "LOGOUT",
      entityType: "USER",
      entityId: req.currentUser.id,
    });
  }
  clearAuthCookie(res);
  return sendSuccess(res, null, "Logged out");
}

export async function me(req: Request, res: Response) {
  if (!req.currentUser) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");
  return sendSuccess(res, req.currentUser);
}

/**
 * Request a password reset. Always responds with the same generic success
 * message so the endpoint never reveals whether an email is registered.
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const genericMessage = "If that email is registered, a reset link is on its way.";

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    // Invalidate any previous unused tokens for this user.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashResetToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const base = env.FRONTEND_URL.replace(/\/+$/, "");
    const resetUrl = `${base}/#/admin/reset-password?token=${rawToken}`;
    const mail = buildPasswordResetEmail(user.name, resetUrl);
    await sendMail({ to: user.email, ...mail });

    await logActivity({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "USER",
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  return sendSuccess(res, null, genericMessage);
}

/** Check whether a reset token is valid (exists, not used, not expired). */
export async function verifyResetToken(req: Request, res: Response) {
  const token = String(req.params.token || "");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  const valid = Boolean(record && !record.usedAt && record.expiresAt > new Date());
  return sendSuccess(res, { valid });
}

/** Complete a password reset using a valid token. */
export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    throw new AppError(400, "INVALID_TOKEN", "This reset link is invalid or has expired. Request a new one.");
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate any other outstanding tokens for this user.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  await logActivity({
    userId: record.userId,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "USER",
    entityId: record.userId,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(res, null, "Password updated. You can now sign in with your new password.");
}

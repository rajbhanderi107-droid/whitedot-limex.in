import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { verifyPassword } from "../utils/password.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/tokens.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { AppError } from "../middleware/error.middleware.js";

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

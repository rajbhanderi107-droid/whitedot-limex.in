import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";

export async function listUsers(req: Request, res: Response) {
  const { page, limit, search } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return sendPaginated(res, data, total, page, limit);
}

export async function createUser(req: Request, res: Response) {
  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) throw new AppError(409, "EMAIL_EXISTS", "A user with this email already exists");

  const passwordHash = await hashPassword(req.body.password);

  const user = await prisma.user.create({
    data: { name: req.body.name, email: req.body.email, passwordHash, role: req.body.role },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  await logActivity({
    userId: req.currentUser!.id,
    action: "CREATE_USER",
    entityType: "USER",
    entityId: user.id,
  });

  return sendSuccess(res, user, "User created", 201);
}

export async function updateUser(req: Request, res: Response) {
  const id = paramId(req);
  const data: Record<string, unknown> = { ...req.body };
  if (data.password) {
    data.passwordHash = await hashPassword(data.password as string);
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
  });

  await logActivity({
    userId: req.currentUser!.id,
    action: "UPDATE_USER",
    entityType: "USER",
    entityId: user.id,
    metadata: { ...req.body, password: undefined },
  });

  return sendSuccess(res, user, "User updated");
}

export async function deleteUser(req: Request, res: Response) {
  const id = paramId(req);

  if (id === req.currentUser!.id) {
    throw new AppError(400, "CANNOT_DELETE_SELF", "You cannot delete your own account");
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!target) throw new AppError(404, "USER_NOT_FOUND", "User not found");

  // Never allow removing the last remaining super admin.
  if (target.role === "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdmins <= 1) {
      throw new AppError(400, "LAST_SUPER_ADMIN", "Cannot delete the last super admin");
    }
  }

  await prisma.user.delete({ where: { id } });

  await logActivity({
    userId: req.currentUser!.id,
    action: "DELETE_USER",
    entityType: "USER",
    entityId: id,
    metadata: { name: target.name, email: target.email, role: target.role },
  });

  return sendSuccess(res, { id }, "User deleted");
}

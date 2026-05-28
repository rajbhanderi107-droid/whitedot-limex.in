import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";

export async function listNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.currentUser!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.currentUser!.id, isRead: false },
  });
  return sendSuccess(res, { notifications, unreadCount });
}

export async function markRead(req: Request, res: Response) {
  const id = paramId(req);
  await prisma.notification.update({
    where: { id, userId: req.currentUser!.id },
    data: { isRead: true },
  });
  return sendSuccess(res, null, "Marked as read");
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.currentUser!.id, isRead: false },
    data: { isRead: true },
  });
  return sendSuccess(res, null, "All notifications marked as read");
}

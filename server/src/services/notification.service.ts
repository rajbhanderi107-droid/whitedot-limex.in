import type { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export async function createNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
}) {
  return prisma.notification.create({ data: params });
}

/** Notify all admins/super-admins about an event */
export async function notifyAdmins(title: string, message: string, type: NotificationType) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a: { id: string }) => ({ title, message, type, userId: a.id })),
  });
}

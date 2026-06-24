import { prisma } from "../config/prisma.js";
export async function createNotification(params) {
    return prisma.notification.create({ data: params });
}
/** Notify all admins/super-admins about an event */
export async function notifyAdmins(title, message, type) {
    const admins = await prisma.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "ADMIN"] }, isActive: true },
        select: { id: true },
    });
    if (admins.length === 0)
        return;
    await prisma.notification.createMany({
        data: admins.map((a) => ({ title, message, type, userId: a.id })),
    });
}
//# sourceMappingURL=notification.service.js.map
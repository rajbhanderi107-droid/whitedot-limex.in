import type { NotificationType } from "@prisma/client";
export declare function createNotification(params: {
    title: string;
    message: string;
    type: NotificationType;
    userId: string;
}): Promise<{
    id: string;
    createdAt: Date;
    message: string;
    title: string;
    type: import("@prisma/client").$Enums.NotificationType;
    userId: string;
    isRead: boolean;
}>;
/** Notify all admins/super-admins about an event */
export declare function notifyAdmins(title: string, message: string, type: NotificationType): Promise<void>;
//# sourceMappingURL=notification.service.d.ts.map
import { prisma } from "../config/prisma.js";
export async function logActivity(params) {
    const data = {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? params.metadata : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        userId: params.userId,
    };
    return prisma.activityLog.create({ data });
}
//# sourceMappingURL=activity.service.js.map
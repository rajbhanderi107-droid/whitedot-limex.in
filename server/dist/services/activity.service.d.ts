import type { ActivityEntityType, Prisma } from "@prisma/client";
export declare function logActivity(params: {
    userId?: string;
    action: string;
    entityType: ActivityEntityType;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    action: string;
    entityType: import("@prisma/client").$Enums.ActivityEntityType;
    entityId: string | null;
    metadata: Prisma.JsonValue | null;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string | null;
}>;
//# sourceMappingURL=activity.service.d.ts.map
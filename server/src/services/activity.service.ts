import type { ActivityEntityType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export async function logActivity(params: {
  userId?: string;
  action: string;
  entityType: ActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const data: Prisma.ActivityLogUncheckedCreateInput = {
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    userId: params.userId,
  };
  return prisma.activityLog.create({ data });
}

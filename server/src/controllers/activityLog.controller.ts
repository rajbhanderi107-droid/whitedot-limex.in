import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendPaginated, sendSuccess } from "../utils/apiResponse.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";

export async function listActivityLogs(req: Request, res: Response) {
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count(),
  ]);

  return sendPaginated(res, data, total, page, limit);
}

/** Delete a single activity-log entry. SUPER_ADMIN only (enforced at the route). */
export async function deleteActivityLog(req: Request, res: Response) {
  const id = paramId(req);
  await prisma.activityLog.delete({ where: { id } });
  return sendSuccess(res, null, "Activity entry deleted");
}

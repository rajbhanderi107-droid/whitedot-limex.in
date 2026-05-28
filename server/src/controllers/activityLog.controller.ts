import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendPaginated } from "../utils/apiResponse.js";
import { paginationSchema } from "../validators/admin.validator.js";

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

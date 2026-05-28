import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";

export async function listFollowUps(req: Request, res: Response) {
  const { page, limit, status, sortBy, sortOrder } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.followUpTask.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        company: { select: { id: true, companyName: true } },
        inquiry: { select: { id: true, name: true } },
        quoteRequest: { select: { id: true, contactPerson: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.followUpTask.count({ where }),
  ]);

  return sendPaginated(res, data, total, page, limit);
}

export async function createFollowUp(req: Request, res: Response) {
  const task = await prisma.followUpTask.create({
    data: { ...req.body, dueDate: new Date(req.body.dueDate) },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  await logActivity({
    userId: req.currentUser!.id,
    action: "CREATE_FOLLOW_UP",
    entityType: "INQUIRY",
    entityId: task.id,
  });

  return sendSuccess(res, task, "Follow-up created", 201);
}

export async function updateFollowUp(req: Request, res: Response) {
  const id = paramId(req);
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);

  const task = await prisma.followUpTask.update({ where: { id }, data });

  await logActivity({
    userId: req.currentUser!.id,
    action: "UPDATE_FOLLOW_UP",
    entityType: "INQUIRY",
    entityId: task.id,
    metadata: req.body,
  });

  return sendSuccess(res, task, "Follow-up updated");
}

export async function deleteFollowUp(req: Request, res: Response) {
  const id = paramId(req);
  await prisma.followUpTask.delete({ where: { id } });
  return sendSuccess(res, null, "Follow-up deleted");
}

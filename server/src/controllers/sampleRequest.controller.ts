import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";

export async function listSampleRequests(req: Request, res: Response) {
  const { page, limit, search, status, sortBy, sortOrder } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.sampleRequest.findMany({
      where,
      include: { company: { select: { id: true, companyName: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.sampleRequest.count({ where }),
  ]);

  return sendPaginated(res, data, total, page, limit);
}

export async function getSampleRequest(req: Request, res: Response) {
  const id = paramId(req);
  const sample = await prisma.sampleRequest.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, companyName: true } },
      adminNotes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      followUpTasks: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!sample) throw new AppError(404, "NOT_FOUND", "Sample request not found");
  return sendSuccess(res, sample);
}

export async function updateSampleRequest(req: Request, res: Response) {
  const id = paramId(req);
  const sample = await prisma.sampleRequest.update({ where: { id }, data: req.body });

  await logActivity({
    userId: req.currentUser!.id,
    action: "UPDATE_SAMPLE_REQUEST",
    entityType: "SAMPLE_REQUEST",
    entityId: sample.id,
    metadata: req.body,
  });

  return sendSuccess(res, sample, "Sample request updated");
}

export async function deleteSampleRequest(req: Request, res: Response) {
  const id = paramId(req);
  await prisma.sampleRequest.delete({ where: { id } });

  await logActivity({
    userId: req.currentUser!.id,
    action: "DELETE_SAMPLE_REQUEST",
    entityType: "SAMPLE_REQUEST",
    entityId: id,
  });

  return sendSuccess(res, null, "Sample request deleted");
}

import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";

export async function listQuoteRequests(req: Request, res: Response) {
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
    prisma.quoteRequest.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true } }, company: { select: { id: true, companyName: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.quoteRequest.count({ where }),
  ]);

  return sendPaginated(res, data, total, page, limit);
}

export async function getQuoteRequest(req: Request, res: Response) {
  const id = paramId(req);
  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, companyName: true } },
      adminNotes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      followUpTasks: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!quote) throw new AppError(404, "NOT_FOUND", "Quote request not found");
  return sendSuccess(res, quote);
}

export async function updateQuoteRequest(req: Request, res: Response) {
  const id = paramId(req);
  const quote = await prisma.quoteRequest.update({ where: { id }, data: req.body });

  await logActivity({
    userId: req.currentUser!.id,
    action: "UPDATE_QUOTE_REQUEST",
    entityType: "QUOTE_REQUEST",
    entityId: quote.id,
    metadata: req.body,
  });

  return sendSuccess(res, quote, "Quote request updated");
}

export async function deleteQuoteRequest(req: Request, res: Response) {
  const id = paramId(req);
  await prisma.quoteRequest.delete({ where: { id } });

  await logActivity({
    userId: req.currentUser!.id,
    action: "DELETE_QUOTE_REQUEST",
    entityType: "QUOTE_REQUEST",
    entityId: id,
  });

  return sendSuccess(res, null, "Quote request deleted");
}

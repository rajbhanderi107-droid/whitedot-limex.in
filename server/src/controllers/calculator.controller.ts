import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";

export async function listCalculatorSubmissions(req: Request, res: Response) {
  const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.calculatorSubmission.findMany({
      where,
      include: { company: { select: { id: true, companyName: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.calculatorSubmission.count({ where }),
  ]);

  return sendPaginated(res, data, total, page, limit);
}

export async function getCalculatorSubmission(req: Request, res: Response) {
  const id = paramId(req);
  const submission = await prisma.calculatorSubmission.findUnique({
    where: { id },
    include: { company: { select: { id: true, companyName: true } } },
  });
  if (!submission) throw new AppError(404, "NOT_FOUND", "Calculator submission not found");
  return sendSuccess(res, submission);
}

export async function convertToLead(req: Request, res: Response) {
  const id = paramId(req);
  const submission = await prisma.calculatorSubmission.findUnique({ where: { id } });
  if (!submission) throw new AppError(404, "NOT_FOUND", "Calculator submission not found");

  const inquiry = await prisma.inquiry.create({
    data: {
      name: submission.contactPerson || "Calculator Lead",
      email: submission.email || "",
      phone: submission.phone,
      companyName: submission.companyName,
      inquiryType: "Calculator Conversion",
      message: `Converted from calculator: ${submission.plasticType || "N/A"}, estimated ${submission.limexReplacementPercentage || 0}% replacement`,
      sourcePage: "calculator",
      companyId: submission.companyId,
    },
  });

  await prisma.calculatorSubmission.update({
    where: { id },
    data: { convertedToLead: true },
  });

  await logActivity({
    userId: req.currentUser!.id,
    action: "CONVERT_CALCULATOR_TO_LEAD",
    entityType: "CALCULATOR_SUBMISSION",
    entityId: submission.id,
    metadata: { inquiryId: inquiry.id },
  });

  return sendSuccess(res, { inquiryId: inquiry.id }, "Converted to lead");
}

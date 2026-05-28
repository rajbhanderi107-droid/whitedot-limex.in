import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";

export async function listSettings(_req: Request, res: Response) {
  const settings = await prisma.websiteSetting.findMany({
    orderBy: { key: "asc" },
    include: { updatedBy: { select: { id: true, name: true } } },
  });
  return sendSuccess(res, settings);
}

export async function updateSetting(req: Request, res: Response) {
  const key = paramId(req, "key");
  const setting = await prisma.websiteSetting.findUnique({ where: { key } });
  if (!setting) throw new AppError(404, "NOT_FOUND", "Setting not found");

  const updated = await prisma.websiteSetting.update({
    where: { key },
    data: { value: req.body.value, updatedById: req.currentUser!.id },
  });

  await logActivity({
    userId: req.currentUser!.id,
    action: "UPDATE_SETTING",
    entityType: "WEBSITE_SETTING",
    entityId: updated.id,
    metadata: { key, value: req.body.value },
  });

  return sendSuccess(res, updated, "Setting updated");
}

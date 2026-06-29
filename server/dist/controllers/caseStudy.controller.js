import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { AppError } from "../middleware/error.middleware.js";

const CS_KEY = "case_study_products";

export async function getCaseStudies(_req, res) {
  const setting = await prisma.websiteSetting.findUnique({ where: { key: CS_KEY } });
  if (!setting || !setting.value) {
    return sendSuccess(res, { products: null }, "No case-study data in DB — engine uses specs.json fallback");
  }
  return sendSuccess(res, JSON.parse(setting.value));
}

export async function updateCaseStudies(req, res) {
  const { products } = req.body;
  if (!products || typeof products !== "object" || Array.isArray(products)) {
    throw new AppError(400, "INVALID_DATA", "Body must contain { products: { ... } }");
  }
  // Basic sanity: each product must have id, name, composition
  for (const [id, p] of Object.entries(products)) {
    if (!p || typeof p !== "object") throw new AppError(400, "INVALID_DATA", `Product "${id}" is not an object`);
    const prod = p;
    if (!prod.name) throw new AppError(400, "INVALID_DATA", `Product "${id}" is missing name`);
    if (!Array.isArray(prod.composition)) throw new AppError(400, "INVALID_DATA", `Product "${id}" is missing composition array`);
  }
  const value = JSON.stringify({ products });
  const updated = await prisma.websiteSetting.upsert({
    where: { key: CS_KEY },
    update: { value, updatedById: req.currentUser.id },
    create: {
      key: CS_KEY,
      value,
      type: "JSON",
      description: "Case study product specifications — managed via the admin portal",
      updatedById: req.currentUser.id,
    },
  });
  await logActivity({
    userId: req.currentUser.id,
    action: "UPDATE_CASE_STUDIES",
    entityType: "WEBSITE_SETTING",
    entityId: updated.id,
    metadata: { productCount: Object.keys(products).length },
  });
  return sendSuccess(res, { products }, "Case studies saved");
}

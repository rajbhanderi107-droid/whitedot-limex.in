import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";
const PUBLIC_LOADING_SETTING = {
    key: "public_loading_enabled",
    value: "true",
    type: "BOOLEAN",
    description: "Show the loading page to public visitors while admins preview and work behind it",
};
async function ensurePublicLoadingSetting() {
    await prisma.websiteSetting.upsert({
        where: { key: PUBLIC_LOADING_SETTING.key },
        update: {},
        create: PUBLIC_LOADING_SETTING,
    });
}
export async function listSettings(_req, res) {
    await ensurePublicLoadingSetting();
    const settings = await prisma.websiteSetting.findMany({
        orderBy: { key: "asc" },
        include: { updatedBy: { select: { id: true, name: true } } },
    });
    return sendSuccess(res, settings);
}
export async function updateSetting(req, res) {
    const key = paramId(req, "key");
    const setting = await prisma.websiteSetting.findUnique({ where: { key } });
    if (!setting)
        throw new AppError(404, "NOT_FOUND", "Setting not found");
    const updated = await prisma.websiteSetting.update({
        where: { key },
        data: { value: req.body.value, updatedById: req.currentUser.id },
    });
    await logActivity({
        userId: req.currentUser.id,
        action: "UPDATE_SETTING",
        entityType: "WEBSITE_SETTING",
        entityId: updated.id,
        metadata: { key, value: req.body.value },
    });
    return sendSuccess(res, updated, "Setting updated");
}
const BRAND_LOGO_KEY = "brand_logo";
/**
 * Upsert the site logo. Stored as a base64 data URL (uploaded image) or an
 * http(s) URL; an empty value resets to the bundled default. Upsert is used so
 * this works even on databases seeded before the brand_logo key existed.
 */
export async function updateBrandLogo(req, res) {
    const value = String(req.body.value ?? "");
    const updated = await prisma.websiteSetting.upsert({
        where: { key: BRAND_LOGO_KEY },
        update: { value, updatedById: req.currentUser.id },
        create: {
            key: BRAND_LOGO_KEY,
            value,
            type: "TEXT",
            description: "Website logo (uploaded image, applies across the site)",
            updatedById: req.currentUser.id,
        },
    });
    await logActivity({
        userId: req.currentUser.id,
        action: value ? "UPDATE_BRAND_LOGO" : "RESET_BRAND_LOGO",
        entityType: "WEBSITE_SETTING",
        entityId: updated.id,
    });
    return sendSuccess(res, updated, value ? "Logo updated" : "Logo reset to default");
}
//# sourceMappingURL=settings.controller.js.map
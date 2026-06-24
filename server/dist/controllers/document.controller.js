import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
export async function listDocuments(req, res) {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }
    const category = req.query.category;
    if (category && typeof category === "string")
        where.category = category;
    const [data, total] = await Promise.all([
        prisma.documentAsset.findMany({
            where,
            include: { uploadedBy: { select: { id: true, name: true } }, company: { select: { id: true, companyName: true } } },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.documentAsset.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
}
export async function createDocument(req, res) {
    const doc = await prisma.documentAsset.create({
        data: { ...req.body, uploadedById: req.currentUser.id },
    });
    await logActivity({
        userId: req.currentUser.id,
        action: "CREATE_DOCUMENT",
        entityType: "DOCUMENT",
        entityId: doc.id,
    });
    return sendSuccess(res, doc, "Document created", 201);
}
export async function updateDocument(req, res) {
    const id = paramId(req);
    const doc = await prisma.documentAsset.update({ where: { id }, data: req.body });
    return sendSuccess(res, doc, "Document updated");
}
export async function deleteDocument(req, res) {
    const id = paramId(req);
    await prisma.documentAsset.delete({ where: { id } });
    await logActivity({
        userId: req.currentUser.id,
        action: "DELETE_DOCUMENT",
        entityType: "DOCUMENT",
        entityId: id,
    });
    return sendSuccess(res, null, "Document deleted");
}
//# sourceMappingURL=document.controller.js.map
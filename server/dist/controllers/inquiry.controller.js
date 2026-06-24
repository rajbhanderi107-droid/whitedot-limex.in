import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";
export async function listInquiries(req, res) {
    const { page, limit, search, status, priority, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
        ];
    }
    const [data, total] = await Promise.all([
        prisma.inquiry.findMany({
            where,
            include: { assignedTo: { select: { id: true, name: true } }, company: { select: { id: true, companyName: true } } },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.inquiry.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
}
export async function getInquiry(req, res) {
    const id = paramId(req);
    const inquiry = await prisma.inquiry.findUnique({
        where: { id },
        include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            company: { select: { id: true, companyName: true } },
            adminNotes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
            followUpTasks: { orderBy: { dueDate: "asc" } },
        },
    });
    if (!inquiry)
        throw new AppError(404, "NOT_FOUND", "Inquiry not found");
    return sendSuccess(res, inquiry);
}
export async function updateInquiry(req, res) {
    const id = paramId(req);
    const inquiry = await prisma.inquiry.update({ where: { id }, data: req.body });
    await logActivity({
        userId: req.currentUser.id,
        action: "UPDATE_INQUIRY",
        entityType: "INQUIRY",
        entityId: inquiry.id,
        metadata: req.body,
    });
    return sendSuccess(res, inquiry, "Inquiry updated");
}
export async function deleteInquiry(req, res) {
    const id = paramId(req);
    await prisma.inquiry.delete({ where: { id } });
    await logActivity({
        userId: req.currentUser.id,
        action: "DELETE_INQUIRY",
        entityType: "INQUIRY",
        entityId: id,
    });
    return sendSuccess(res, null, "Inquiry deleted");
}
export async function addInquiryNote(req, res) {
    const id = paramId(req);
    const note = await prisma.adminNote.create({
        data: {
            content: req.body.content,
            createdById: req.currentUser.id,
            inquiryId: id,
        },
        include: { createdBy: { select: { id: true, name: true } } },
    });
    return sendSuccess(res, note, "Note added", 201);
}
//# sourceMappingURL=inquiry.controller.js.map
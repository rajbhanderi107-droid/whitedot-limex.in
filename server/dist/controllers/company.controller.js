import { prisma } from "../config/prisma.js";
import { sendSuccess, sendPaginated } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { paginationSchema } from "../validators/admin.validator.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/error.middleware.js";
export async function listCompanies(req, res) {
    const { page, limit, search, status, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = {};
    if (status)
        where.status = status;
    if (search) {
        where.OR = [
            { companyName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
        ];
    }
    const [data, total] = await Promise.all([
        prisma.company.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take: limit }),
        prisma.company.count({ where }),
    ]);
    return sendPaginated(res, data, total, page, limit);
}
export async function getCompany(req, res) {
    const id = paramId(req);
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            inquiries: { orderBy: { createdAt: "desc" }, take: 10 },
            quoteRequests: { orderBy: { createdAt: "desc" }, take: 10 },
            sampleRequests: { orderBy: { createdAt: "desc" }, take: 10 },
            adminNotes: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
            followUpTasks: { orderBy: { dueDate: "asc" } },
            documents: { orderBy: { createdAt: "desc" } },
        },
    });
    if (!company)
        throw new AppError(404, "NOT_FOUND", "Company not found");
    return sendSuccess(res, company);
}
export async function createCompany(req, res) {
    const company = await prisma.company.create({ data: req.body });
    await logActivity({
        userId: req.currentUser.id,
        action: "CREATE_COMPANY",
        entityType: "COMPANY",
        entityId: company.id,
    });
    return sendSuccess(res, company, "Company created", 201);
}
export async function updateCompany(req, res) {
    const id = paramId(req);
    const company = await prisma.company.update({ where: { id }, data: req.body });
    await logActivity({
        userId: req.currentUser.id,
        action: "UPDATE_COMPANY",
        entityType: "COMPANY",
        entityId: company.id,
        metadata: req.body,
    });
    return sendSuccess(res, company, "Company updated");
}
export async function deleteCompany(req, res) {
    const id = paramId(req);
    await prisma.company.delete({ where: { id } });
    await logActivity({
        userId: req.currentUser.id,
        action: "DELETE_COMPANY",
        entityType: "COMPANY",
        entityId: id,
    });
    return sendSuccess(res, null, "Company deleted");
}
//# sourceMappingURL=company.controller.js.map
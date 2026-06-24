import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { logActivity } from "../services/activity.service.js";
const json = z.record(z.unknown()).optional();
const RESOURCES = {
    products: {
        entityType: "PORTAL",
        searchField: "name",
        schema: z.object({
            name: z.string().min(1).max(200),
            code: z.string().max(60).optional().nullable(),
            category: z.string().max(120).optional().nullable(),
            status: z.enum(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]).optional(),
            data: json,
        }).strip(),
        delegate: () => prisma.product,
    },
    inventory: {
        entityType: "PORTAL",
        searchField: "name",
        schema: z.object({
            name: z.string().min(1).max(200),
            sku: z.string().max(60).optional().nullable(),
            location: z.string().max(120).optional().nullable(),
            totalStock: z.number().int().min(0).optional(),
            reservedStock: z.number().int().min(0).optional(),
            sampleStock: z.number().int().min(0).optional(),
            reorderPoint: z.number().int().min(0).optional(),
            data: json,
        }).strip(),
        delegate: () => prisma.inventoryItem,
    },
    quotations: {
        entityType: "PORTAL",
        searchField: "customer",
        schema: z.object({
            number: z.string().max(40).optional().nullable(),
            customer: z.string().min(1).max(200),
            leadId: z.string().max(60).optional().nullable(),
            status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "REVISED", "EXPIRED", "CONVERTED"]).optional(),
            gstPct: z.number().min(0).max(100).optional(),
            transport: z.number().min(0).optional(),
            discount: z.number().min(0).optional(),
            subtotal: z.number().min(0).optional(),
            total: z.number().min(0).optional(),
            items: z.array(z.object({
                product: z.string().max(200),
                qty: z.number().min(0),
                rate: z.number().min(0),
            })).optional(),
            validUntil: z.string().datetime().optional().nullable(),
            notes: z.string().max(4000).optional().nullable(),
        }).strip(),
        delegate: () => prisma.quotation,
    },
    orders: {
        entityType: "PORTAL",
        searchField: "customer",
        schema: z.object({
            quotationId: z.string().max(60).optional().nullable(),
            customer: z.string().min(1).max(200),
            amount: z.number().min(0).optional(),
            status: z.enum(["CREATED", "CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED", "CANCELLED"]).optional(),
            invoiceNumber: z.string().max(60).optional().nullable(),
            paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "OVERDUE"]).optional(),
            data: json,
        }).strip(),
        delegate: () => prisma.order,
    },
    campaigns: {
        entityType: "PORTAL",
        searchField: "name",
        schema: z.object({
            name: z.string().min(1).max(200),
            type: z.string().max(120).optional().nullable(),
            channel: z.string().max(120).optional().nullable(),
            status: z.enum(["DRAFT", "PENDING_APPROVAL", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
            budget: z.number().min(0).optional(),
            spend: z.number().min(0).optional(),
            leads: z.number().int().min(0).optional(),
            startDate: z.string().datetime().optional().nullable(),
            endDate: z.string().datetime().optional().nullable(),
            data: json,
        }).strip(),
        delegate: () => prisma.campaign,
    },
    content: {
        entityType: "PORTAL",
        searchField: "title",
        schema: z.object({
            kind: z.enum(["SOCIAL", "BLOG", "LANDING", "KEYWORD"]),
            title: z.string().min(1).max(300),
            status: z.enum(["DRAFT", "AI_GENERATED", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).optional(),
            channel: z.string().max(120).optional().nullable(),
            scheduledFor: z.string().datetime().optional().nullable(),
            body: z.string().max(20000).optional().nullable(),
            data: json,
        }).strip(),
        delegate: () => prisma.contentItem,
    },
    bugs: {
        entityType: "PORTAL",
        searchField: "title",
        schema: z.object({
            title: z.string().min(1).max(300),
            severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
            status: z.enum(["OPEN", "TRIAGED", "FIXING", "FIXED", "WONT_FIX"]).optional(),
            source: z.enum(["MANUAL", "AUTO"]).optional(),
            detail: z.string().max(8000).optional().nullable(),
        }).strip(),
        delegate: () => prisma.bugReport,
    },
};
function resolve(req, res) {
    const key = req.params.resource;
    const def = RESOURCES[key];
    if (!def) {
        sendError(res, "UNKNOWN_RESOURCE", `Unknown resource "${String(key)}".`, 404);
        return null;
    }
    return { key, def };
}
/* Prisma delegates are structurally compatible for the operations we use;
   a narrow `any` keeps the factory generic without unsafe casts leaking out. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function listResource(req, res) {
    const r = resolve(req, res);
    if (!r)
        return;
    const where = {};
    if (typeof req.query.search === "string" && req.query.search) {
        where[r.def.searchField] = { contains: req.query.search, mode: "insensitive" };
    }
    if (typeof req.query.status === "string" && req.query.status)
        where.status = req.query.status;
    if (typeof req.query.kind === "string" && req.query.kind)
        where.kind = req.query.kind;
    const rows = await r.def.delegate().findMany({ where, orderBy: { updatedAt: "desc" }, take: 300 });
    return sendSuccess(res, rows);
}
export async function createResource(req, res) {
    const r = resolve(req, res);
    if (!r)
        return;
    const parsed = r.def.schema.safeParse(req.body);
    if (!parsed.success) {
        return sendError(res, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const row = await r.def.delegate().create({ data: normalizeDates(parsed.data) });
    await logActivity({ userId: req.currentUser.id, action: `CREATE_${r.key.toUpperCase()}`, entityType: r.def.entityType, entityId: row.id });
    return sendSuccess(res, row, "Created", 201);
}
export async function updateResource(req, res) {
    const r = resolve(req, res);
    if (!r)
        return;
    const id = paramId(req);
    const parsed = r.def.schema.partial().safeParse(req.body);
    if (!parsed.success) {
        return sendError(res, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const row = await r.def.delegate().update({ where: { id }, data: normalizeDates(parsed.data) });
    await logActivity({ userId: req.currentUser.id, action: `UPDATE_${r.key.toUpperCase()}`, entityType: r.def.entityType, entityId: id, metadata: req.body });
    return sendSuccess(res, row, "Updated");
}
export async function deleteResource(req, res) {
    const r = resolve(req, res);
    if (!r)
        return;
    const id = paramId(req);
    await r.def.delegate().delete({ where: { id } });
    await logActivity({ userId: req.currentUser.id, action: `DELETE_${r.key.toUpperCase()}`, entityType: r.def.entityType, entityId: id });
    return sendSuccess(res, null, "Deleted");
}
/** Convert ISO datetime strings to Date objects for Prisma DateTime columns. */
function normalizeDates(data) {
    const out = { ...data };
    for (const key of ["validUntil", "startDate", "endDate", "scheduledFor"]) {
        if (typeof out[key] === "string")
            out[key] = new Date(out[key]);
    }
    return out;
}
//# sourceMappingURL=resource.controller.js.map
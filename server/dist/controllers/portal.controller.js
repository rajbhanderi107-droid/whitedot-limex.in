import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { paramId } from "../utils/params.js";
import { logActivity } from "../services/activity.service.js";
import { recordSecurityEvent } from "../services/securityEvents.service.js";
import { aiDraftConfigured, generateDraft } from "../services/aiDraft.service.js";
const SITE_URL = env.isProduction ? "https://whitedotindia.in" : env.FRONTEND_URL;
const GITHUB_REPO = "rajbhanderi107-droid/whitedot-limex.in";
// ─── Portal state (global posture) ───────────────
export async function getPortalState(_req, res) {
    const state = await prisma.portalState.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global" },
    });
    return sendSuccess(res, state);
}
export async function updatePortalState(req, res) {
    const state = await prisma.portalState.upsert({
        where: { id: "global" },
        update: { ...req.body, updatedById: req.currentUser.id },
        create: { id: "global", ...req.body, updatedById: req.currentUser.id },
    });
    await logActivity({
        userId: req.currentUser.id,
        action: req.body.emergencyStop ? "EMERGENCY_STOP" : "UPDATE_PORTAL_STATE",
        entityType: "PORTAL",
        entityId: "global",
        metadata: req.body,
    });
    return sendSuccess(res, state, "Portal state updated");
}
// ─── Automations ─────────────────────────────────
export async function listAutomations(_req, res) {
    return sendSuccess(res, await prisma.automationConfig.findMany());
}
export async function upsertAutomation(req, res) {
    const id = paramId(req);
    const row = await prisma.automationConfig.upsert({
        where: { id },
        update: req.body,
        create: { id, enabled: req.body.enabled ?? false, mode: req.body.mode ?? "APPROVAL" },
    });
    await logActivity({ userId: req.currentUser.id, action: "UPDATE_AUTOMATION", entityType: "AUTOMATION", entityId: id, metadata: req.body });
    return sendSuccess(res, row, "Automation updated");
}
// ─── Approvals ───────────────────────────────────
export async function listApprovals(req, res) {
    const status = typeof req.query.status === "string" ? req.query.status : "PENDING";
    const where = status === "ALL" ? {} : { status: status };
    const items = await prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { createdBy: { select: { name: true } }, decidedBy: { select: { name: true } } },
    });
    return sendSuccess(res, items);
}
export async function createApproval(req, res) {
    const item = await prisma.approvalRequest.create({
        data: { ...req.body, createdById: req.currentUser.id },
    });
    await logActivity({ userId: req.currentUser.id, action: "CREATE_APPROVAL", entityType: "APPROVAL", entityId: item.id });
    return sendSuccess(res, item, "Approval queued", 201);
}
export async function decideApproval(req, res) {
    const id = paramId(req);
    // Lockdown blocks approving external sends; rejection is always allowed.
    if (req.body.decision === "APPROVED") {
        const state = await prisma.portalState.findUnique({ where: { id: "global" } });
        if (state?.emergencyStop || state?.automationMode === "LOCKDOWN") {
            recordSecurityEvent({ kind: "LOCKDOWN_BLOCK", req, severity: "HIGH", detail: `Approve attempt on ${id} during lockdown` });
            return sendError(res, "LOCKDOWN_ACTIVE", "Approvals are blocked while lockdown is active.", 423);
        }
    }
    const item = await prisma.approvalRequest.update({
        where: { id },
        data: { status: req.body.decision, decidedById: req.currentUser.id, decidedAt: new Date() },
    });
    await logActivity({ userId: req.currentUser.id, action: `APPROVAL_${req.body.decision}`, entityType: "APPROVAL", entityId: id });
    return sendSuccess(res, item, `Approval ${req.body.decision.toLowerCase()}`);
}
// ─── Workflows ───────────────────────────────────
export async function listWorkflows(_req, res) {
    return sendSuccess(res, await prisma.workflowDef.findMany({ orderBy: { createdAt: "desc" } }));
}
export async function createWorkflow(req, res) {
    const wf = await prisma.workflowDef.create({ data: { ...req.body, createdById: req.currentUser.id } });
    await logActivity({ userId: req.currentUser.id, action: "CREATE_WORKFLOW", entityType: "WORKFLOW", entityId: wf.id });
    return sendSuccess(res, wf, "Workflow saved", 201);
}
export async function deleteWorkflow(req, res) {
    const id = paramId(req);
    await prisma.workflowDef.delete({ where: { id } });
    await logActivity({ userId: req.currentUser.id, action: "DELETE_WORKFLOW", entityType: "WORKFLOW", entityId: id });
    return sendSuccess(res, null, "Workflow deleted");
}
// ─── Incidents ───────────────────────────────────
export async function listIncidents(_req, res) {
    return sendSuccess(res, await prisma.portalIncident.findMany({ orderBy: { createdAt: "desc" }, take: 100 }));
}
export async function createIncident(req, res) {
    const inc = await prisma.portalIncident.create({ data: { ...req.body, createdById: req.currentUser.id } });
    // SEV0/SEV1 trip lockdown automatically.
    if (req.body.severity === "SEV0" || req.body.severity === "SEV1") {
        await prisma.portalState.upsert({
            where: { id: "global" },
            update: { emergencyStop: true, automationMode: "LOCKDOWN", updatedById: req.currentUser.id },
            create: { id: "global", emergencyStop: true, automationMode: "LOCKDOWN", updatedById: req.currentUser.id },
        });
    }
    await logActivity({ userId: req.currentUser.id, action: "DECLARE_INCIDENT", entityType: "INCIDENT", entityId: inc.id, metadata: { severity: req.body.severity } });
    return sendSuccess(res, inc, "Incident declared", 201);
}
export async function updateIncident(req, res) {
    const id = paramId(req);
    const inc = await prisma.portalIncident.update({
        where: { id },
        data: { stage: req.body.stage, resolvedAt: req.body.stage === "RESOLVED" ? new Date() : null },
    });
    await logActivity({ userId: req.currentUser.id, action: "UPDATE_INCIDENT", entityType: "INCIDENT", entityId: id, metadata: { stage: req.body.stage } });
    return sendSuccess(res, inc, "Incident updated");
}
export async function deleteIncident(req, res) {
    const id = paramId(req);
    await prisma.portalIncident.delete({ where: { id } });
    await logActivity({ userId: req.currentUser.id, action: "DELETE_INCIDENT", entityType: "INCIDENT", entityId: id });
    return sendSuccess(res, null, "Incident deleted");
}
// ─── Integrations & AI agents ────────────────────
export async function listIntegrations(_req, res) {
    return sendSuccess(res, await prisma.integrationConfig.findMany());
}
export async function upsertIntegration(req, res) {
    const id = paramId(req);
    const row = await prisma.integrationConfig.upsert({
        where: { id },
        update: req.body,
        create: { id, connected: req.body.connected ?? false, environment: req.body.environment ?? "sandbox" },
    });
    await logActivity({ userId: req.currentUser.id, action: "UPDATE_INTEGRATION", entityType: "INTEGRATION", entityId: id, metadata: req.body });
    return sendSuccess(res, row, "Integration updated");
}
export async function listAiAgents(_req, res) {
    return sendSuccess(res, await prisma.aiAgentConfig.findMany());
}
export async function upsertAiAgent(req, res) {
    const id = paramId(req);
    const row = await prisma.aiAgentConfig.upsert({
        where: { id },
        update: req.body,
        create: { id, enabled: req.body.enabled ?? true, mode: req.body.mode ?? "DRAFT" },
    });
    await logActivity({ userId: req.currentUser.id, action: "UPDATE_AI_AGENT", entityType: "AI_AGENT", entityId: id, metadata: req.body });
    return sendSuccess(res, row, "Agent updated");
}
// ─── AI draft → approval queue ───────────────────
export async function createAiDraft(req, res) {
    if (!aiDraftConfigured()) {
        return sendError(res, "AI_UNAVAILABLE", "AI drafting is not configured on the server (LLM_API_KEY missing).", 503);
    }
    const state = await prisma.portalState.findUnique({ where: { id: "global" } });
    if (state?.emergencyStop || state?.automationMode === "LOCKDOWN") {
        return sendError(res, "LOCKDOWN_ACTIVE", "AI drafting is paused while lockdown is active.", 423);
    }
    const { kind, lead } = req.body;
    const draft = await generateDraft(kind, lead);
    const kindLabel = {
        followup_email: "Follow-up email",
        followup_whatsapp: "WhatsApp follow-up",
        proposal_intro: "Proposal intro",
        reactivation: "Reactivation email",
    };
    const item = await prisma.approvalRequest.create({
        data: {
            title: `${kindLabel[kind]} — ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
            kind: kindLabel[kind],
            automationId: "ai-draft",
            risk: "MEDIUM",
            preview: draft,
            createdById: req.currentUser.id,
        },
    });
    await logActivity({ userId: req.currentUser.id, action: "AI_DRAFT_CREATED", entityType: "APPROVAL", entityId: item.id, metadata: { kind } });
    return sendSuccess(res, item, "Draft generated and queued for approval", 201);
}
// ─── Business intelligence ───────────────────────
export async function getBiSummary(_req, res) {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const [inquiries, statusGroups, industryGroups, quotes, samples, calcs, quotations, orders, campaigns] = await Promise.all([
        prisma.inquiry.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, status: true } }),
        prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.inquiry.groupBy({ by: ["industry"], _count: { _all: true }, where: { industry: { not: null } } }),
        prisma.quoteRequest.count(),
        prisma.sampleRequest.count(),
        prisma.calculatorSubmission.count(),
        prisma.quotation.aggregate({ _count: { _all: true }, _sum: { total: true } }),
        prisma.order.aggregate({ _count: { _all: true }, _sum: { amount: true } }),
        prisma.campaign.aggregate({ _count: { _all: true }, _sum: { budget: true, spend: true, leads: true } }),
    ]);
    // Bucket inquiries by calendar month (last 12).
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleString("en", { month: "short" }),
            count: 0,
        });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const inq of inquiries) {
        const d = inq.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = byKey.get(key);
        if (bucket)
            bucket.count++;
    }
    const funnel = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
    const topIndustries = industryGroups
        .map((g) => ({ industry: g.industry, count: g._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    return sendSuccess(res, {
        monthlyLeads: months,
        funnel,
        topIndustries,
        totals: {
            quotes,
            samples,
            calculators: calcs,
            quotations: quotations._count._all,
            quotationValue: quotations._sum.total ?? 0,
            orders: orders._count._all,
            orderValue: orders._sum.amount ?? 0,
            campaigns: campaigns._count._all,
            campaignBudget: campaigns._sum.budget ?? 0,
            campaignSpend: campaigns._sum.spend ?? 0,
            campaignLeads: campaigns._sum.leads ?? 0,
        },
    });
}
// ─── Website / stack health ──────────────────────
export async function getDetailedHealth(_req, res) {
    // DB latency
    const dbStart = Date.now();
    let dbOk = true;
    try {
        await prisma.$queryRaw `SELECT 1`;
    }
    catch {
        dbOk = false;
    }
    const dbMs = Date.now() - dbStart;
    // Frontend reachability (the live site)
    let siteOk = false;
    let siteMs = 0;
    let siteStatus = 0;
    try {
        const t = Date.now();
        const r = await fetch(SITE_URL, { method: "GET", signal: AbortSignal.timeout(10_000) });
        siteMs = Date.now() - t;
        siteStatus = r.status;
        siteOk = r.ok;
    }
    catch {
        siteOk = false;
    }
    // Sitemap & robots
    const probe = async (path) => {
        try {
            const r = await fetch(`${SITE_URL.replace(/\/$/, "")}${path}`, { method: "HEAD", signal: AbortSignal.timeout(8_000) });
            return r.ok;
        }
        catch {
            return false;
        }
    };
    const [sitemapOk, robotsOk] = await Promise.all([probe("/sitemap.xml"), probe("/robots.txt")]);
    const mem = process.memoryUsage();
    return sendSuccess(res, {
        backend: {
            ok: true,
            uptimeSec: Math.round(process.uptime()),
            node: process.version,
            memoryMb: Math.round(mem.rss / 1024 / 1024),
            env: env.isProduction ? "production" : "development",
        },
        database: { ok: dbOk, latencyMs: dbMs },
        site: { ok: siteOk, status: siteStatus, latencyMs: siteMs, url: SITE_URL },
        seoFiles: { sitemap: sitemapOk, robots: robotsOk },
        services: {
            smtp: Boolean(env.SMTP_HOST),
            llm: Boolean(env.LLM_API_KEY),
            googleAnalytics: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GA4_PROPERTY_ID),
        },
        checkedAt: new Date().toISOString(),
    });
}
// ─── SEO audit (live site fetch + parse) ─────────
export async function getSeoAudit(_req, res) {
    let html = "";
    let status = 0;
    let ms = 0;
    try {
        const t = Date.now();
        const r = await fetch(SITE_URL, { signal: AbortSignal.timeout(15_000) });
        ms = Date.now() - t;
        status = r.status;
        html = await r.text();
    }
    catch {
        return sendError(res, "SITE_UNREACHABLE", "Could not fetch the live site for auditing.", 502);
    }
    const pick = (re) => html.match(re)?.[1]?.trim() ?? null;
    const count = (re) => (html.match(re) ?? []).length;
    const title = pick(/<title[^>]*>([^<]*)<\/title>/i);
    const metaDescription = pick(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
        ?? pick(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
    const ogImage = pick(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
    const canonical = pick(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    const h1Count = count(/<h1[\s>]/gi);
    const imgTotal = count(/<img[\s>]/gi);
    const imgWithAlt = count(/<img[^>]*\salt=["'][^"']+["']/gi);
    const hasSchema = /application\/ld\+json/i.test(html);
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
    const lang = pick(/<html[^>]*\slang=["']([^"']*)["']/i);
    const checks = [
        { name: "Title tag", pass: Boolean(title), detail: title ?? "missing", weight: 12 },
        { name: "Title length 30–65", pass: Boolean(title && title.length >= 30 && title.length <= 65), detail: `${title?.length ?? 0} chars`, weight: 6 },
        { name: "Meta description", pass: Boolean(metaDescription), detail: metaDescription ? `${metaDescription.length} chars` : "missing", weight: 12 },
        { name: "Single H1", pass: h1Count === 1, detail: `${h1Count} found`, weight: 8 },
        { name: "Open Graph image", pass: Boolean(ogImage), detail: ogImage ? "present" : "missing", weight: 8 },
        { name: "Canonical URL", pass: Boolean(canonical), detail: canonical ?? "missing", weight: 8 },
        { name: "Structured data (JSON-LD)", pass: hasSchema, detail: hasSchema ? "present" : "missing", weight: 10 },
        { name: "Image alt coverage", pass: imgTotal === 0 || imgWithAlt / imgTotal >= 0.8, detail: `${imgWithAlt}/${imgTotal} have alt`, weight: 10 },
        { name: "HTML lang attribute", pass: Boolean(lang), detail: lang ?? "missing", weight: 6 },
        { name: "Mobile viewport", pass: hasViewport, detail: hasViewport ? "present" : "missing", weight: 10 },
        { name: "Response under 1.5s", pass: ms < 1500, detail: `${ms}ms`, weight: 10 },
    ];
    const total = checks.reduce((s, c) => s + c.weight, 0);
    const earned = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
    return sendSuccess(res, {
        url: SITE_URL,
        status,
        fetchMs: ms,
        score: Math.round((earned / total) * 100),
        checks,
        auditedAt: new Date().toISOString(),
    });
}
// ─── DevOps — GitHub Actions runs (public repo) ──
export async function getDevopsRuns(_req, res) {
    try {
        const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=15`, {
            headers: { Accept: "application/vnd.github+json", "User-Agent": "whitedot-portal" },
            signal: AbortSignal.timeout(12_000),
        });
        if (!r.ok)
            return sendError(res, "GITHUB_ERROR", `GitHub API returned ${r.status}.`, 502);
        const json = (await r.json());
        const runs = (json.workflow_runs ?? []).map((run) => ({
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            branch: run.head_branch,
            sha: typeof run.head_sha === "string" ? run.head_sha.slice(0, 7) : "",
            event: run.event,
            createdAt: run.created_at,
            url: run.html_url,
        }));
        return sendSuccess(res, { repo: GITHUB_REPO, runs });
    }
    catch {
        return sendError(res, "GITHUB_UNREACHABLE", "Could not reach the GitHub API.", 502);
    }
}
// ─── Backup — stats + JSON export ────────────────
export async function getBackupStats(_req, res) {
    const [users, companies, inquiries, quotes, samples, calcs, docs, products, inventory, quotations, orders, campaigns, content, activity] = await Promise.all([
        prisma.user.count(), prisma.company.count(), prisma.inquiry.count(), prisma.quoteRequest.count(),
        prisma.sampleRequest.count(), prisma.calculatorSubmission.count(), prisma.documentAsset.count(),
        prisma.product.count(), prisma.inventoryItem.count(), prisma.quotation.count(), prisma.order.count(),
        prisma.campaign.count(), prisma.contentItem.count(), prisma.activityLog.count(),
    ]);
    return sendSuccess(res, {
        tables: { users, companies, inquiries, quotes, samples, calculators: calcs, documents: docs, products, inventory, quotations, orders, campaigns, content, activityLogs: activity },
        totalRows: users + companies + inquiries + quotes + samples + calcs + docs + products + inventory + quotations + orders + campaigns + content + activity,
        note: "Render Postgres free tier — platform snapshots not API-accessible; use JSON export below for an off-platform copy.",
    });
}
export async function exportBackup(req, res) {
    // SUPER_ADMIN-gated in routes. Excludes password hashes and tokens.
    const [companies, inquiries, quotes, samples, calcs, products, inventory, quotations, orders, campaigns, content, workflows, incidents] = await Promise.all([
        prisma.company.findMany(), prisma.inquiry.findMany(), prisma.quoteRequest.findMany(),
        prisma.sampleRequest.findMany(), prisma.calculatorSubmission.findMany(),
        prisma.product.findMany(), prisma.inventoryItem.findMany(), prisma.quotation.findMany(),
        prisma.order.findMany(), prisma.campaign.findMany(), prisma.contentItem.findMany(),
        prisma.workflowDef.findMany(), prisma.portalIncident.findMany(),
    ]);
    await logActivity({ userId: req.currentUser.id, action: "BACKUP_EXPORT", entityType: "PORTAL", entityId: "backup" });
    res.setHeader("Content-Disposition", `attachment; filename="whitedot-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    return sendSuccess(res, {
        exportedAt: new Date().toISOString(),
        companies, inquiries, quotes, samples, calculators: calcs,
        products, inventory, quotations, orders, campaigns, content, workflows, incidents,
    });
}
// ─── Security telemetry (CyberShield) ────────────
export async function getSecuritySummary(_req, res) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [byKind24h, high24h, total7d, recent] = await Promise.all([
        prisma.securityEvent.groupBy({
            by: ["kind"],
            where: { createdAt: { gte: dayAgo } },
            _count: { _all: true },
        }),
        prisma.securityEvent.count({ where: { createdAt: { gte: dayAgo }, severity: "HIGH" } }),
        prisma.securityEvent.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    ]);
    const counts24h = { AUTH_FAILURE: 0, RATE_LIMITED: 0, VALIDATION_REJECTED: 0, LOCKDOWN_BLOCK: 0 };
    for (const row of byKind24h)
        counts24h[row.kind] = row._count._all;
    return sendSuccess(res, { counts24h, high24h, total7d, events: recent });
}
// ─── AI Brain stats ──────────────────────────────
const AI_DRAFT_KINDS = ["followup_email", "followup_whatsapp", "proposal_intro", "reactivation"];
export async function getAiStats(_req, res) {
    const [pending, approved, rejected, aiDrafts] = await Promise.all([
        prisma.approvalRequest.count({ where: { status: "PENDING" } }),
        prisma.approvalRequest.count({ where: { status: "APPROVED" } }),
        prisma.approvalRequest.count({ where: { status: "REJECTED" } }),
        prisma.approvalRequest.count({ where: { kind: { in: AI_DRAFT_KINDS } } }),
    ]);
    const decided = approved + rejected;
    return sendSuccess(res, {
        pending,
        approved,
        rejected,
        decided,
        aiDrafts,
        approvalRate: decided > 0 ? Math.round((approved / decided) * 100) : null,
        llmConfigured: aiDraftConfigured(),
    });
}
//# sourceMappingURL=portal.controller.js.map
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import * as portal from "../controllers/portal.controller.js";
import * as resources from "../controllers/resource.controller.js";
import {
  updatePortalStateSchema,
  upsertAutomationSchema,
  createApprovalSchema,
  decideApprovalSchema,
  createWorkflowSchema,
  createIncidentSchema,
  updateIncidentSchema,
  upsertIntegrationSchema,
  upsertAiAgentSchema,
  aiDraftSchema,
  runAiAgentSchema,
  runAiToolSchema,
} from "../validators/portal.validator.js";

const router = Router();

// All portal routes require an authenticated admin user.
router.use(requireAuth);

// ─── Global posture ──────────────────────────────
router.get("/state", asyncHandler(portal.getPortalState));
router.patch("/state", validate(updatePortalStateSchema), asyncHandler(portal.updatePortalState));

// ─── Automations ─────────────────────────────────
router.get("/automations", asyncHandler(portal.listAutomations));
router.patch("/automations/:id", validate(upsertAutomationSchema), asyncHandler(portal.upsertAutomation));

// ─── Approvals ───────────────────────────────────
router.get("/approvals", asyncHandler(portal.listApprovals));
router.post("/approvals", validate(createApprovalSchema), asyncHandler(portal.createApproval));
router.post("/approvals/:id/decide", validate(decideApprovalSchema), asyncHandler(portal.decideApproval));

// ─── Workflows ───────────────────────────────────
router.get("/workflows", asyncHandler(portal.listWorkflows));
router.post("/workflows", validate(createWorkflowSchema), asyncHandler(portal.createWorkflow));
router.delete("/workflows/:id", asyncHandler(portal.deleteWorkflow));

// ─── Incidents ───────────────────────────────────
router.get("/incidents", asyncHandler(portal.listIncidents));
router.post("/incidents", validate(createIncidentSchema), asyncHandler(portal.createIncident));
router.patch("/incidents/:id", validate(updateIncidentSchema), asyncHandler(portal.updateIncident));
router.delete("/incidents/:id", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(portal.deleteIncident));

// ─── Integrations & AI agents ────────────────────
router.get("/integrations", asyncHandler(portal.listIntegrations));
router.patch("/integrations/:id", validate(upsertIntegrationSchema), asyncHandler(portal.upsertIntegration));
router.get("/ai-agents", asyncHandler(portal.listAiAgents));
router.patch("/ai-agents/:id", validate(upsertAiAgentSchema), asyncHandler(portal.upsertAiAgent));
router.post("/ai-agents/:id/run", validate(runAiAgentSchema), asyncHandler(portal.runAiAgent));

// ─── AI Growth Studio tools (real Claude-backed drafts) ─────
router.get("/ai/tools", asyncHandler(portal.listAiTools));
router.post("/ai/tool", validate(runAiToolSchema), asyncHandler(portal.runAiTool));

// ─── AI drafting (queues into approvals) ─────────
router.post("/ai-draft", validate(aiDraftSchema), asyncHandler(portal.createAiDraft));

// ─── Intelligence & operations ───────────────────
router.get("/security/summary", asyncHandler(portal.getSecuritySummary));
router.get("/ai/stats", asyncHandler(portal.getAiStats));
router.get("/bi/summary", asyncHandler(portal.getBiSummary));
router.get("/health/detailed", asyncHandler(portal.getDetailedHealth));
router.get("/seo/audit", asyncHandler(portal.getSeoAudit));
router.get("/devops/runs", asyncHandler(portal.getDevopsRuns));
router.get("/backup/stats", asyncHandler(portal.getBackupStats));
router.get("/backup/export", requireRole("SUPER_ADMIN"), asyncHandler(portal.exportBackup));

// ─── Business resources (generic CRUD) ───────────
router.get("/r/:resource", asyncHandler(resources.listResource));
router.post("/r/:resource", asyncHandler(resources.createResource));
router.patch("/r/:resource/:id", asyncHandler(resources.updateResource));
router.delete("/r/:resource/:id", asyncHandler(resources.deleteResource));

export default router;

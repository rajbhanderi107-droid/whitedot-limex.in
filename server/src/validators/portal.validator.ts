import { z } from "zod";

// ─── Infinity Growth OS portal validators ────────

export const automationModeEnum = z.enum(["OFF", "DRAFT", "APPROVAL", "AUTO", "LOCKDOWN"]);
export const riskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const updatePortalStateSchema = z.object({
  automationMode: automationModeEnum.optional(),
  emergencyStop: z.boolean().optional(),
}).strip();

export const upsertAutomationSchema = z.object({
  enabled: z.boolean().optional(),
  mode: automationModeEnum.optional(),
}).strip();

export const createApprovalSchema = z.object({
  title: z.string().min(1).max(300),
  kind: z.string().min(1).max(120),
  automationId: z.string().max(120).optional(),
  risk: riskLevelEnum.optional(),
  preview: z.string().min(1).max(8000),
}).strip();

export const decideApprovalSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
}).strip();

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  trigger: z.string().min(1).max(200),
  condition: z.string().min(1).max(200),
  action: z.string().min(1).max(200),
}).strip();

export const createIncidentSchema = z.object({
  title: z.string().min(1).max(300),
  severity: z.enum(["SEV0", "SEV1", "SEV2", "SEV3", "SEV4"]),
  playbook: z.string().min(1).max(200),
}).strip();

export const updateIncidentSchema = z.object({
  stage: z.enum(["DETECTED", "TRIAGE", "CONTAINED", "INVESTIGATING", "FIXING", "RECOVERING", "RESOLVED"]),
}).strip();

export const upsertIntegrationSchema = z.object({
  connected: z.boolean().optional(),
  environment: z.enum(["sandbox", "production"]).optional(),
}).strip();

export const upsertAiAgentSchema = z.object({
  enabled: z.boolean().optional(),
  mode: automationModeEnum.optional(),
}).strip();

export const aiDraftSchema = z.object({
  /** What kind of draft to write. */
  kind: z.enum(["followup_email", "followup_whatsapp", "proposal_intro", "reactivation"]),
  /** Lead context assembled by the client (no secrets). */
  lead: z.object({
    name: z.string().min(1).max(200),
    company: z.string().max(200).optional(),
    status: z.string().max(60).optional(),
    industry: z.string().max(200).optional(),
    product: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  }),
}).strip();

export const runAiAgentSchema = z.object({
  /** The task / prompt for the agent. */
  input: z.string().min(1).max(4000),
  /** Optional grounding context (pasted data, lead notes, brief). */
  context: z.string().max(4000).optional(),
}).strip();

export const runAiToolSchema = z.object({
  /** Registered AI Growth Studio tool id (validated against the registry in the controller). */
  tool: z.string().min(1).max(80),
  /** Structured form fields → prompt. Values are capped to keep prompts bounded. */
  inputs: z.record(z.string(), z.string().max(8000)),
}).strip();

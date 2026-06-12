/* Typed client for the portal backend (/api/portal/*). Replaces the
 * localStorage-only stores — state now lives in Postgres and is shared by
 * every admin user, with optimistic UI in each hook. */

import { api } from "../lib/api.js";
import type { AutomationMode } from "./PortalContext.js";

export interface ServerPortalState {
  id: string;
  automationMode: AutomationMode;
  emergencyStop: boolean;
  updatedAt: string;
}

export interface ServerAutomation { id: string; enabled: boolean; mode: AutomationMode; updatedAt: string }
export interface ServerAiAgent { id: string; enabled: boolean; mode: AutomationMode; updatedAt: string }
export interface ServerIntegration { id: string; connected: boolean; environment: "sandbox" | "production"; updatedAt: string }

export interface ServerApproval {
  id: string;
  title: string;
  kind: string;
  automationId?: string | null;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  preview: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  decidedAt?: string | null;
  createdBy?: { name: string } | null;
  decidedBy?: { name: string } | null;
}

export interface ServerWorkflow {
  id: string; name: string; trigger: string; condition: string; action: string;
  enabled: boolean; createdAt: string;
}

export interface ServerIncident {
  id: string; title: string;
  severity: "SEV0" | "SEV1" | "SEV2" | "SEV3" | "SEV4";
  playbook: string;
  stage: "DETECTED" | "TRIAGE" | "CONTAINED" | "INVESTIGATING" | "FIXING" | "RECOVERING" | "RESOLVED";
  createdAt: string; resolvedAt?: string | null;
}

export interface BiSummary {
  monthlyLeads: { key: string; label: string; count: number }[];
  funnel: Record<string, number>;
  topIndustries: { industry: string; count: number }[];
  totals: {
    quotes: number; samples: number; calculators: number;
    quotations: number; quotationValue: number;
    orders: number; orderValue: number;
    campaigns: number; campaignBudget: number; campaignSpend: number; campaignLeads: number;
  };
}

export interface DetailedHealth {
  backend: { ok: boolean; uptimeSec: number; node: string; memoryMb: number; env: string };
  database: { ok: boolean; latencyMs: number };
  site: { ok: boolean; status: number; latencyMs: number; url: string };
  seoFiles: { sitemap: boolean; robots: boolean };
  services: { smtp: boolean; llm: boolean; googleAnalytics: boolean };
  checkedAt: string;
}

export interface SeoAudit {
  url: string; status: number; fetchMs: number; score: number;
  checks: { name: string; pass: boolean; detail: string; weight: number }[];
  auditedAt: string;
}

export interface DevopsRun {
  id: number; name: string; status: string; conclusion: string | null;
  branch: string; sha: string; event: string; createdAt: string; url: string;
}

export interface BackupStats { tables: Record<string, number>; totalRows: number; note: string }

export interface SecurityEvent {
  id: string;
  kind: "AUTH_FAILURE" | "RATE_LIMITED" | "VALIDATION_REJECTED" | "LOCKDOWN_BLOCK";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  path: string;
  method: string;
  ip?: string | null;
  detail?: string | null;
  createdAt: string;
}

export interface SecuritySummary {
  counts24h: Record<SecurityEvent["kind"], number>;
  high24h: number;
  total7d: number;
  events: SecurityEvent[];
}

export interface AiStats {
  pending: number;
  approved: number;
  rejected: number;
  decided: number;
  aiDrafts: number;
  approvalRate: number | null;
  llmConfigured: boolean;
}

export const portalApi = {
  // posture
  getState: () => api.get<ServerPortalState>("/api/portal/state"),
  patchState: (body: Partial<Pick<ServerPortalState, "automationMode" | "emergencyStop">>) =>
    api.patch<ServerPortalState>("/api/portal/state", body),
  // automations / agents / integrations
  listAutomations: () => api.get<ServerAutomation[]>("/api/portal/automations"),
  patchAutomation: (id: string, body: Partial<Pick<ServerAutomation, "enabled" | "mode">>) =>
    api.patch<ServerAutomation>(`/api/portal/automations/${id}`, body),
  listAiAgents: () => api.get<ServerAiAgent[]>("/api/portal/ai-agents"),
  patchAiAgent: (id: string, body: Partial<Pick<ServerAiAgent, "enabled" | "mode">>) =>
    api.patch<ServerAiAgent>(`/api/portal/ai-agents/${id}`, body),
  listIntegrations: () => api.get<ServerIntegration[]>("/api/portal/integrations"),
  patchIntegration: (id: string, body: Partial<Pick<ServerIntegration, "connected" | "environment">>) =>
    api.patch<ServerIntegration>(`/api/portal/integrations/${id}`, body),
  // approvals
  listApprovals: (status: "PENDING" | "ALL" = "PENDING") =>
    api.get<ServerApproval[]>(`/api/portal/approvals?status=${status}`),
  createApproval: (body: { title: string; kind: string; automationId?: string; risk?: ServerApproval["risk"]; preview: string }) =>
    api.post<ServerApproval>("/api/portal/approvals", body),
  decideApproval: (id: string, decision: "APPROVED" | "REJECTED") =>
    api.post<ServerApproval>(`/api/portal/approvals/${id}/decide`, { decision }),
  // workflows
  listWorkflows: () => api.get<ServerWorkflow[]>("/api/portal/workflows"),
  createWorkflow: (body: { name: string; trigger: string; condition: string; action: string }) =>
    api.post<ServerWorkflow>("/api/portal/workflows", body),
  deleteWorkflow: (id: string) => api.delete<null>(`/api/portal/workflows/${id}`),
  // incidents
  listIncidents: () => api.get<ServerIncident[]>("/api/portal/incidents"),
  createIncident: (body: { title: string; severity: ServerIncident["severity"]; playbook: string }) =>
    api.post<ServerIncident>("/api/portal/incidents", body),
  patchIncident: (id: string, stage: ServerIncident["stage"]) =>
    api.patch<ServerIncident>(`/api/portal/incidents/${id}`, { stage }),
  deleteIncident: (id: string) => api.delete<null>(`/api/portal/incidents/${id}`),
  // AI draft
  aiDraft: (body: { kind: "followup_email" | "followup_whatsapp" | "proposal_intro" | "reactivation"; lead: { name: string; company?: string; status?: string; industry?: string; product?: string; notes?: string } }) =>
    api.post<ServerApproval>("/api/portal/ai-draft", body),
  // intelligence & ops
  securitySummary: () => api.get<SecuritySummary>("/api/portal/security/summary"),
  aiStats: () => api.get<AiStats>("/api/portal/ai/stats"),
  biSummary: () => api.get<BiSummary>("/api/portal/bi/summary"),
  health: () => api.get<DetailedHealth>("/api/portal/health/detailed"),
  seoAudit: () => api.get<SeoAudit>("/api/portal/seo/audit"),
  devopsRuns: () => api.get<{ repo: string; runs: DevopsRun[] }>("/api/portal/devops/runs"),
  backupStats: () => api.get<BackupStats>("/api/portal/backup/stats"),
  // generic resources
  listR: <T>(resource: string, params = "") => api.get<T[]>(`/api/portal/r/${resource}${params}`),
  createR: <T>(resource: string, body: unknown) => api.post<T>(`/api/portal/r/${resource}`, body),
  patchR: <T>(resource: string, id: string, body: unknown) => api.patch<T>(`/api/portal/r/${resource}/${id}`, body),
  deleteR: (resource: string, id: string) => api.delete<null>(`/api/portal/r/${resource}/${id}`),
};

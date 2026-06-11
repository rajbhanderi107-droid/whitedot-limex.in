/* Client-side automation control surface.
 *
 * No backend executor exists yet, so this stores automation *configuration*
 * (enabled flag + per-automation safety mode) and a local approval queue.
 * It is the real control plane the future server-side executor will read —
 * the UI never fabricates "runs" or pretends drafts were sent. Approval
 * items are only created by an explicit user action.
 *
 * Persistence: localStorage. */

import { useCallback, useEffect, useState } from "react";
import type { AutomationMode } from "./PortalContext.js";

export type RiskLevel = "low" | "medium" | "high";

export interface AutomationDef {
  id: string;
  name: string;
  group: string;
  trigger: string;
  condition: string;
  action: string;
  risk: RiskLevel;
  defaultMode: AutomationMode;
  /** soft send/exec caps shown in the UI */
  limits: { daily: number; monthly: number };
}

/** Realistic WhiteDot automations spanning sales, marketing, ops & security. */
export const AUTOMATION_DEFS: AutomationDef[] = [
  { id: "new-lead-followup", name: "New lead follow-up", group: "Sales", trigger: "New lead submitted", condition: "Lead score ≥ 30 · business hours", action: "Draft WhatsApp + email, create follow-up task", risk: "low", defaultMode: "APPROVAL", limits: { daily: 100, monthly: 2000 } },
  { id: "sample-delivered-followup", name: "Sample-delivered follow-up", group: "Sales", trigger: "Sample delivered", condition: "Customer opted in", action: "Draft feedback email, create sales task", risk: "low", defaultMode: "APPROVAL", limits: { daily: 50, monthly: 1000 } },
  { id: "quotation-followup", name: "Quotation follow-up", group: "Sales", trigger: "Quotation viewed", condition: "Not yet accepted", action: "Draft follow-up message", risk: "low", defaultMode: "APPROVAL", limits: { daily: 80, monthly: 1500 } },
  { id: "lost-lead-reactivation", name: "Lost-lead reactivation", group: "Marketing", trigger: "Inactive 14 days", condition: "Status = LOST/INACTIVE", action: "Draft reactivation sequence", risk: "medium", defaultMode: "DRAFT", limits: { daily: 40, monthly: 800 } },
  { id: "lead-scoring", name: "Lead scoring & routing", group: "Sales", trigger: "Any lead activity", condition: "—", action: "Recompute score, assign salesperson", risk: "low", defaultMode: "AUTO", limits: { daily: 1000, monthly: 30000 } },
  { id: "low-stock-alert", name: "Low-stock alert", group: "Operations", trigger: "Stock below reorder point", condition: "Sample stock", action: "Notify inventory manager", risk: "low", defaultMode: "AUTO", limits: { daily: 50, monthly: 1000 } },
  { id: "quote-expiry-reminder", name: "Quote-expiry reminder", group: "Sales", trigger: "Quotation expired", condition: "Not converted", action: "Draft reminder + sales task", risk: "low", defaultMode: "APPROVAL", limits: { daily: 60, monthly: 1200 } },
  { id: "campaign-report", name: "Campaign performance report", group: "Marketing", trigger: "Campaign completed", condition: "—", action: "Draft performance report", risk: "low", defaultMode: "DRAFT", limits: { daily: 10, monthly: 200 } },
  { id: "suspicious-login", name: "Suspicious-login response", group: "Security", trigger: "Suspicious login detected", condition: "Geo/IP anomaly", action: "Revoke session, require re-auth, create incident", risk: "high", defaultMode: "APPROVAL", limits: { daily: 200, monthly: 5000 } },
  { id: "website-down", name: "Website-down alert", group: "Security", trigger: "Website down / health fail", condition: "2 consecutive checks", action: "Create incident, notify Super Admin", risk: "medium", defaultMode: "AUTO", limits: { daily: 100, monthly: 2000 } },
];

/* ─── Automation enable/mode state ─────────────────────── */

interface AutoState { enabled: boolean; mode: AutomationMode }
const AUTO_KEY = "wd_automations";

function loadAuto(): Record<string, AutoState> {
  try {
    const raw = localStorage.getItem(AUTO_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Default: low-risk on, higher-risk off until an admin opts in.
  return Object.fromEntries(
    AUTOMATION_DEFS.map((d) => [d.id, { enabled: d.risk === "low", mode: d.defaultMode }]),
  );
}

export interface AutomationView extends AutomationDef { enabled: boolean; mode: AutomationMode }

export function useAutomations() {
  const [state, setState] = useState<Record<string, AutoState>>(loadAuto);

  useEffect(() => {
    try { localStorage.setItem(AUTO_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const setMode = useCallback((id: string, mode: AutomationMode) => {
    setState((s) => ({ ...s, [id]: { ...(s[id] ?? { enabled: true }), mode } }));
  }, []);
  const toggle = useCallback((id: string) => {
    setState((s) => ({ ...s, [id]: { ...(s[id] ?? { mode: "APPROVAL" }), enabled: !s[id]?.enabled } }));
  }, []);

  const automations: AutomationView[] = AUTOMATION_DEFS.map((d) => ({
    ...d,
    enabled: state[d.id]?.enabled ?? (d.risk === "low"),
    mode: state[d.id]?.mode ?? d.defaultMode,
  }));

  return { automations, setMode, toggle };
}

/* ─── Approval queue ───────────────────────────────────── */

export interface ApprovalItem {
  id: string;
  title: string;
  kind: string;        // e.g. "WhatsApp draft", "Email draft"
  automationId: string;
  risk: RiskLevel;
  preview: string;
  createdAt: string;
}
const APPROVALS_KEY = "wd_approvals";

function loadApprovals(): ApprovalItem[] {
  try {
    const raw = localStorage.getItem(APPROVALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function useApprovals() {
  const [items, setItems] = useState<ApprovalItem[]>(loadApprovals);

  useEffect(() => {
    try { localStorage.setItem(APPROVALS_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const enqueue = useCallback((item: Omit<ApprovalItem, "id" | "createdAt">) => {
    setItems((prev) => [
      { ...item, id: `apr_${Date.now()}_${prev.length}`, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  const resolve = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  return { items, enqueue, resolve, clear };
}

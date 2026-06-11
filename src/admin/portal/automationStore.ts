/* Automation control surface — server-backed.
 *
 * Definitions (what each automation IS) live in this registry; per-automation
 * enable + mode state lives in Postgres (AutomationConfig) so every admin
 * shares one configuration. The approval queue is the ApprovalRequest table.
 * UI updates are optimistic; failures roll back. */

import { useCallback, useEffect, useState } from "react";
import { portalApi, type ServerApproval } from "./portalApi.js";
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
  limits: { daily: number; monthly: number };
}

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

interface AutoState { enabled: boolean; mode: AutomationMode }

export interface AutomationView extends AutomationDef { enabled: boolean; mode: AutomationMode }

export function useAutomations() {
  const [state, setState] = useState<Record<string, AutoState>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    portalApi.listAutomations()
      .then((r) => {
        if (cancelled) return;
        setState(Object.fromEntries(r.data.map((a) => [a.id, { enabled: a.enabled, mode: a.mode }])));
        setLoaded(true);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  const setMode = useCallback((id: string, mode: AutomationMode) => {
    setState((s) => ({ ...s, [id]: { enabled: s[id]?.enabled ?? false, mode } }));
    portalApi.patchAutomation(id, { mode }).catch(console.error);
  }, []);

  const toggle = useCallback((id: string) => {
    setState((s) => {
      const enabled = !(s[id]?.enabled ?? false);
      portalApi.patchAutomation(id, { enabled }).catch(console.error);
      return { ...s, [id]: { mode: s[id]?.mode ?? "APPROVAL", enabled } };
    });
  }, []);

  const automations: AutomationView[] = AUTOMATION_DEFS.map((d) => ({
    ...d,
    enabled: state[d.id]?.enabled ?? (loaded ? false : d.risk === "low"),
    mode: state[d.id]?.mode ?? d.defaultMode,
  }));

  return { automations, setMode, toggle, loaded };
}

/* ─── Approval queue (server) ─────────────────────────── */

export type ApprovalItem = ServerApproval;

export function useApprovals() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await portalApi.listApprovals("PENDING");
      setItems(r.data);
    } catch (e) {
      console.error(e);
      setError("Could not load the approval queue — the backend may be waking up.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const enqueue = useCallback(async (item: { title: string; kind: string; automationId?: string; risk: RiskLevel; preview: string }) => {
    const r = await portalApi.createApproval({
      ...item,
      risk: item.risk.toUpperCase() as ServerApproval["risk"],
    });
    setItems((prev) => [r.data, ...prev]);
    return r.data;
  }, []);

  const decide = useCallback(async (id: string, decision: "APPROVED" | "REJECTED") => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id)); // optimistic
    try {
      await portalApi.decideApproval(id, decision);
    } catch (e) {
      setItems(prev); // rollback (e.g. 423 lockdown)
      throw e;
    }
  }, [items]);

  return { items, loading, error, refresh, enqueue, decide };
}

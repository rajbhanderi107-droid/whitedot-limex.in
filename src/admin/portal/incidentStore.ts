/* Incident store — server-backed (PortalIncident table).
 * SEV0/SEV1 declarations trip lockdown server-side automatically. */

import { useCallback, useEffect, useState } from "react";
import { portalApi, type ServerIncident } from "./portalApi.js";

export type Severity = ServerIncident["severity"];
export type Stage = ServerIncident["stage"];
export type Incident = ServerIncident;

export const SEVERITIES: { sev: Severity; label: string }[] = [
  { sev: "SEV0", label: "SEV0 · Active breach / data risk" },
  { sev: "SEV1", label: "SEV1 · Critical production/security" },
  { sev: "SEV2", label: "SEV2 · High impact" },
  { sev: "SEV3", label: "SEV3 · Medium" },
  { sev: "SEV4", label: "SEV4 · Low" },
];

export const STAGES: Stage[] = ["DETECTED", "TRIAGE", "CONTAINED", "INVESTIGATING", "FIXING", "RECOVERING", "RESOLVED"];

export function stageLabel(s: Stage): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export const PLAYBOOKS = [
  "Suspicious admin login", "Malware upload", "Data export anomaly", "API key leak",
  "Customer data access issue", "Website outage", "Failed payment integration", "Broken lead form",
  "Broken quotation system", "Broken customer portal", "Vulnerable dependency", "AI prompt injection",
  "Spam automation risk", "Compromised integration", "Failed deployment", "Backup failure",
];

export function useIncidents() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await portalApi.listIncidents();
      setItems(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const declare = useCallback(async (title: string, severity: Severity, playbook: string) => {
    const r = await portalApi.createIncident({ title: title.trim() || playbook, severity, playbook });
    setItems((prev) => [r.data, ...prev]);
    return r.data;
  }, []);

  const advance = useCallback(async (id: string) => {
    const inc = items.find((i) => i.id === id);
    if (!inc) return;
    const idx = STAGES.indexOf(inc.stage);
    if (idx >= STAGES.length - 1) return;
    const stage = STAGES[idx + 1];
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage } : i)));
    try {
      await portalApi.patchIncident(id, stage);
    } catch (e) {
      console.error(e);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stage: inc.stage } : i)));
    }
  }, [items]);

  const remove = useCallback(async (id: string) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      await portalApi.deleteIncident(id);
    } catch (e) {
      console.error(e);
      setItems(prev);
    }
  }, [items]);

  const open = items.filter((i) => i.stage !== "RESOLVED").length;
  return { items, declare, advance, remove, open, loading, refresh };
}

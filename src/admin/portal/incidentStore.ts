/* Incident store (localStorage). Incidents are declared by a human here;
 * a future detection pipeline will also be able to open them. */

import { useCallback, useEffect, useState } from "react";

export type Severity = "SEV0" | "SEV1" | "SEV2" | "SEV3" | "SEV4";
export const SEVERITIES: { sev: Severity; label: string }[] = [
  { sev: "SEV0", label: "SEV0 · Active breach / data risk" },
  { sev: "SEV1", label: "SEV1 · Critical production/security" },
  { sev: "SEV2", label: "SEV2 · High impact" },
  { sev: "SEV3", label: "SEV3 · Medium" },
  { sev: "SEV4", label: "SEV4 · Low" },
];

export const STAGES = ["Detected", "Triage", "Contained", "Investigating", "Fixing", "Recovering", "Resolved"] as const;
export type Stage = typeof STAGES[number];

export const PLAYBOOKS = [
  "Suspicious admin login", "Malware upload", "Data export anomaly", "API key leak",
  "Customer data access issue", "Website outage", "Failed payment integration", "Broken lead form",
  "Broken quotation system", "Broken customer portal", "Vulnerable dependency", "AI prompt injection",
  "Spam automation risk", "Compromised integration", "Failed deployment", "Backup failure",
];

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  playbook: string;
  stage: Stage;
  createdAt: string;
}

const KEY = "wd_incidents";

function load(): Incident[] {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return [];
}

export function useIncidents() {
  const [items, setItems] = useState<Incident[]>(load);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ } }, [items]);

  const declare = useCallback((title: string, severity: Severity, playbook: string) => {
    setItems((prev) => [
      { id: `inc_${Date.now()}`, title: title.trim() || playbook, severity, playbook, stage: "Detected", createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const advance = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => {
      const idx = STAGES.indexOf(i.stage);
      return i.id === id && idx < STAGES.length - 1 ? { ...i, stage: STAGES[idx + 1] } : i;
    }));
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const open = items.filter((i) => i.stage !== "Resolved").length;
  return { items, declare, advance, remove, open };
}

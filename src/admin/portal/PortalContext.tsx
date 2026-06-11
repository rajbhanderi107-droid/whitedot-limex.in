/* Portal-wide runtime state: global automation mode + emergency stop.
 *
 * Source of truth is the server (PortalState row in Postgres) so every
 * admin sees the same posture; localStorage is only a warm-start cache.
 * Updates are optimistic with server persistence — lockdown enforcement
 * also happens server-side (approvals and AI drafting return 423). */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api.js";

export type AutomationMode = "OFF" | "DRAFT" | "APPROVAL" | "AUTO" | "LOCKDOWN";

export const AUTOMATION_MODES: { mode: AutomationMode; label: string; hint: string }[] = [
  { mode: "OFF", label: "Off", hint: "All automation disabled." },
  { mode: "DRAFT", label: "Draft", hint: "AI drafts only. Nothing is sent or published." },
  { mode: "APPROVAL", label: "Approval", hint: "AI prepares work; a human must approve before execution." },
  { mode: "AUTO", label: "Auto", hint: "AI executes within strict limits, with logs & rollback." },
  { mode: "LOCKDOWN", label: "Lockdown", hint: "Incident mode. Risky automation paused; external sending stopped." },
];

interface PortalState {
  automationMode: AutomationMode;
  setAutomationMode: (m: AutomationMode) => void;
  emergencyStop: boolean;
  lockdown: boolean;
  triggerEmergencyStop: () => void;
  clearEmergencyStop: () => void;
  health: { business: number; security: number; automation: number };
  /** true once server state has loaded at least once */
  synced: boolean;
}

const STORAGE_KEY = "wd_portal_state";
const PortalCtx = createContext<PortalState | null>(null);

interface Persisted { automationMode: AutomationMode; emergencyStop: boolean }

function loadCache(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { automationMode: "APPROVAL", emergencyStop: false, ...JSON.parse(raw) };
  } catch { /* ignore corrupt cache */ }
  return { automationMode: "APPROVAL", emergencyStop: false };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(loadCache);
  const [synced, setSynced] = useState(false);

  // Hydrate from the server once the admin shell mounts (token present).
  useEffect(() => {
    let cancelled = false;
    api.get<{ automationMode: AutomationMode; emergencyStop: boolean }>("/api/portal/state")
      .then((r) => {
        if (cancelled) return;
        setState({ automationMode: r.data.automationMode, emergencyStop: r.data.emergencyStop });
        setSynced(true);
      })
      .catch(() => { /* unauthenticated or backend cold — cache stays */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const persist = useCallback((next: Partial<Persisted>) => {
    api.patch("/api/portal/state", next).catch(console.error);
  }, []);

  const setAutomationMode = useCallback((automationMode: AutomationMode) => {
    setState((p) => ({ ...p, automationMode }));
    persist({ automationMode });
  }, [persist]);

  const triggerEmergencyStop = useCallback(() => {
    setState((p) => ({ ...p, emergencyStop: true, automationMode: "LOCKDOWN" }));
    persist({ emergencyStop: true, automationMode: "LOCKDOWN" });
  }, [persist]);

  const clearEmergencyStop = useCallback(() => {
    setState((p) => ({ ...p, emergencyStop: false, automationMode: "APPROVAL" }));
    persist({ emergencyStop: false, automationMode: "APPROVAL" });
  }, [persist]);

  const lockdown = state.emergencyStop || state.automationMode === "LOCKDOWN";

  const health = useMemo(
    () => ({
      business: 86,
      security: lockdown ? 41 : 92,
      automation: state.automationMode === "AUTO" ? 95 : state.automationMode === "OFF" ? 60 : 88,
    }),
    [lockdown, state.automationMode],
  );

  const value = useMemo<PortalState>(
    () => ({
      automationMode: state.automationMode,
      setAutomationMode,
      emergencyStop: state.emergencyStop,
      lockdown,
      triggerEmergencyStop,
      clearEmergencyStop,
      health,
      synced,
    }),
    [state, setAutomationMode, lockdown, triggerEmergencyStop, clearEmergencyStop, health, synced],
  );

  return <PortalCtx.Provider value={value}>{children}</PortalCtx.Provider>;
}

export function usePortal(): PortalState {
  const ctx = useContext(PortalCtx);
  if (!ctx) throw new Error("usePortal must be used within <PortalProvider>");
  return ctx;
}

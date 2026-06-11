/* Portal-wide runtime state: the global automation safety mode and the
 * emergency-stop / lockdown switches described in the Infinity Growth OS spec.
 *
 * This is a client-side control surface. The actual enforcement (blocking
 * external sends, revoking sessions, freezing integrations) happens server
 * side; this context records intent, persists it, and lets every module read
 * the current posture so they can render the correct guard-rails. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** Five automation modes, from least to most permissive — plus LOCKDOWN. */
export type AutomationMode = "OFF" | "DRAFT" | "APPROVAL" | "AUTO" | "LOCKDOWN";

export const AUTOMATION_MODES: { mode: AutomationMode; label: string; hint: string }[] = [
  { mode: "OFF", label: "Off", hint: "All automation disabled." },
  { mode: "DRAFT", label: "Draft", hint: "AI drafts only. Nothing is sent or published." },
  { mode: "APPROVAL", label: "Approval", hint: "AI prepares work; a human must approve before execution." },
  { mode: "AUTO", label: "Auto", hint: "AI executes within strict limits, with logs & rollback." },
  { mode: "LOCKDOWN", label: "Lockdown", hint: "Incident mode. Risky automation paused; external sending stopped." },
];

interface PortalState {
  /** Default automation mode applied to new automations. */
  automationMode: AutomationMode;
  setAutomationMode: (m: AutomationMode) => void;
  /** Global kill-switch. When true the portal is in lockdown regardless of mode. */
  emergencyStop: boolean;
  /** True when emergencyStop is on OR mode is LOCKDOWN. */
  lockdown: boolean;
  triggerEmergencyStop: () => void;
  clearEmergencyStop: () => void;
  /** Coarse 0–100 health scores shown in the topbar. */
  health: { business: number; security: number; automation: number };
}

const STORAGE_KEY = "wd_portal_state";
const PortalCtx = createContext<PortalState | null>(null);

interface Persisted {
  automationMode: AutomationMode;
  emergencyStop: boolean;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { automationMode: "APPROVAL", emergencyStop: false, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt state */
  }
  // Safe default: nothing runs unattended until an admin opts into AUTO.
  return { automationMode: "APPROVAL", emergencyStop: false };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<Persisted>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* storage full / disabled — non-fatal */
    }
  }, [persisted]);

  const setAutomationMode = useCallback((automationMode: AutomationMode) => {
    setPersisted((p) => ({ ...p, automationMode }));
  }, []);

  const triggerEmergencyStop = useCallback(() => {
    setPersisted((p) => ({ ...p, emergencyStop: true, automationMode: "LOCKDOWN" }));
  }, []);

  const clearEmergencyStop = useCallback(() => {
    setPersisted((p) => ({ ...p, emergencyStop: false, automationMode: "APPROVAL" }));
  }, []);

  const lockdown = persisted.emergencyStop || persisted.automationMode === "LOCKDOWN";

  // Health scores are placeholders until telemetry is wired (Phase 4+).
  // They degrade visibly when the portal is in lockdown so the topbar
  // reflects the active posture rather than showing a fake "all green".
  const health = useMemo(
    () => ({
      business: 86,
      security: lockdown ? 41 : 92,
      automation: persisted.automationMode === "AUTO" ? 95 : persisted.automationMode === "OFF" ? 60 : 88,
    }),
    [lockdown, persisted.automationMode],
  );

  const value = useMemo<PortalState>(
    () => ({
      automationMode: persisted.automationMode,
      setAutomationMode,
      emergencyStop: persisted.emergencyStop,
      lockdown,
      triggerEmergencyStop,
      clearEmergencyStop,
      health,
    }),
    [persisted, setAutomationMode, lockdown, triggerEmergencyStop, clearEmergencyStop, health],
  );

  return <PortalCtx.Provider value={value}>{children}</PortalCtx.Provider>;
}

export function usePortal(): PortalState {
  const ctx = useContext(PortalCtx);
  if (!ctx) throw new Error("usePortal must be used within <PortalProvider>");
  return ctx;
}

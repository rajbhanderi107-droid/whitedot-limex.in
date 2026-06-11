/* ModuleStub — shared scaffold page for every `soon` module.
 *
 * Not a "coming soon" placeholder: it renders the module's planned
 * capabilities from the registry, reflects the active automation mode and
 * lockdown posture, and gives each module a real, navigable home so the
 * portal feels complete while backend wiring proceeds phase by phase. */

import { useParams } from "react-router-dom";
import { Check, Construction, ShieldAlert } from "lucide-react";
import { MODULES_BY_KEY } from "../modules.js";
import { usePortal, AUTOMATION_MODES } from "../PortalContext.js";
import { Card, StatusBadge, SectionHeader } from "../ui.js";

export function ModuleStub({ moduleKey }: { moduleKey: string }) {
  const params = useParams();
  const key = moduleKey || params.moduleKey || "";
  const mod = MODULES_BY_KEY[key];
  const { automationMode, lockdown } = usePortal();

  if (!mod) {
    return (
      <div className="wd-page">
        <div className="wd-page-head"><h1>Module not found</h1><p>No module is registered under “{key}”.</p></div>
      </div>
    );
  }

  const Icon = mod.icon;
  const modeHint = AUTOMATION_MODES.find((m) => m.mode === automationMode)?.hint;

  return (
    <div className="wd-page">
      <div className="wd-page-head wd-page-head-mod">
        <div className="wd-mod-title">
          <span className="wd-mod-icon"><Icon size={20} /></span>
          <div>
            <h1>{mod.label} <StatusBadge status={mod.status} /></h1>
            <p>{mod.blurb}</p>
          </div>
        </div>
      </div>

      {lockdown && (
        <div className="wd-mod-lock">
          <ShieldAlert size={15} />
          Portal is in lockdown — actions in this module that send, publish or deploy are paused.
        </div>
      )}

      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Planned capabilities" />
          {mod.features?.length ? (
            <ul className="wd-feature-list">
              {mod.features.map((f) => (
                <li key={f}><Check size={14} /> {f}</li>
              ))}
            </ul>
          ) : (
            <p className="wd-muted">Capabilities for this module are being specified.</p>
          )}
        </Card>

        <Card>
          <SectionHeader title="Status" />
          <div className="wd-status-rows">
            <div className="wd-status-row"><span>Module</span><b>{mod.label}</b></div>
            <div className="wd-status-row"><span>Stage</span><b><StatusBadge status={mod.status} /></b></div>
            <div className="wd-status-row"><span>Automation mode</span><b>{automationMode}</b></div>
            <div className="wd-status-row"><span>Posture</span><b>{lockdown ? "Lockdown" : "Normal"}</b></div>
          </div>
          {modeHint && <p className="wd-muted wd-mode-hint">{modeHint}</p>}
          <div className="wd-scaffold-note">
            <Construction size={14} />
            Scaffolded UI. Backend endpoints &amp; data wiring land in a later build phase — no destructive actions are exposed here yet.
          </div>
        </Card>
      </div>
    </div>
  );
}

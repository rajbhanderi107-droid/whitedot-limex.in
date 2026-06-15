/* PortalShell — the WhiteDot Infinity Growth OS layout.
 *
 * Replaces the old flat AdminLayout sidebar with grouped, collapsible
 * module sections plus an executive topbar (global search, health rings,
 * automation-mode selector, emergency-stop, profile). Renders the active
 * module via <Outlet/>. */

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu, X, LogOut, Search, ShieldAlert, ChevronDown, Sparkles,
} from "lucide-react";
import { useBrandLogo } from "../../useBrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts";
import { PunchClock } from "../components/PunchClock";
import { MODULE_GROUPS, type PortalModule } from "./modules.js";
import { CommandPalette } from "./CommandPalette.js";
import { usePortal, AUTOMATION_MODES, type AutomationMode } from "./PortalContext.js";
import { HealthRing, StatusBadge } from "./ui.js";
import "./portal.css";

interface Props {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

function NavGroups({ onNav, isSuperAdmin }: { onNav?: () => void; isSuperAdmin: boolean }) {
  return (
    <nav className="wd-nav">
      {MODULE_GROUPS.map((group) => {
        const modules = group.modules.filter((m) => !m.superAdminOnly || isSuperAdmin);
        if (!modules.length) return null;
        return (
          <div key={group.title} className="wd-nav-group">
            <div className="wd-nav-group-title">{group.title}</div>
            {modules.map((m: PortalModule) => {
              const Icon = m.icon;
              return (
                <NavLink key={m.key} to={m.path} onClick={onNav} title={m.blurb}
                  className={({ isActive }) => (isActive ? "wd-nav-link active" : "wd-nav-link")} end>
                  <Icon size={16} />
                  <span className="wd-nav-label">{m.label}</span>
                  {m.status !== "live" && <span className={`wd-nav-dot wd-nav-dot-${m.status}`} />}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function PortalShell({ user, onLogout }: Props) {
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { automationMode, setAutomationMode, lockdown, emergencyStop, triggerEmergencyStop, clearEmergencyStop, health } = usePortal();

  const handleLogout = async () => {
    await onLogout();
    navigate("/admin/login");
  };

  const onEmergency = () => {
    if (emergencyStop) {
      if (window.confirm("Clear emergency stop and resume normal operation (Approval mode)?")) clearEmergencyStop();
    } else if (
      window.confirm(
        "EMERGENCY STOP\n\nThis pauses all automations, disables Auto mode, stops external sending and campaigns, and puts the portal into Lockdown.\n\nProceed?",
      )
    ) {
      triggerEmergencyStop();
    }
  };

  const sidebar = (onNav?: () => void) => (
    <>
      <div className="wd-brand">
        <img src={brandLogo} alt="" width={28} height={28} />
        <div className="wd-brand-text">
          <strong>WhiteDot</strong>
          <small>Infinity Growth OS</small>
        </div>
      </div>
      <NavGroups onNav={onNav} isSuperAdmin={isSuperAdmin} />
      <div className="wd-sidebar-footer">
        <div className="wd-user">
          <span className="wd-user-name">{user.name}</span>
          <span className="wd-user-role">{user.role.toLowerCase().replace(/_/g, " ")}</span>
        </div>
        <button onClick={handleLogout}><LogOut size={14} /> Sign out</button>
      </div>
    </>
  );

  return (
    <div className={`adm wd-portal${lockdown ? " wd-lockdown" : ""}`}>
      <KeyboardShortcuts />
      <CommandPalette isSuperAdmin={isSuperAdmin} />

      {/* Desktop sidebar */}
      <aside className="adm-sidebar wd-sidebar">{sidebar()}</aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="adm-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="adm-drawer wd-sidebar" onClick={(e) => e.stopPropagation()}>
            <button className="adm-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu"><X size={18} /></button>
            {sidebar(() => setDrawerOpen(false))}
          </aside>
        </div>
      )}

      <div className="wd-content">
        {/* Executive topbar */}
        <header className="wd-topbar">
          <button className="wd-topbar-menu" onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu size={20} /></button>

          <button
            className="wd-search"
            onClick={() => window.dispatchEvent(new Event("wd:open-palette"))}
            aria-label="Open command palette"
          >
            <Search size={15} />
            <span className="wd-search-hint">Search leads, modules…</span>
            <kbd className="wd-search-kbd">Ctrl K</kbd>
          </button>

          <div className="wd-topbar-right">
            <PunchClock variant="compact" />
            <div className="wd-rings">
              <HealthRing label="Biz" value={health.business} />
              <HealthRing label="Sec" value={health.security} />
              <HealthRing label="Auto" value={health.automation} />
            </div>

            <label className={`wd-mode wd-mode-${automationMode.toLowerCase()}`} title="Default automation mode">
              <Sparkles size={14} />
              <select value={automationMode} onChange={(e) => setAutomationMode(e.target.value as AutomationMode)} aria-label="Automation mode">
                {AUTOMATION_MODES.map((m) => (
                  <option key={m.mode} value={m.mode}>{m.label}</option>
                ))}
              </select>
              <ChevronDown size={13} />
            </label>

            <button className={`wd-estop${emergencyStop ? " active" : ""}`} onClick={onEmergency}
              title={emergencyStop ? "Lockdown active — click to clear" : "Emergency stop"}>
              <ShieldAlert size={15} />
              <span className="wd-estop-text">{emergencyStop ? "Locked" : "Stop"}</span>
            </button>

            <NotificationBell />
          </div>
        </header>

        {lockdown && (
          <div className="wd-lockbar">
            <ShieldAlert size={14} />
            Lockdown active — risky automations paused, external sending stopped. Only Super Admin & Security Admin can approve critical actions.
          </div>
        )}

        <main className="adm-main wd-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { StatusBadge };

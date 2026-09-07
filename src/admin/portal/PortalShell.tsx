/* PortalShell — the WhiteDot LIMEX workspace layout.
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
import { MODULE_GROUPS } from "./modules.js";
import { CommandPalette } from "./CommandPalette.js";
import { usePortal, AUTOMATION_MODES, type AutomationMode } from "./PortalContext.js";
import { StatusBadge } from "./ui.js";
import "./portal.css";
import "./book-workspace.css";

interface Props {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

function NavGroups({ onNav, isSuperAdmin }: { onNav?: () => void; isSuperAdmin: boolean }) {
  const paths = ["/admin/dashboard", "/admin/route-book", "/admin/lead-book", "/admin/customer-book"];
  const modules = MODULE_GROUPS.flatMap(g => g.modules);
  return <nav className="wd-nav" aria-label="LIMEX workspace">
    <div className="wd-nav-group-title">Your workspace</div>
    {paths.map(path => {
      const m = modules.find(item => item.path === path);
      if (!m || (m.superAdminOnly && !isSuperAdmin)) return null;
      const Icon = m.icon;
      return <NavLink key={path} to={path} onClick={onNav} end className={({ isActive }) => `wd-nav-link${isActive ? " active" : ""}`}>
        <Icon size={18} /><span className="wd-nav-label">{path.endsWith("dashboard") ? "Today" : m.label}</span>
      </NavLink>;
    })}
  </nav>;
}

export function PortalShell({ user, onLogout }: Props) {
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { automationMode, setAutomationMode, lockdown, emergencyStop, triggerEmergencyStop, clearEmergencyStop } = usePortal();

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
          <small>LIMEX workspace</small>
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
            <span className="wd-search-hint">Search workspace…</span>
            <kbd className="wd-search-kbd">Ctrl K</kbd>
          </button>

          <div className="wd-topbar-right">
            <details className="wd-tools-menu"><summary>Tools</summary><div className="wd-tools-panel">
              <NavLink to="/admin/settings">Website settings</NavLink>
              {isSuperAdmin && <NavLink to="/admin/users">Manage users</NavLink>}
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

            </div></details>
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

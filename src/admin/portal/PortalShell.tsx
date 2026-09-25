/* PortalShell — the WhiteDot LIMEX workspace layout.
 *
 * Replaces the old flat AdminLayout sidebar with grouped, collapsible
 * module sections plus an executive topbar (global search, health rings,
 * automation-mode selector, emergency-stop, profile). Renders the active
 * module via <Outlet/>. */

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu, X, LogOut, Search, ShieldAlert, Settings, Home, Route, ClipboardCheck, Handshake, MoreHorizontal,
} from "lucide-react";
import { useBrandLogo } from "../../useBrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts";
import { MODULE_GROUPS } from "./modules.js";
import { CommandPalette } from "./CommandPalette.js";
import { usePortal } from "./PortalContext.js";
import { StatusBadge } from "./ui.js";
import "./portal.css";
import "./book-workspace.css";
import "../ui/theme.css";
import "../ui/layout.css";

interface Props {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

function NavGroups({ onNav, isSuperAdmin }: { onNav?: () => void; isSuperAdmin: boolean }) {
  /* Short names: the brand sits once at the top of the menu, so "LIMEX" is
   * not repeated (and truncated) on every line. */
  const items: [string, string][] = [["/admin/dashboard", "Today"], ["/admin/route-book", "Companies"], ["/admin/visit-followups", "Visits"],
    ["/admin/lead-book", "Leads"], ["/admin/customer-book", "Customers"], ["/admin/trial-book", "Trials"]];
  const modules = MODULE_GROUPS.flatMap(g => g.modules);
  return <nav className="wd-nav" aria-label="LIMEX workspace">
    <div className="wd-nav-group-title">Sales books</div>
    {items.map(([path, label]) => {
      const m = modules.find(item => item.path === path);
      if (!m || (m.superAdminOnly && !isSuperAdmin)) return null;
      const Icon = m.icon;
      return <NavLink key={path} to={path} onClick={onNav} end className={({ isActive }) => `wd-nav-link${isActive ? " active" : ""}`}>
        <Icon size={18} /><span className="wd-nav-label">{label}</span>
      </NavLink>;
    })}
    <div className="wd-nav-spacer" />
    <NavLink to="/admin/book-settings" onClick={onNav} className={({ isActive }) => `wd-nav-link${isActive ? " active" : ""}`}>
      <Settings size={18} /><span className="wd-nav-label">Settings</span>
    </NavLink>
  </nav>;
}

export function PortalShell({ user, onLogout }: Props) {
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const { lockdown } = usePortal();

  const handleLogout = async () => {
    await onLogout();
    navigate("/admin/login");
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

        {/* Phone: the books one thumb away; everything else under More. */}
        <nav className="wd-tabbar" aria-label="Books">
          {([["/admin/dashboard", "Today", Home], ["/admin/route-book", "Companies", Route],
            ["/admin/visit-followups", "Visits", ClipboardCheck], ["/admin/lead-book", "Leads", Handshake]] as const).map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `wd-tab${isActive ? " is-on" : ""}`}><Icon size={19} /><span>{label}</span></NavLink>
          ))}
          <button type="button" className="wd-tab" onClick={() => setDrawerOpen(true)} aria-label="More books and settings"><MoreHorizontal size={19} /><span>More</span></button>
        </nav>
      </div>
    </div>
  );
}

export { StatusBadge };

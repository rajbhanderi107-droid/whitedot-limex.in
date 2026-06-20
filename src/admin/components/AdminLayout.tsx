import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useBrandLogo } from "../../useBrandLogo";
import { NotificationBell } from "./NotificationBell";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { checkBackendHealth } from "../lib/api";
import {
  Building2, Calculator, ClipboardList, FileText,
  Home, LogOut, Menu, MessageSquare, Package, Settings, Users, Activity, Bell, X, LineChart, Megaphone,
  WifiOff, RefreshCw,
} from "lucide-react";

interface Props {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

const navItems = [
  { to: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { to: "/admin/google", icon: LineChart, label: "Google" },
  { to: "/admin/marketing", icon: Megaphone, label: "Marketing" },
  { to: "/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
  { to: "/admin/quote-requests", icon: ClipboardList, label: "Quote Requests" },
  { to: "/admin/sample-requests", icon: Package, label: "Sample Requests" },
  { to: "/admin/companies", icon: Building2, label: "Companies" },
  { to: "/admin/calculator-submissions", icon: Calculator, label: "Calculator" },
  { to: "/admin/follow-ups", icon: Bell, label: "Follow-Ups" },
  { to: "/admin/documents", icon: FileText, label: "Documents" },
];

const mgmtItems = [
  { to: "/admin/settings", icon: Settings, label: "Settings" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/activity-log", icon: Activity, label: "Activity Log" },
];

export function AdminLayout({ user, onLogout }: Props) {
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    checkBackendHealth().then((ok) => setBackendOffline(!ok));
  }, []);

  const retryBackend = async () => {
    setRetrying(true);
    const ok = await checkBackendHealth();
    setBackendOffline(!ok);
    setRetrying(false);
  };

  const handleLogout = async () => {
    await onLogout();
    navigate("/admin/login");
  };


  const sidebarContent = (onNav?: () => void, showBell = false) => (
    <>
      <div className="adm-sidebar-brand">
        <img src={brandLogo} alt="" width={30} height={30} />
        <span>White Dot <small>Admin</small></span>
        {showBell && <NotificationBell />}
      </div>
      <nav className="adm-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onNav} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
        <div className="adm-nav-section">Management</div>
        {mgmtItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onNav} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="adm-sidebar-footer">
        <div style={{ fontSize: ".78rem", marginBottom: ".5rem", color: "var(--adm-muted)" }}>
          {user.name} · <span style={{ textTransform: "capitalize" }}>{user.role.toLowerCase().replace("_", " ")}</span>
        </div>
        <button onClick={handleLogout}><LogOut size={14} /> Sign out</button>
      </div>
    </>
  );

  return (
    <div className="adm">
      <KeyboardShortcuts />

      {backendOffline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#7f1d1d", color: "#fca5a5",
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
          fontSize: 13, fontWeight: 500,
        }}>
          <WifiOff size={15} />
          <span>Backend offline — Render service is suspended.</span>
          <a
            href="https://dashboard.render.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#fde68a", textDecoration: "underline", whiteSpace: "nowrap" }}
          >
            Resume on Render →
          </a>
          <button
            onClick={retryBackend}
            disabled={retrying}
            style={{
              marginLeft: "auto", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 12,
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <RefreshCw size={12} style={{ animation: retrying ? "spin 1s linear infinite" : undefined }} />
            {retrying ? "Checking…" : "Retry"}
          </button>
          <button
            onClick={() => setBackendOffline(false)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="adm-sidebar" style={backendOffline ? { paddingTop: 40 } : undefined}>{sidebarContent(undefined, true)}</aside>

      {/* Mobile top bar */}
      <header className="adm-mobile-topbar" style={backendOffline ? { marginTop: 37 } : undefined}>
        <button className="adm-mobile-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="adm-mobile-topbar-title">White Dot Admin</span>
        <div className="adm-mobile-topbar-actions">
          <NotificationBell />
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="adm-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="adm-drawer" onClick={e => e.stopPropagation()}>
            <button className="adm-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
            {sidebarContent(() => setDrawerOpen(false))}
          </aside>
        </div>
      )}

      <main className="adm-main">
        <Outlet />
      </main>
    </div>
  );
}

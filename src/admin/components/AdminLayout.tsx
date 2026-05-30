import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2, Calculator, ClipboardList, FileText,
  Home, LogOut, Menu, MessageSquare, Package, Settings, Users, Activity, Bell, X, LineChart,
} from "lucide-react";

interface Props {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

const navItems = [
  { to: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { to: "/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
  { to: "/admin/quote-requests", icon: ClipboardList, label: "Quote Requests" },
  { to: "/admin/sample-requests", icon: Package, label: "Sample Requests" },
  { to: "/admin/companies", icon: Building2, label: "Companies" },
  { to: "/admin/calculator-submissions", icon: Calculator, label: "Calculator" },
  { to: "/admin/follow-ups", icon: Bell, label: "Follow-Ups" },
  { to: "/admin/documents", icon: FileText, label: "Documents" },
];

const mgmtItems = [
  { to: "/admin/google", icon: LineChart, label: "Google" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/activity-log", icon: Activity, label: "Activity Log" },
];

export function AdminLayout({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await onLogout();
    navigate("/admin/login");
  };

  const assetPath = (p: string) => `${import.meta.env.BASE_URL}${p}`.replace(/\/{2,}/g, "/");

  const sidebarContent = (onNav?: () => void) => (
    <>
      <div className="adm-sidebar-brand">
        <img src={BRAND_LOGO_SRC} alt="" width={30} height={30} />
        <span>White Dot <small>Admin</small></span>
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
      {/* Desktop sidebar */}
      <aside className="adm-sidebar">{sidebarContent()}</aside>

      {/* Mobile top bar */}
      <header className="adm-mobile-topbar">
        <button className="adm-mobile-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="adm-mobile-topbar-title">White Dot Admin</span>
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

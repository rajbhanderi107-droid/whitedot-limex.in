import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3, Building2, Calculator, ClipboardList, FileText,
  Home, LogOut, MessageSquare, Package, Settings, Users, Activity, Bell,
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
  { to: "/admin/settings", icon: Settings, label: "Settings" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/activity-log", icon: Activity, label: "Activity Log" },
];

export function AdminLayout({ user, onLogout }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate("/admin/login");
  };

  const assetPath = (p: string) => `${import.meta.env.BASE_URL}${p}`.replace(/\/{2,}/g, "/");

  return (
    <div className="adm">
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <img src={assetPath("assets/whitedot-logo-enhanced.svg")} alt="" width={26} height={26} />
          <span>White Dot <small>Admin</small></span>
        </div>

        <nav className="adm-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          <div className="adm-nav-section">Management</div>
          {mgmtItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div style={{ fontSize: ".78rem", marginBottom: ".5rem", color: "var(--adm-muted)" }}>
            {user.name} · <span style={{ textTransform: "capitalize" }}>{user.role.toLowerCase().replace("_", " ")}</span>
          </div>
          <button onClick={handleLogout}><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      <main className="adm-main">
        <Outlet />
      </main>
    </div>
  );
}

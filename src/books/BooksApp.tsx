/* The four books as standalone apps.
 *
 * Same login, same server, same records as the portal — this is a different
 * doorway into them, not a different copy. It exists because a salesperson
 * standing at a factory gate wants the book on their home screen, opening
 * straight into the right page, without the portal's sidebar and topbar
 * eating a phone screen.
 *
 * Everything portal-only (the CRM, Companies, Follow-ups) hands off to the
 * full portal rather than being half-rebuilt here. */

import { useEffect } from "react";
import { ForgotPasswordPage } from "../admin/pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "../admin/pages/ResetPasswordPage.js";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Route as RouteIcon, ClipboardCheck, Handshake, BadgeCheck, LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "../admin/hooks/useAuth.js";
import { LoginPage } from "../admin/pages/LoginPage.js";
import { RouteBookPage } from "../admin/routebook/RouteBookPage.js";
import { FollowUpBookPage } from "../admin/routebook/FollowUpBookPage.js";
import { LeadBookPage } from "../admin/routebook/LeadBookPage.js";
import { CustomerBookPage } from "../admin/routebook/CustomerBookPage.js";
import { warmUpBackend } from "../admin/lib/api.js";
import "../admin/admin.css";
import "../admin/portal/portal.css";
import "./books.css";

warmUpBackend();

export type BookKey = "route" | "visits" | "leads" | "customers";

export const BOOKS: { key: BookKey; path: string; label: string; short: string; icon: typeof RouteIcon }[] = [
  { key: "route", path: "/admin/route-book", label: "Route Book", short: "Route", icon: RouteIcon },
  { key: "visits", path: "/admin/visit-followups", label: "Visit Follow-ups", short: "Visits", icon: ClipboardCheck },
  { key: "leads", path: "/admin/lead-book", label: "Lead Book", short: "Leads", icon: Handshake },
  { key: "customers", path: "/admin/customer-book", label: "Customer Book", short: "Customers", icon: BadgeCheck },
];

/** Which book this build of the page opens into, set by its own HTML. */
function defaultBook(): BookKey {
  const attr = document.documentElement.dataset.book as BookKey | undefined;
  return BOOKS.some((b) => b.key === attr) ? (attr as BookKey) : "route";
}
const homePath = () => BOOKS.find((b) => b.key === defaultBook())!.path;

const PORTAL_ORIGIN = window.location.origin;

/** Anything this app deliberately does not carry opens in the full portal. */
function ToPortal() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.location.assign(`${PORTAL_ORIGIN}/#${pathname}${search}`); }, [pathname, search]);
  return (
    <div className="bk-handoff">
      <p>Opening this in the full portal…</p>
      <a className="wd-ghost-btn" href={`${PORTAL_ORIGIN}/#${pathname}`}>Continue</a>
    </div>
  );
}

function Chrome({ user, onLogout }: { user: { name: string; role: string }; onLogout: () => void }) {
  return (
    <nav className="bk-bar" aria-label="Books">
      <div className="bk-tabs">
        {BOOKS.map((b) => (
          <NavLink key={b.key} to={b.path} className={({ isActive }) => `bk-tab${isActive ? " is-on" : ""}`} data-testid={`bk-tab-${b.key}`} aria-label={b.label}>
            <b.icon size={16} />
            <span>{b.short}</span>
          </NavLink>
        ))}
      </div>
      <div className="bk-bar-end">
        <a className="bk-icon" href={`${PORTAL_ORIGIN}/#/admin/dashboard`} aria-label="Open full portal" title={`Full portal · signed in as ${user.name}`}>
          <LayoutGrid size={16} />
        </a>
        <button type="button" className="bk-icon" onClick={() => void onLogout()} title="Sign out" aria-label="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

export default function BooksApp() {
  const { user, loading, login, googleLogin, logout, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="adm-loading" style={{ minHeight: "100vh" }}>
        <div className="adm-dot-pulse"><span /><span /><span /></div>
        Connecting…
      </div>
    );
  }

  // The books hold customer and order records, so they need the same login as
  // the rest of the portal — the app is public, the data is not.
  if (!isAuthenticated || !user) {
    return (
      <Routes>
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LoginPage onLogin={login} onGoogleLogin={googleLogin}
          redirectTo={homePath()} title={`LIMEX ${BOOKS.find((b) => b.key === defaultBook())!.label}`}
          description="Sign in with your WhiteDot account to open your book." />} />
      </Routes>
    );
  }

  return (
    <div className="bk-app" data-testid="books-app">
      <Chrome user={user} onLogout={logout} />
      <main className="bk-main">
        <Routes>
          <Route path="/admin/route-book" element={<RouteBookPage />} />
          <Route path="/admin/visit-followups" element={<FollowUpBookPage />} />
          <Route path="/admin/lead-book" element={<LeadBookPage />} />
          <Route path="/admin/customer-book" element={<CustomerBookPage />} />
          <Route path="/admin/*" element={<ToPortal />} />
          <Route path="*" element={<Navigate to={homePath()} replace />} />
        </Routes>
      </main>
    </div>
  );
}

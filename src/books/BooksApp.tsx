/* The WhiteDot Portal as one installable app.
 *
 * Same login, same server, same records as the portal — this is a different
 * doorway into them, not a different copy. It exists because a salesperson
 * standing at a factory gate wants the book on their home screen, opening
 * straight into the right page.
 *
 * It wears the portal's own shell (PortalShell: top bar, phone tab bar, the
 * menu drawer), so the installed app looks and behaves exactly like
 * whitedotindia.in in the browser. It used to carry a separate top bar of its
 * own; outside the portal's `.adm` root the pages lost their font (phones fell
 * back to Times) and their menu styles, and the two drifted apart.
 *
 * Everything else in the full admin (the CRM and the website tools) hands off
 * to the full portal rather than being half-rebuilt here. */

import { useEffect } from "react";
import { ForgotPasswordPage } from "../admin/pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "../admin/pages/ResetPasswordPage.js";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../admin/hooks/useAuth.js";
import { LoginPage } from "../admin/pages/LoginPage.js";
import { RouteBookPage } from "../admin/routebook/RouteBookPage.js";
import { FollowUpBookPage } from "../admin/routebook/FollowUpBookPage.js";
import { LeadBookPage } from "../admin/routebook/LeadBookPage.js";
import { CustomerBookPage } from "../admin/routebook/CustomerBookPage.js";
import { TrialBookPage } from "../admin/routebook/TrialBookPage.js";
import { SettingsPage } from "../admin/routebook/SettingsPage.js";
import { BookDesk } from "../admin/routebook/BookDesk.js";
import { PortalProvider } from "../admin/portal/PortalContext.js";
import { PortalShell } from "../admin/portal/PortalShell.js";
import { warmUpBackend } from "../admin/lib/api.js";
import "../admin/admin.css";
import "./books.css";
import "../admin/ui/theme.css";
import "../admin/ui/layout.css";
import { startTheme } from "../admin/ui/themeMode.js";

startTheme();

warmUpBackend();

/** Where the installed app opens: the Today desk, with every book one tap away. */
const HOME_PATH = "/admin/dashboard";

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
          redirectTo={HOME_PATH} title="WhiteDot Portal"
          description="Sign in with your WhiteDot account to open your books." />} />
      </Routes>
    );
  }

  return (
    <div className="bk-app" data-testid="books-app">
      <PortalProvider>
        <Routes>
          <Route element={<PortalShell user={user} onLogout={logout} />}>
            <Route path="/admin/dashboard" element={<BookDesk />} />
            <Route path="/admin/route-book" element={<RouteBookPage />} />
            <Route path="/admin/visit-followups" element={<FollowUpBookPage />} />
            <Route path="/admin/lead-book" element={<LeadBookPage />} />
            <Route path="/admin/customer-book" element={<CustomerBookPage />} />
            <Route path="/admin/trial-book" element={<TrialBookPage />} />
            <Route path="/admin/book-settings" element={<SettingsPage />} />
            <Route path="/admin/*" element={<ToPortal />} />
          </Route>
          <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
        </Routes>
      </PortalProvider>
    </div>
  );
}

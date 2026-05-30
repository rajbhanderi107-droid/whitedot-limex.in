import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout.js";
import { useAuth } from "./hooks/useAuth.js";
import { GenericListPage } from "./pages/GenericListPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { InquiriesPage } from "./pages/InquiriesPage.js";
import { InquiryDetailPage } from "./pages/InquiryDetailPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.js";
import { UserManagementPage } from "./pages/UserManagementPage.js";
import { WebsiteSettingsPage } from "./pages/WebsiteSettingsPage.js";
import { GoogleDashboardPage } from "./pages/GoogleDashboardPage.js";
import { warmUpBackend } from "./lib/api.js";
import "./admin.css";

// Fire-and-forget: start waking the backend the instant admin JS loads.
// This runs BEFORE React even mounts, so the backend is booting while
// the login page renders. By the time the user types their password,
// the backend is usually already warm.
warmUpBackend();

function badgeClass(status: string) {
  if (["NEW", "REQUESTED"].includes(status)) return "adm-badge adm-badge-new";
  if (["WON", "APPROVED", "DELIVERED", "COMPLETED"].includes(status)) return "adm-badge adm-badge-won";
  if (["LOST", "REJECTED", "CANCELLED", "MISSED"].includes(status)) return "adm-badge adm-badge-lost";
  if (["PENDING"].includes(status)) return "adm-badge adm-badge-pending";
  return "adm-badge adm-badge-active";
}

function StatusBadge(val: unknown) {
  const s = String(val || "-");
  return <span className={badgeClass(s)}>{s.replace(/_/g, " ")}</span>;
}

function DateCol(val: unknown) {
  return <span style={{ color: "var(--adm-muted)" }}>{val ? new Date(String(val)).toLocaleDateString() : "-"}</span>;
}

export default function AdminApp() {
  const { user, loading, login, googleLogin, logout, isAuthenticated } = useAuth();

  if (loading) return (
    <div className="adm-loading" style={{ minHeight: "100vh" }}>
      <div className="adm-dot-pulse"><span /><span /><span /></div>
      Connecting to backend...
    </div>
  );

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage onLogin={login} onGoogleLogin={googleLogin} />}
      />

      {/* Public, reachable even with an active session (e.g. opening a reset email link). */}
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          isAuthenticated && user ? (
            <AdminLayout user={user} onLogout={logout} />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/inquiries" element={<InquiriesPage />} />
        <Route path="/admin/inquiries/:id" element={<InquiryDetailPage />} />

        <Route
          path="/admin/quote-requests"
          element={
            <GenericListPage
              title="Quote Requests"
              endpoint="/api/quote-requests"
              columns={[
                { key: "contactPerson", label: "Contact" },
                { key: "email", label: "Email" },
                { key: "productCategory", label: "Product" },
                { key: "status", label: "Status", render: StatusBadge },
                { key: "createdAt", label: "Date", render: DateCol },
              ]}
            />
          }
        />

        <Route
          path="/admin/sample-requests"
          element={
            <GenericListPage
              title="Sample Requests"
              endpoint="/api/sample-requests"
              columns={[
                { key: "contactPerson", label: "Contact" },
                { key: "email", label: "Email" },
                { key: "requestedMaterialType", label: "Material" },
                { key: "status", label: "Status", render: StatusBadge },
                { key: "createdAt", label: "Date", render: DateCol },
              ]}
            />
          }
        />

        <Route
          path="/admin/companies"
          element={
            <GenericListPage
              title="Companies"
              endpoint="/api/companies"
              columns={[
                { key: "companyName", label: "Company" },
                { key: "contactPerson", label: "Contact" },
                { key: "city", label: "City" },
                { key: "status", label: "Status", render: StatusBadge },
                { key: "createdAt", label: "Date", render: DateCol },
              ]}
            />
          }
        />

        <Route
          path="/admin/calculator-submissions"
          element={
            <GenericListPage
              title="Calculator Submissions"
              endpoint="/api/calculator-submissions"
              columns={[
                { key: "contactPerson", label: "Contact" },
                { key: "companyName", label: "Company" },
                { key: "plasticType", label: "Plastic Type" },
                { key: "limexReplacementPercentage", label: "Replacement %" },
                { key: "createdAt", label: "Date", render: DateCol },
              ]}
            />
          }
        />

        <Route
          path="/admin/follow-ups"
          element={
            <GenericListPage
              title="Follow-Ups"
              endpoint="/api/follow-ups"
              columns={[
                { key: "title", label: "Title" },
                { key: "dueDate", label: "Due Date", render: DateCol },
                { key: "status", label: "Status", render: StatusBadge },
                { key: "createdAt", label: "Created", render: DateCol },
              ]}
            />
          }
        />

        <Route
          path="/admin/documents"
          element={
            <GenericListPage
              title="Documents"
              endpoint="/api/documents"
              columns={[
                { key: "title", label: "Title" },
                { key: "category", label: "Category" },
                { key: "fileType", label: "Type" },
                { key: "createdAt", label: "Date", render: DateCol },
              ]}
            />
          }
        />

        <Route
          path="/admin/google"
          element={<GoogleDashboardPage />}
        />

        <Route
          path="/admin/settings"
          element={<WebsiteSettingsPage />}
        />

        <Route
          path="/admin/users"
          element={<UserManagementPage />}
        />

        <Route
          path="/admin/activity-log"
          element={
            <GenericListPage
              title="Activity Log"
              endpoint="/api/activity-log"
              columns={[
                { key: "action", label: "Action" },
                { key: "entityType", label: "Entity" },
                { key: "createdAt", label: "Date", render: DateCol },
              ]}
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

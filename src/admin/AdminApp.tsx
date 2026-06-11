import { Navigate, Route, Routes } from "react-router-dom";
import { PortalProvider } from "./portal/PortalContext.js";
import { PortalShell } from "./portal/PortalShell.js";
import { CommandCenter } from "./portal/pages/CommandCenter.js";
import { CrmPipeline } from "./portal/pages/CrmPipeline.js";
import { HyperAutomation } from "./portal/pages/HyperAutomation.js";
import { WorkflowBuilder } from "./portal/pages/WorkflowBuilder.js";
import { ApprovalCenter } from "./portal/pages/ApprovalCenter.js";
import { CyberShield } from "./portal/pages/CyberShield.js";
import { IncidentResponse } from "./portal/pages/IncidentResponse.js";
import { AiBrain } from "./portal/pages/AiBrain.js";
import { AiAgents } from "./portal/pages/AiAgents.js";
import { Sustainability } from "./portal/pages/Sustainability.js";
import { IntegrationCenter } from "./portal/pages/IntegrationCenter.js";
import { ModuleStub } from "./portal/pages/ModuleStub.js";
import { SCAFFOLD_MODULES } from "./portal/modules.js";
import { useAuth } from "./hooks/useAuth.js";
import { GenericListPage } from "./pages/GenericListPage.js";
import { InquiriesPage } from "./pages/InquiriesPage.js";
import { InquiryDetailPage } from "./pages/InquiryDetailPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.js";
import { UserManagementPage } from "./pages/UserManagementPage.js";
import { WebsiteSettingsPage } from "./pages/WebsiteSettingsPage.js";
import { GoogleDashboardPage } from "./pages/GoogleDashboardPage.js";
import { MarketingToolsPage } from "./pages/MarketingToolsPage.js";
import { warmUpBackend } from "./lib/api.js";
import "./admin.css";

// Fire-and-forget: start waking the backend the instant admin JS loads.
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

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

function AuthenticatedPortal({
  isAuthenticated,
  user,
  onLogout,
}: {
  isAuthenticated: boolean;
  user: AdminUser | null;
  onLogout: () => void;
}) {
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }
  return <PortalShell user={user} onLogout={onLogout} />;
}

export default function AdminApp() {
  const { user, loading, login, googleLogin, logout, isAuthenticated } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  if (loading) return (
    <div className="adm-loading" style={{ minHeight: "100vh" }}>
      <div className="adm-dot-pulse"><span /><span /><span /></div>
      Connecting to backend...
    </div>
  );

  return (
    <PortalProvider>
      <Routes>
        <Route
          path="/admin/login"
          element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage onLogin={login} onGoogleLogin={googleLogin} />}
        />

        {/* Public, reachable even with an active session (e.g. opening a reset email link). */}
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

        <Route element={<AuthenticatedPortal isAuthenticated={isAuthenticated} user={user} onLogout={logout} />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* ── Command Center ── */}
          <Route path="/admin/dashboard" element={<CommandCenter />} />

          {/* ── Live modules (real backend data) ── */}
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

          <Route path="/admin/google" element={<GoogleDashboardPage />} />
          <Route path="/admin/marketing" element={<MarketingToolsPage />} />
          <Route path="/admin/settings" element={<WebsiteSettingsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />

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
                showDeleteAll={isSuperAdmin}
              />
            }
          />

          {/* ── CRM — live Kanban pipeline over inquiry data ── */}
          <Route path="/admin/crm" element={<CrmPipeline />} />

          {/* ── Automation (Phase 3) ── */}
          <Route path="/admin/hyperautomation" element={<HyperAutomation />} />
          <Route path="/admin/workflows" element={<WorkflowBuilder />} />
          <Route path="/admin/approvals" element={<ApprovalCenter />} />

          {/* ── Security & Reliability (Phase 4) ── */}
          <Route path="/admin/cybershield" element={<CyberShield />} />
          <Route path="/admin/incidents" element={<IncidentResponse />} />

          {/* ── AI Brain & Agents (Phase 5) ── */}
          <Route path="/admin/ai-brain" element={<AiBrain />} />
          <Route path="/admin/ai-agents" element={<AiAgents />} />

          {/* ── Phase 6 functional modules ── */}
          <Route path="/admin/sustainability" element={<Sustainability />} />
          <Route path="/admin/integrations" element={<IntegrationCenter />} />

          {/* ── Scaffolded modules (Infinity Growth OS) ── */}
          {SCAFFOLD_MODULES.map((m) => (
            <Route key={m.key} path={m.path} element={<ModuleStub moduleKey={m.key} />} />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </PortalProvider>
  );
}

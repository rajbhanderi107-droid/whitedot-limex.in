import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import { AdminLayout } from "./components/AdminLayout.js";
import { LoginPage } from "./pages/LoginPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { InquiriesPage } from "./pages/InquiriesPage.js";
import { InquiryDetailPage } from "./pages/InquiryDetailPage.js";
import { GenericListPage } from "./pages/GenericListPage.js";
import "./admin.css";

function badgeClass(status: string) {
  if (["NEW", "REQUESTED"].includes(status)) return "adm-badge adm-badge-new";
  if (["WON", "APPROVED", "DELIVERED", "COMPLETED"].includes(status)) return "adm-badge adm-badge-won";
  if (["LOST", "REJECTED", "CANCELLED", "MISSED"].includes(status)) return "adm-badge adm-badge-lost";
  if (["PENDING"].includes(status)) return "adm-badge adm-badge-pending";
  return "adm-badge adm-badge-active";
}

function StatusBadge(val: unknown) {
  const s = String(val || "—");
  return <span className={badgeClass(s)}>{s.replace(/_/g, " ")}</span>;
}

function DateCol(val: unknown) {
  return <span style={{ color: "var(--adm-muted)" }}>{val ? new Date(String(val)).toLocaleDateString() : "—"}</span>;
}

export default function AdminApp() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();

  if (loading) return <div className="adm-loading" style={{ minHeight: "100vh" }}>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage onLogin={login} />
      } />

      {/* Protected routes */}
      <Route element={
        isAuthenticated && user ? <AdminLayout user={user} onLogout={logout} /> : <Navigate to="/admin/login" replace />
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inquiries" element={<InquiriesPage />} />
        <Route path="/inquiries/:id" element={<InquiryDetailPage />} />

        <Route path="/quote-requests" element={
          <GenericListPage title="Quote Requests" endpoint="/api/quote-requests" columns={[
            { key: "contactPerson", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "productCategory", label: "Product" },
            { key: "status", label: "Status", render: StatusBadge },
            { key: "createdAt", label: "Date", render: DateCol },
          ]} />
        } />

        <Route path="/sample-requests" element={
          <GenericListPage title="Sample Requests" endpoint="/api/sample-requests" columns={[
            { key: "contactPerson", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "requestedMaterialType", label: "Material" },
            { key: "status", label: "Status", render: StatusBadge },
            { key: "createdAt", label: "Date", render: DateCol },
          ]} />
        } />

        <Route path="/companies" element={
          <GenericListPage title="Companies" endpoint="/api/companies" columns={[
            { key: "companyName", label: "Company" },
            { key: "contactPerson", label: "Contact" },
            { key: "city", label: "City" },
            { key: "status", label: "Status", render: StatusBadge },
            { key: "createdAt", label: "Date", render: DateCol },
          ]} />
        } />

        <Route path="/calculator-submissions" element={
          <GenericListPage title="Calculator Submissions" endpoint="/api/calculator-submissions" columns={[
            { key: "contactPerson", label: "Contact" },
            { key: "companyName", label: "Company" },
            { key: "plasticType", label: "Plastic Type" },
            { key: "limexReplacementPercentage", label: "Replacement %" },
            { key: "createdAt", label: "Date", render: DateCol },
          ]} />
        } />

        <Route path="/follow-ups" element={
          <GenericListPage title="Follow-Ups" endpoint="/api/follow-ups" columns={[
            { key: "title", label: "Title" },
            { key: "dueDate", label: "Due Date", render: DateCol },
            { key: "status", label: "Status", render: StatusBadge },
            { key: "createdAt", label: "Created", render: DateCol },
          ]} />
        } />

        <Route path="/documents" element={
          <GenericListPage title="Documents" endpoint="/api/documents" columns={[
            { key: "title", label: "Title" },
            { key: "category", label: "Category" },
            { key: "fileType", label: "Type" },
            { key: "createdAt", label: "Date", render: DateCol },
          ]} />
        } />

        <Route path="/settings" element={
          <GenericListPage title="Website Settings" endpoint="/api/website-settings" columns={[
            { key: "key", label: "Key" },
            { key: "value", label: "Value" },
            { key: "type", label: "Type" },
            { key: "description", label: "Description" },
          ]} />
        } />

        <Route path="/users" element={
          <GenericListPage title="Users" endpoint="/api/users" columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            { key: "isActive", label: "Active", render: (v) => v ? "Yes" : "No" },
            { key: "createdAt", label: "Created", render: DateCol },
          ]} />
        } />

        <Route path="/activity-log" element={
          <GenericListPage title="Activity Log" endpoint="/api/activity-log" columns={[
            { key: "action", label: "Action" },
            { key: "entityType", label: "Entity" },
            { key: "createdAt", label: "Date", render: DateCol },
          ]} />
        } />

        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

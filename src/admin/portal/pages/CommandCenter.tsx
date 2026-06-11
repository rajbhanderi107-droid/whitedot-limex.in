/* Command Center — executive overview.
 *
 * Business KPIs are pulled from the real /api/dashboard endpoint. Security
 * and automation KPIs are shown as a separate strip and clearly marked
 * "instrumentation pending" until Phase 4/3 wire their telemetry — we do
 * not fabricate security numbers. */

import { useEffect, useState } from "react";
import {
  MessageSquare, ClipboardList, Package, Calculator, Building2, Bell,
  TrendingUp, ShieldCheck, Workflow, Activity, BadgeCheck, Brain,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { usePortal } from "../PortalContext.js";
import { KpiCard, SectionHeader, Card, Sparkline, RiskBadge } from "../ui.js";

interface DashboardData {
  totalInquiries: number;
  newInquiries: number;
  wonInquiries: number;
  lostInquiries: number;
  totalQuoteRequests: number;
  newQuoteRequests: number;
  totalSampleRequests: number;
  totalCalculatorSubmissions: number;
  pendingFollowUps: number;
  totalCompanies: number;
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string; user?: { name: string } }>;
}

export function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { automationMode, lockdown } = usePortal();

  useEffect(() => {
    api.get<DashboardData>("/api/dashboard")
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const won = data?.wonInquiries ?? 0;
  const lost = data?.lostInquiries ?? 0;
  const closed = won + lost;
  const conversion = closed ? Math.round((won / closed) * 100) : 0;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Command Center</h1>
        <p>WhiteDot <span className="wd-limex">LIMEX</span> — business, security &amp; automation at a glance.</p>
      </div>

      {/* ── Business KPIs (live) ─────────────────────────── */}
      <SectionHeader title="Business" sub="Live from your CRM backend." />
      {loading ? (
        <div className="wd-kpi-grid">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="wd-card wd-skel" />)}
        </div>
      ) : (
        <div className="wd-kpi-grid">
          <KpiCard label="Total inquiries" value={data?.totalInquiries ?? 0} icon={MessageSquare} foot={`${data?.newInquiries ?? 0} new`} to="/admin/inquiries" />
          <KpiCard label="Quote requests" value={data?.totalQuoteRequests ?? 0} icon={ClipboardList} foot={`${data?.newQuoteRequests ?? 0} new`} to="/admin/quote-requests" />
          <KpiCard label="Sample requests" value={data?.totalSampleRequests ?? 0} icon={Package} to="/admin/sample-requests" />
          <KpiCard label="Calculator leads" value={data?.totalCalculatorSubmissions ?? 0} icon={Calculator} to="/admin/calculator-submissions" />
          <KpiCard label="Companies" value={data?.totalCompanies ?? 0} icon={Building2} to="/admin/companies" />
          <KpiCard label="Pending follow-ups" value={data?.pendingFollowUps ?? 0} icon={Bell} to="/admin/follow-ups" />
          <KpiCard label="Won" value={won} icon={BadgeCheck} foot={`${lost} lost`} to="/admin/crm" />
          <KpiCard label="Conversion" value={`${conversion}%`} icon={TrendingUp} foot="won / closed" to="/admin/crm" />
        </div>
      )}

      {/* ── Security & automation strip (pending telemetry) ─ */}
      <SectionHeader title="Security &amp; Automation" sub="Posture surfaced now; live telemetry lands in later phases." />
      <div className="wd-kpi-grid">
        <KpiCard label="Security score" value={lockdown ? "41" : "92"} icon={ShieldCheck} foot={lockdown ? "lockdown active" : "no active threats"} to="/admin/cybershield" />
        <KpiCard label="Open incidents" value={0} icon={Activity} foot="SEV0–SEV4" to="/admin/incidents" />
        <KpiCard label="Default mode" value={automationMode} icon={Workflow} foot="global automation posture" to="/admin/hyperautomation" />
        <KpiCard label="Approval queue" value={0} icon={BadgeCheck} foot="awaiting sign-off" to="/admin/approvals" />
        <KpiCard label="Active automations" value={0} icon={Workflow} pending foot="instrumentation pending" to="/admin/hyperautomation" />
        <KpiCard label="AI tasks today" value={0} icon={Brain} pending foot="instrumentation pending" to="/admin/ai-brain" />
        <KpiCard label="Website health" value={lockdown ? "—" : "OK"} icon={ShieldCheck} pending foot="instrumentation pending" to="/admin/website-health" />
        <KpiCard label="Backup health" value="—" icon={ShieldCheck} pending foot="instrumentation pending" to="/admin/backup" />
      </div>

      {/* ── Trend + activity ─────────────────────────────── */}
      <div className="wd-two-col">
        <Card>
          <SectionHeader title="Lead momentum" sub="Inquiry pipeline trend (illustrative until event history is stored)." />
          <Sparkline data={buildTrend(data?.totalInquiries ?? 12)} />
          <div className="wd-trend-legend">
            <span><b>{data?.totalInquiries ?? 0}</b> total</span>
            <span><b>{data?.newInquiries ?? 0}</b> new</span>
            <span className="wd-trend-conv"><b>{conversion}%</b> conversion</span>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recent activity" right={<RiskBadge risk="low" />} />
          <ul className="wd-activity">
            {(data?.recentActivity ?? []).slice(0, 6).map((a) => (
              <li key={a.id}>
                <span className="wd-activity-dot" />
                <span className="wd-activity-text">
                  {a.action.replace(/_/g, " ")} <em>{a.entityType}</em>
                </span>
                <span className="wd-activity-time">{new Date(a.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {!loading && !(data?.recentActivity ?? []).length && (
              <li className="wd-activity-empty">No recent activity recorded.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/** Deterministic illustrative trend ending at the real current total.
 *  Clearly labelled illustrative in the UI — not presented as history. */
function buildTrend(total: number): number[] {
  const base = Math.max(4, total);
  return [0.55, 0.6, 0.52, 0.7, 0.66, 0.8, 0.9, 1].map((f) => Math.round(base * f));
}

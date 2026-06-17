/* Workforce Overview — HR command center.
 * Live headcount, status/type/department breakdowns, attendance & leave
 * signals, plus a company announcements composer. Backend-backed. */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, Plane, CalendarCheck, ClipboardList, Hourglass, Megaphone, Trash2, Send } from "lucide-react";
import {
  employeesApi, prettyEnum,
  type WorkforceOverview as Overview, type Department, type Announcement, type AnnouncementAudience,
} from "../../lib/employeesApi.js";
import { ApiError } from "../../lib/api.js";
import { SectionHeader, Card, KpiCard } from "../ui.js";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#34d399", ON_LEAVE: "#fbbf24", PROBATION: "#60a5fa", RESIGNED: "#9ca3af", TERMINATED: "#f87171",
};

export function WorkforceOverview() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [depts, setDepts] = useState<Department[]>([]);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Announcement composer
  const [aTitle, setATitle] = useState("");
  const [aBody, setABody] = useState("");
  const [aAudience, setAAudience] = useState<AnnouncementAudience>("ALL");
  const [aDept, setADept] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [o, d, a] = await Promise.all([
        employeesApi.workforceOverview(),
        employeesApi.listDepartments(),
        employeesApi.listAnnouncements(),
      ]);
      setOv(o.data); setDepts(d.data); setAnns(a.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load workforce overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const postAnnouncement = async () => {
    if (!aTitle.trim() || !aBody.trim()) return;
    if (aAudience === "DEPARTMENT" && !aDept) { setError("Select a department for a department-only announcement."); return; }
    setPosting(true); setError("");
    try {
      await employeesApi.createAnnouncement({
        title: aTitle.trim(), body: aBody.trim(), audience: aAudience,
        departmentId: aAudience === "DEPARTMENT" ? aDept : undefined,
      });
      setATitle(""); setABody(""); setAAudience("ALL"); setADept("");
      const a = await employeesApi.listAnnouncements();
      setAnns(a.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post announcement.");
    } finally { setPosting(false); }
  };

  const removeAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try { await employeesApi.deleteAnnouncement(id); setAnns((c) => c.filter((x) => x.id !== id)); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Delete failed."); }
  };

  const maxDept = Math.max(1, ...(ov?.byDepartment.map((d) => d.count) ?? [1]));

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <SectionHeader title="Workforce Overview" sub="Live headcount, attendance, leave & company communication" />
        <Link to="/admin/employees" className="wd-primary-btn"><Users size={14} /> Manage Employees</Link>
      </div>

      {error && <Card><p className="wd-danger" style={{ padding: 4 }}>{error}</p></Card>}

      {loading ? (
        <Card><p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>Loading overview…</p></Card>
      ) : !ov ? (
        <Card><p className="wd-muted" style={{ padding: 24, textAlign: "center" }}>No data yet.</p></Card>
      ) : (
        <>
          <div className="wd-kpi-grid">
            <KpiCard label="Headcount" value={ov.headcount} icon={Users} foot="Total employees" />
            <KpiCard label="Active" value={ov.active} icon={UserCheck} foot="Currently active" />
            <KpiCard label="On Leave" value={ov.onLeave} icon={Plane} foot="Away today" />
            <KpiCard label="Present Today" value={ov.presentToday} icon={CalendarCheck} foot="Punched in" />
            <KpiCard label="Pending Leave" value={ov.pendingLeave} icon={Hourglass} foot="Awaiting decision" />
            <KpiCard label="Open Tasks" value={ov.openTasks} icon={ClipboardList} foot="Across the team" />
          </div>

          <div className="wd-two-col">
            <Card>
              <SectionHeader title="By Department" sub={`${depts.length} departments`} />
              {ov.byDepartment.length === 0 ? (
                <p className="wd-muted" style={{ padding: 16 }}>No employees assigned yet.</p>
              ) : (
                <div style={{ padding: "8px 0", display: "grid", gap: 10 }}>
                  {ov.byDepartment.map((d) => (
                    <div key={d.departmentId ?? "none"} style={{ display: "grid", gridTemplateColumns: "140px 1fr 40px", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 13 }}>{d.department}</span>
                      <span className="wd-wf-leave-track"><span className="wd-wf-leave-fill" style={{ width: `${(d.count / maxDept) * 100}%` }} /></span>
                      <strong style={{ textAlign: "right", fontSize: 13 }}>{d.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionHeader title="By Status & Type" sub="Workforce composition" />
              <div style={{ padding: "8px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ov.byStatus.map((s) => (
                  <span key={s.status} className="wd-chip" style={{ borderColor: STATUS_COLORS[s.status] }}>
                    <span style={{ color: STATUS_COLORS[s.status], fontWeight: 700 }}>{s.count}</span> {prettyEnum(s.status)}
                  </span>
                ))}
              </div>
              <div style={{ padding: "8px 0", display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {ov.byType.map((t) => (
                  <span key={t.type} className="wd-chip"><strong>{t.count}</strong> {prettyEnum(t.type)}</span>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeader title="Company Announcements" sub="Posted to the employee workspace" right={<Megaphone size={16} className="wd-muted" />} />
            <div className="wd-form-grid" style={{ marginTop: 8 }}>
              <label className="wd-form-full">Title<input value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="e.g. Diwali holiday schedule" /></label>
              <label className="wd-form-full">Message<textarea value={aBody} onChange={(e) => setABody(e.target.value)} rows={3} placeholder="Write the announcement…" /></label>
              <label>Audience
                <select value={aAudience} onChange={(e) => setAAudience(e.target.value as AnnouncementAudience)}>
                  <option value="ALL">Everyone</option>
                  <option value="DEPARTMENT">One department</option>
                </select>
              </label>
              {aAudience === "DEPARTMENT" && (
                <label>Department
                  <select value={aDept} onChange={(e) => setADept(e.target.value)}>
                    <option value="">— Select —</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="wd-primary-btn" onClick={postAnnouncement} disabled={posting || !aTitle.trim() || !aBody.trim()}>
                <Send size={14} /> {posting ? "Posting…" : "Post Announcement"}
              </button>
            </div>

            {anns.length > 0 && (
              <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                {anns.map((a) => (
                  <div key={a.id} className="wd-wf-ann">
                    <div>
                      <strong>{a.title}</strong>
                      <span className="wd-muted" style={{ fontSize: 11, marginLeft: 8 }}>
                        {a.audience === "ALL" ? "Everyone" : a.department?.name ?? "Department"} · {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                      <p className="wd-muted" style={{ fontSize: 13, marginTop: 2 }}>{a.body}</p>
                    </div>
                    <button className="wd-ghost-btn wd-wf-mini wd-danger" title="Delete" onClick={() => removeAnnouncement(a.id)}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

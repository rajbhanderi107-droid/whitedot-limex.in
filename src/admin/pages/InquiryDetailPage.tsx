import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

interface InquiryDetail {
  id: string; name: string; email: string; phone?: string; companyName?: string;
  designation?: string; city?: string; country?: string; industry?: string;
  inquiryType?: string; message?: string; sourcePage?: string;
  status: string; priority: string; internalNotes?: string; followUpDate?: string;
  createdAt: string; updatedAt: string;
  assignedTo?: { id: string; name: string; email: string };
  company?: { id: string; companyName: string };
  adminNotes: Array<{ id: string; content: string; createdAt: string; createdBy: { name: string } }>;
}

export function InquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get<InquiryDetail>(`/api/inquiries/${id}`)
      .then((r) => { setInquiry(r.data); setStatus(r.data.status); setPriority(r.data.priority); })
      .catch(() => navigate("/admin/inquiries"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateStatus = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.patch(`/api/inquiries/${id}`, { status, priority });
      showToast("Status updated");
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  const addNote = async () => {
    if (!id || !noteText.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<InquiryDetail["adminNotes"][number]>(`/api/inquiries/${id}/notes`, { content: noteText });
      setInquiry((prev) => prev ? { ...prev, adminNotes: [res.data, ...prev.adminNotes] } : prev);
      setNoteText("");
      showToast("Note added");
    } catch { showToast("Failed to add note"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="adm-loading">Loading...</div>;
  if (!inquiry) return <div className="adm-empty">Inquiry not found.</div>;

  return (
    <>
      <div className="adm-header">
        <h1>{inquiry.name}</h1>
        <p>Inquiry from {new Date(inquiry.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="adm-detail">
        <div className="adm-detail-main">
          <div className="adm-card">
            <h3>Contact Details</h3>
            <dl>
              {[
                ["Email", inquiry.email], ["Phone", inquiry.phone], ["Company", inquiry.companyName],
                ["Designation", inquiry.designation], ["City", inquiry.city], ["Country", inquiry.country],
                ["Industry", inquiry.industry], ["Inquiry Type", inquiry.inquiryType], ["Source", inquiry.sourcePage],
              ].map(([label, value]) => value ? (
                <div className="adm-card-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ) : null)}
            </dl>
          </div>

          {inquiry.message && (
            <div className="adm-card">
              <h3>Message</h3>
              <p style={{ fontSize: ".85rem", lineHeight: 1.6 }}>{inquiry.message}</p>
            </div>
          )}

          <div className="adm-card">
            <h3>Notes ({inquiry.adminNotes.length})</h3>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: ".8rem" }}>
              <input className="adm-input" style={{ flex: 1 }} placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button className="adm-btn adm-btn-primary" onClick={addNote} disabled={saving || !noteText.trim()}>Add</button>
            </div>
            {inquiry.adminNotes.map((n) => (
              <div className="adm-note" key={n.id}>
                <div className="adm-note-meta">{n.createdBy.name} · {new Date(n.createdAt).toLocaleDateString()}</div>
                <div className="adm-note-text">{n.content}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="adm-detail-aside">
          <div className="adm-card">
            <h3>Status & Priority</h3>
            <div className="adm-form-group" style={{ marginBottom: ".6rem" }}>
              <label>Status</label>
              <select className="adm-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {["NEW","CONTACTED","QUALIFIED","PROPOSAL_SENT","WON","LOST","ARCHIVED"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="adm-form-group" style={{ marginBottom: ".8rem" }}>
              <label>Priority</label>
              <select className="adm-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="adm-btn adm-btn-primary" style={{ width: "100%" }} onClick={updateStatus} disabled={saving}>
              {saving ? "Saving..." : "Update Status"}
            </button>
          </div>

          <div className="adm-card">
            <h3>Assignment</h3>
            <p style={{ fontSize: ".82rem", color: "var(--adm-muted)" }}>
              {inquiry.assignedTo ? `Assigned to ${inquiry.assignedTo.name}` : "Unassigned"}
            </p>
          </div>
        </div>
      </div>

      {toast && <div className={`adm-toast adm-toast-success`}>{toast}</div>}
    </>
  );
}

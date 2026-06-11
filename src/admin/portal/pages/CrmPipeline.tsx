/* CRM & Sales Pipeline — a working Kanban over live inquiry data.
 *
 * Cards are dragged between stage columns; each move persists to
 * PATCH /api/inquiries/:id { status } (optimistic, with rollback on
 * failure). A per-card stage <select> provides the same action for
 * touch/keyboard users. Lead score + temperature are computed client-side
 * via leadScore.ts. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutList, Columns3, RefreshCw, Sparkles } from "lucide-react";
import { api } from "../../lib/api.js";
import { portalApi } from "../portalApi.js";
import { usePortal } from "../PortalContext.js";
import { leadScore, temperature, tempClass, type ScorableLead } from "../leadScore.js";
import { SectionHeader } from "../ui.js";

interface Lead extends ScorableLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: { id: string; name: string } | null;
}

const STAGES: { key: string; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
  { key: "ARCHIVED", label: "Archived" },
];
const STAGE_KEYS = STAGES.map((s) => s.key);

export function CrmPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);
  const { lockdown } = usePortal();

  /** Generate a real AI follow-up draft for this lead; it lands in the
   *  Approval Center for human review — nothing is sent automatically. */
  const aiDraft = useCallback(async (l: Lead) => {
    setDraftingId(l.id);
    setDraftMsg(null);
    try {
      await portalApi.aiDraft({
        kind: "followup_email",
        lead: { name: l.name, company: l.companyName, status: l.status },
      });
      setDraftMsg(`AI draft for ${l.name} queued in the Approval Center.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI draft failed.";
      setDraftMsg(`AI draft failed: ${msg}`);
    } finally {
      setDraftingId(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // Pull a wide page; the pipeline shows the whole active book.
      const res = await api.get<Lead[]>("/api/inquiries?page=1&limit=200");
      setLeads(res.data);
    } catch (e) {
      console.error(e);
      setErr("Could not load leads. The backend may be waking up — retry in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = Object.fromEntries(STAGE_KEYS.map((k) => [k, []]));
    for (const l of leads) (map[l.status] ?? (map[l.status] = [])).push(l);
    // Hottest first within a column.
    for (const k of STAGE_KEYS) map[k].sort((a, b) => leadScore(b) - leadScore(a));
    return map;
  }, [leads]);

  const moveLead = useCallback(async (id: string, status: string) => {
    const prev = leads;
    const target = leads.find((l) => l.id === id);
    if (!target || target.status === status) return;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l))); // optimistic
    try {
      await api.patch(`/api/inquiries/${id}`, { status });
    } catch (e) {
      console.error(e);
      setLeads(prev); // rollback
      setErr("Stage change failed — reverted. Check your connection and try again.");
    }
  }, [leads]);

  const onDrop = (stage: string) => {
    setOverStage(null);
    if (dragId) moveLead(dragId, stage);
    setDragId(null);
  };

  const pipelineCount = leads.filter((l) => !["WON", "LOST", "ARCHIVED"].includes(l.status)).length;
  const wonCount = byStage.WON?.length ?? 0;

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>CRM &amp; Sales Pipeline</h1>
        <p>{pipelineCount} active leads · {wonCount} won · drag a card to change its stage.</p>
      </div>

      <SectionHeader
        title="Pipeline"
        sub="Live inquiry data. Stage changes persist to your CRM backend."
        right={
          <button className="wd-ghost-btn" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "wd-spin" : ""} /> Refresh
          </button>
        }
      />

      {err && <div className="wd-inline-err">{err}</div>}
      {draftMsg && <div className={draftMsg.startsWith("AI draft failed") ? "wd-inline-err" : "wd-inline-ok"}>{draftMsg}</div>}
      {lockdown && <div className="wd-mod-lock"><Columns3 size={15} /> Lockdown active — stage changes still save, but automated follow-ups are paused.</div>}

      {loading ? (
        <div className="wd-kanban">
          {STAGES.map((s) => <div key={s.key} className="wd-col"><div className="wd-card wd-skel" style={{ height: 120 }} /></div>)}
        </div>
      ) : leads.length === 0 ? (
        <div className="wd-empty-state"><LayoutList size={28} /><p>No leads yet. New inquiries from the website land here automatically.</p></div>
      ) : (
        <div className="wd-kanban">
          {STAGES.map((stage) => {
            const items = byStage[stage.key] ?? [];
            const value = items.reduce((sum, l) => sum + leadScore(l), 0);
            return (
              <div
                key={stage.key}
                className={`wd-col${overStage === stage.key ? " wd-col-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
                onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                onDrop={() => onDrop(stage.key)}
              >
                <div className="wd-col-head">
                  <span className="wd-col-title">{stage.label}</span>
                  <span className="wd-col-count">{items.length}</span>
                </div>
                <div className="wd-col-meta">score {value}</div>
                <div className="wd-col-body">
                  {items.map((l) => {
                    const score = leadScore(l);
                    const temp = temperature(score);
                    return (
                      <div
                        key={l.id}
                        className="wd-lead-card"
                        draggable
                        onDragStart={() => setDragId(l.id)}
                        onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      >
                        <div className="wd-lead-top">
                          <Link to={`/admin/inquiries/${l.id}`} className="wd-lead-name">{l.name}</Link>
                          <span className={`wd-temp wd-temp-${tempClass(temp)}`}>{score}</span>
                        </div>
                        <div className="wd-lead-co">{l.companyName || l.email || "—"}</div>
                        <div className="wd-lead-foot">
                          <span className={`wd-prio wd-prio-${l.priority.toLowerCase()}`}>{l.priority}</span>
                          <span className="wd-temp-label">{temp}</span>
                          {l.assignedTo && <span className="wd-lead-owner">{l.assignedTo.name.split(" ")[0]}</span>}
                        </div>
                        <select
                          className="wd-lead-stage"
                          value={l.status}
                          aria-label={`Change stage for ${l.name}`}
                          onChange={(e) => moveLead(l.id, e.target.value)}
                        >
                          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <button
                          className="wd-ai-btn"
                          disabled={draftingId === l.id || lockdown}
                          onClick={() => aiDraft(l)}
                          title={lockdown ? "Paused during lockdown" : "Generate AI follow-up draft (goes to Approval Center)"}
                        >
                          <Sparkles size={12} /> {draftingId === l.id ? "Drafting…" : "AI draft"}
                        </button>
                      </div>
                    );
                  })}
                  {!items.length && <div className="wd-col-empty">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

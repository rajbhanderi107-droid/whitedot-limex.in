/* Approval Center — the single human sign-off queue (server-backed).
 *
 * Items arrive from APPROVAL-mode automations and from AI drafting (the
 * CRM "AI draft" action). Decisions persist to Postgres with the deciding
 * user recorded; approving while lockdown is active is refused by the
 * server (HTTP 423) and surfaced here. */

import { useState } from "react";
import { Check, X, Inbox, RefreshCw } from "lucide-react";
import { useApprovals } from "../automationStore.js";
import { usePortal } from "../PortalContext.js";
import { SectionHeader, RiskBadge, type Risk } from "../ui.js";

export function ApprovalCenter() {
  const { items, loading, error, refresh, decide } = useApprovals();
  const { lockdown } = usePortal();
  const [actionErr, setActionErr] = useState<string | null>(null);

  const onDecide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setActionErr(null);
    try {
      await decide(id, decision);
    } catch {
      setActionErr(decision === "APPROVED"
        ? "Approval refused — lockdown is active or the backend is unreachable."
        : "Could not record the decision — try again.");
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Approval Center</h1>
        <p>{items.length} item{items.length === 1 ? "" : "s"} awaiting sign-off. Every decision is recorded with your user.</p>
      </div>

      {lockdown && (
        <div className="wd-mod-lock"><X size={15} /> Lockdown active — the server refuses approvals until lockdown is cleared. Rejections still work.</div>
      )}
      {(error || actionErr) && <div className="wd-inline-err">{actionErr ?? error}</div>}

      <SectionHeader
        title="Pending approvals"
        right={<button className="wd-ghost-btn" onClick={refresh} disabled={loading}><RefreshCw size={13} className={loading ? "wd-spin" : ""} /> Refresh</button>}
      />

      {loading ? (
        <div className="wd-auto-list">{[1, 2].map((i) => <div key={i} className="wd-card wd-skel" style={{ height: 90 }} />)}</div>
      ) : items.length === 0 ? (
        <div className="wd-empty-state">
          <Inbox size={28} />
          <p>Queue is empty. AI drafts from the CRM and APPROVAL-mode automations land here.</p>
        </div>
      ) : (
        <div className="wd-approval-list">
          {items.map((it) => (
            <div key={it.id} className="wd-approval">
              <div className="wd-approval-main">
                <div className="wd-approval-title">{it.title} <RiskBadge risk={it.risk.toLowerCase() as Risk} /></div>
                <div className="wd-approval-kind">{it.kind}</div>
                <div className="wd-approval-preview">{it.preview}</div>
                <div className="wd-approval-meta">
                  {it.automationId ? `from ${it.automationId} · ` : ""}
                  {it.createdBy?.name ? `queued by ${it.createdBy.name} · ` : ""}
                  {new Date(it.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="wd-approval-actions">
                <button className="wd-approve" disabled={lockdown} onClick={() => onDecide(it.id, "APPROVED")}
                  title={lockdown ? "Blocked during lockdown" : "Approve"}><Check size={14} /> Approve</button>
                <button className="wd-reject" onClick={() => onDecide(it.id, "REJECTED")}><X size={14} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

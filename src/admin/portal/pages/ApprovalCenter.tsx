/* Approval Center — the single human sign-off queue.
 *
 * Items arrive when an APPROVAL-mode automation queues a draft (from the
 * HyperAutomation room). Approving/Rejecting clears the item. Nothing here
 * sends anything yet — it records the human decision; the future executor
 * acts on approved items. */

import { Check, X, Inbox, Trash2 } from "lucide-react";
import { useApprovals } from "../automationStore.js";
import { usePortal } from "../PortalContext.js";
import { SectionHeader, RiskBadge } from "../ui.js";

export function ApprovalCenter() {
  const { items, resolve, clear } = useApprovals();
  const { lockdown } = usePortal();

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Approval Center</h1>
        <p>{items.length} item{items.length === 1 ? "" : "s"} awaiting sign-off. Drafts queued by automations land here.</p>
      </div>

      {lockdown && (
        <div className="wd-mod-lock"><X size={15} /> Lockdown active — approving external sends is blocked until lockdown is cleared.</div>
      )}

      <SectionHeader
        title="Pending approvals"
        right={items.length > 0 ? <button className="wd-ghost-btn" onClick={clear}><Trash2 size={13} /> Clear all</button> : undefined}
      />

      {items.length === 0 ? (
        <div className="wd-empty-state">
          <Inbox size={28} />
          <p>Queue is empty. Set an automation to <b>Approval</b> mode and click “Queue draft” in the HyperAutomation room to see items here.</p>
        </div>
      ) : (
        <div className="wd-approval-list">
          {items.map((it) => (
            <div key={it.id} className="wd-approval">
              <div className="wd-approval-main">
                <div className="wd-approval-title">{it.title} <RiskBadge risk={it.risk} /></div>
                <div className="wd-approval-kind">{it.kind}</div>
                <div className="wd-approval-preview">{it.preview}</div>
                <div className="wd-approval-meta">from {it.automationId} · {new Date(it.createdAt).toLocaleString()}</div>
              </div>
              <div className="wd-approval-actions">
                <button className="wd-approve" disabled={lockdown} onClick={() => resolve(it.id)} title={lockdown ? "Blocked during lockdown" : "Approve"}><Check size={14} /> Approve</button>
                <button className="wd-reject" onClick={() => resolve(it.id)}><X size={14} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

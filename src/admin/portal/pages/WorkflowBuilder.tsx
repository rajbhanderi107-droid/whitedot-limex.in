/* Workflow Builder — a lightweight visual designer.
 *
 * Compose a trigger → condition → action workflow on top of the fixed
 * safety pipeline (Risk → Permission → Log → Notify → Fallback → Rollback)
 * mandated by the spec, then save it as a draft. Drafts persist locally
 * until a backend orchestrator is wired to execute them. */

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ArrowDown, Save } from "lucide-react";
import { SectionHeader } from "../ui.js";

const TRIGGERS = [
  "New lead submitted", "Product inquiry received", "Brochure downloaded", "Sample requested",
  "Sample delivered", "Quotation viewed", "Quotation accepted", "Quotation expired",
  "Order created", "Invoice overdue", "Customer inactive", "Stock low", "Campaign completed",
  "Blog published", "Form failed", "API failed", "Suspicious login detected", "Malware detected",
  "Vulnerability detected", "Backup failed", "Website down",
];
const CONDITIONS = [
  "Lead score above 70", "Product sample available", "Customer opted in", "Salesperson assigned",
  "Quotation value above threshold", "Campaign budget approved", "Security risk below threshold",
  "Business hours only", "Region allowed", "Message limit not exceeded", "MFA completed", "Integration connected",
];
const ACTIONS = [
  "Create lead", "Score lead", "Assign salesperson", "Send notification", "Draft WhatsApp message",
  "Draft email", "Send approved message", "Create follow-up task", "Create quotation draft",
  "Generate proposal", "Create campaign draft", "Generate landing page", "Generate blog", "Update CRM",
  "Update stock", "Create incident", "Pause automation", "Quarantine file", "Revoke session",
  "Disable integration", "Create bug ticket", "Run test", "Deploy to staging", "Rollback deployment",
];
const SAFETY = ["Risk check", "Permission check", "Log", "Notification", "Fallback", "Rollback"];

interface WorkflowDraft { id: string; name: string; trigger: string; condition: string; action: string; createdAt: string }
const KEY = "wd_workflows";

function load(): WorkflowDraft[] {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return [];
}

export function WorkflowBuilder() {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [action, setAction] = useState(ACTIONS[0]);
  const [drafts, setDrafts] = useState<WorkflowDraft[]>(load);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(drafts)); } catch { /* ignore */ } }, [drafts]);

  const save = useCallback(() => {
    setDrafts((d) => [
      { id: `wf_${Date.now()}`, name: name.trim() || `${trigger} → ${action}`, trigger, condition, action, createdAt: new Date().toISOString() },
      ...d,
    ]);
    setName("");
  }, [name, trigger, condition, action]);

  const remove = (id: string) => setDrafts((d) => d.filter((w) => w.id !== id));

  return (
    <div className="wd-page">
      <div className="wd-page-head">
        <h1>Workflow Builder</h1>
        <p>Design a workflow on the enforced safety pipeline. Drafts are saved locally until the orchestrator is wired.</p>
      </div>

      <div className="wd-two-col">
        <div className="wd-card">
          <SectionHeader title="Design" />
          <label className="wd-field"><span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New-lead WhatsApp nudge" />
          </label>
          <label className="wd-field"><span>Trigger</span>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>{TRIGGERS.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="wd-field"><span>Condition</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="wd-field"><span>Action</span>
            <select value={action} onChange={(e) => setAction(e.target.value)}>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select>
          </label>
          <button className="wd-primary-btn" onClick={save}><Save size={14} /> Save workflow draft</button>
        </div>

        <div className="wd-card">
          <SectionHeader title="Pipeline preview" sub="Safety steps are always enforced." />
          <div className="wd-flow">
            <div className="wd-flow-step wd-flow-trigger">{trigger}<small>Trigger</small></div>
            <ArrowDown size={14} className="wd-flow-arrow" />
            <div className="wd-flow-step wd-flow-cond">{condition}<small>Condition</small></div>
            <ArrowDown size={14} className="wd-flow-arrow" />
            <div className="wd-flow-step wd-flow-action">{action}<small>Action</small></div>
            <ArrowDown size={14} className="wd-flow-arrow" />
            <div className="wd-flow-safety">
              {SAFETY.map((s) => <span key={s} className="wd-flow-safety-step">{s}</span>)}
            </div>
          </div>
        </div>
      </div>

      <SectionHeader title={`Saved drafts (${drafts.length})`} />
      {drafts.length === 0 ? (
        <div className="wd-empty-state"><Plus size={26} /><p>No workflows yet. Design one above and save it.</p></div>
      ) : (
        <div className="wd-auto-list">
          {drafts.map((w) => (
            <div key={w.id} className="wd-auto">
              <div className="wd-auto-main">
                <div className="wd-auto-name">{w.name}</div>
                <div className="wd-auto-flow"><span>{w.trigger}</span> → <span>{w.condition}</span> → <span className="wd-auto-action">{w.action}</span></div>
                <div className="wd-auto-meta">draft · saved {new Date(w.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="wd-auto-controls">
                <button className="wd-ghost-btn" onClick={() => remove(w.id)}><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

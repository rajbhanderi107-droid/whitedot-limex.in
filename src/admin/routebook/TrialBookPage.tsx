/* LIMEX Trial Book — the fifteen-head trial form, typed here instead of in Excel.
 *
 * The folder on the laptop stays the record of truth. Saving a trial here only
 * records it and takes its number; portal_sync.py on the laptop is what writes
 * "TRIAL WEEKLY LIST\<n>. WHITEDOT BY SEVENDOT - ....xlsx" from the same
 * Trial format.xlsx template Raj has always used, drops the photo into the
 * merged box, and lets sync_trials.py fold it into the master. That is why
 * there is no Excel export button here: an export from the browser could only
 * ever be a second, slightly different file. */

import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Plus, Save, X, Image as ImageIcon, Check, Clock, Trash2 } from "lucide-react";
import { toast } from "./ctx.js";
import { trialApi, TRIAL_HEADS, type Trial, type TrialFields } from "./trialBookApi.js";

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): TrialFields => ({ trialOn: today() });

export function TrialBookPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [nextNo, setNextNo] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Trial | null>(null);
  const [draft, setDraft] = useState<TrialFields | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setStatus("loading");
    try {
      const d = await trialApi.list();
      setTrials(d.trials);
      setNextNo(d.nextTrialNo);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the Trial Book");
      setStatus("error");
    }
  };
  useEffect(() => { void load(); }, []);

  const pending = useMemo(() => trials.filter(t => !t.syncedAt).length, [trials]);

  const startNew = () => { setEditing(null); setDraft(blank()); };
  const startEdit = (t: Trial) => {
    setEditing(t);
    const { id, trialNo, createdAt, updatedAt, createdBy, fileName, syncedAt, ...fields } = t;
    void id; void trialNo; void createdAt; void updatedAt; void createdBy; void fileName; void syncedAt;
    setDraft(fields);
  };
  const close = () => { setDraft(null); setEditing(null); };

  const save = async () => {
    if (!draft) return;
    if (!draft.product?.trim()) { toast("A trial needs at least the product"); return; }
    setSaving(true);
    try {
      if (editing) {
        await trialApi.update(editing.id, draft);
        toast(`Trial ${editing.trialNo} updated — the laptop will rewrite the workbook`);
      } else {
        const { trial } = await trialApi.create(draft);
        toast(`Trial ${trial.trialNo} recorded`);
      }
      close();
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the trial");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Trial) => {
    if (!window.confirm(`Remove trial ${t.trialNo}? Its number is not given to anyone else.`)) return;
    try {
      await trialApi.remove(t.id);
      toast(`Trial ${t.trialNo} removed`);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove the trial");
    }
  };

  const set = (k: keyof TrialFields, v: string) => setDraft(d => (d ? { ...d, [k]: v } : d));

  if (status === "loading") {
    return <div className="wd-page rb-page">
      <div className="wd-page-head"><h1><FlaskConical size={20} /> LIMEX Trial Book</h1><p>Loading…</p></div>
      <div className="wd-card wd-skel" style={{ height: 160 }} />
    </div>;
  }
  if (status === "error") {
    return <div className="wd-page rb-page">
      <div className="wd-page-head"><h1><FlaskConical size={20} /> LIMEX Trial Book</h1></div>
      <div className="wd-inline-err">{error} <button type="button" className="wd-ghost-btn" onClick={() => void load()}>Try again</button></div>
    </div>;
  }

  return (
    <div className="wd-page rb-page" data-testid="trial-book">
      <div className="wd-page-head">
        <h1><FlaskConical size={20} /> LIMEX Trial Book</h1>
        <p>
          {trials.length} trial{trials.length === 1 ? "" : "s"}
          {nextNo ? ` · next is ${nextNo}` : ""}
          {pending ? ` · ${pending} waiting for the laptop to write the workbook` : ""}
        </p>
        <div className="wd-page-actions">
          <button type="button" className="wd-primary-btn" onClick={startNew}><Plus size={14} /> New trial</button>
        </div>
      </div>

      {/* Oldest first: the newest trial reads at the bottom, as in the workbook. */}
      {trials.length === 0 ? (
        <div className="wd-card"><p>No trials yet. The first one will be trial 1.</p></div>
      ) : (
        <div className="wd-card rb-trial-list">
          {trials.map(t => (
            <article key={t.id} className="rb-trial-row">
              <header>
                <strong>Trial {t.trialNo}</strong>
                <span className="rb-trial-product">{t.product}</span>
                {t.brandOwner ? <span className="rb-trial-owner">{t.brandOwner}</span> : null}
                <span className="rb-trial-when">{t.trialOn ?? ""}</span>
                {t.syncedAt
                  ? <span className="rb-trial-ok" title={t.fileName ?? ""}><Check size={13} /> in the folder</span>
                  : <span className="rb-trial-wait"><Clock size={13} /> not written yet</span>}
              </header>
              <dl>
                {t.limexGrade ? <><dt>Grade</dt><dd>{t.limexGrade}</dd></> : null}
                {t.mixLimex ? <><dt>Mix</dt><dd>{[t.mixBatch, t.mixResin, t.mixLimex].filter(Boolean).join(" | ")}</dd></> : null}
                {t.originalWeight || t.trialWeight
                  ? <><dt>Weight</dt><dd>{t.originalWeight ?? "—"} → {t.trialWeight ?? "—"}</dd></> : null}
                {t.result ? <><dt>Result</dt><dd>{t.result}</dd></> : null}
              </dl>
              <footer>
                <button type="button" className="wd-ghost-btn" onClick={() => startEdit(t)}>Edit</button>
                <button type="button" className="wd-ghost-btn" onClick={() => void remove(t)}><Trash2 size={13} /> Remove</button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <div className="wd-modal-backdrop" role="dialog" aria-modal="true" aria-label="Trial form">
          <div className="wd-modal rb-trial-form">
            <header className="wd-modal-head">
              <h2>{editing ? `Trial ${editing.trialNo}` : `New trial${nextNo ? ` — will be ${nextNo}` : ""}`}</h2>
              <button type="button" className="wd-icon-btn" onClick={close} aria-label="Close"><X size={16} /></button>
            </header>

            <div className="wd-modal-body">
              <label className="wd-field">
                <span>Date of trial</span>
                <input type="date" value={draft.trialOn ?? ""} onChange={e => set("trialOn", e.target.value)} />
              </label>

              {TRIAL_HEADS.map(h => (
                <label className="wd-field" key={h.key}>
                  <span>{h.sr === "" ? "" : `${h.sr}. `}{h.label}</span>
                  {h.long
                    ? <textarea rows={2} value={(draft[h.key] as string) ?? ""} onChange={e => set(h.key, e.target.value)} />
                    : <input type="text" value={(draft[h.key] as string) ?? ""} onChange={e => set(h.key, e.target.value)} />}
                </label>
              ))}

              {/* 15 — the photo. It stays in the folder and in Drive; the book
                  only remembers the way back to it. */}
              <fieldset className="wd-fieldset">
                <legend><ImageIcon size={14} /> 15. Image of current packaging item</legend>
                <p className="wd-hint">
                  The picture lives in the whitedot folder and in Google Drive. Give it a name or a
                  Drive link and the laptop will place it in the workbook's image box.
                </p>
                <label className="wd-field">
                  <span>File name</span>
                  <input type="text" placeholder="WhatsApp Image 2026-09-10 at 8.13.11 PM.jpeg"
                    value={draft.imageName ?? ""} onChange={e => set("imageName", e.target.value)} />
                </label>
                <label className="wd-field">
                  <span>Google Drive link</span>
                  <input type="url" placeholder="https://drive.google.com/…"
                    value={draft.imageDriveUrl ?? ""} onChange={e => set("imageDriveUrl", e.target.value)} />
                </label>
              </fieldset>
            </div>

            <footer className="wd-modal-foot">
              <button type="button" className="wd-ghost-btn" onClick={close}>Cancel</button>
              <button type="button" className="wd-primary-btn" onClick={() => void save()} disabled={saving}>
                <Save size={14} /> {saving ? "Saving…" : editing ? "Save changes" : "Record trial"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

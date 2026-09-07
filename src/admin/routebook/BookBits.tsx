/* Pieces shared by the Lead Book and the Customer Book.
 *
 * All three books read the same store, so a company promoted on one screen
 * appears on the next one without a reload — there is only ever one copy of
 * the data. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Cloud, CloudOff, CloudUpload, AlertTriangle, Smartphone } from "lucide-react";
import { load, startLiveSync, useRb, type RbState } from "./store.js";
import { Toasts } from "./Overlays.js";
import "./routebook.css";

/** True inside one of the standalone book apps (/route/, /leads/,
 *  /customers/), which set data-book on <html>. The portal does not. */
export const inBookApp = () => !!document.documentElement.dataset.book;

/** The standalone app for one book — the version that installs on a phone. */
export function OpenAsApp({ dir, label }: { dir: "route" | "leads" | "customers"; label: string }) {
  if (inBookApp()) return null;
  return (
    <a className="wd-ghost-btn" href={`/${dir}/`} title={`Open the ${label} as its own app — add it to your home screen from there`}>
      <Smartphone size={13} /> App
    </a>
  );
}

/** Load the book once, then keep this tab in step with everyone else's. */
export function useBook(): RbState {
  const st = useRb();
  useEffect(() => { void load(); return startLiveSync(); }, []);
  return st;
}

export function SyncBadge({ st }: { st: RbState }) {
  if (st.sync === "offline") {
    return <span className="rb-sync is-off"><CloudOff size={13} /> Offline{st.pending ? ` · ${st.pending} queued` : ""}</span>;
  }
  if (st.sync === "error") {
    return <span className="rb-sync is-err" title={st.error ?? ""}><AlertTriangle size={13} /> Couldn’t save · retrying</span>;
  }
  if (st.sync === "saving") {
    return <span className="rb-sync is-saving"><CloudUpload size={13} /> Saving{st.pending ? ` ${st.pending}` : ""}…</span>;
  }
  return <span className="rb-sync"><Cloud size={13} /> Saved{st.fromCache ? " · offline copy" : ""}</span>;
}

interface ShellProps {
  st: RbState;
  icon: ReactNode;
  title: string;
  sub: string;
  actions?: ReactNode;
  testId: string;
  children: ReactNode;
}

export function BookShell({ st, icon, title, sub, actions, testId, children }: ShellProps) {
  if (st.status === "loading" || st.status === "idle") {
    return (
      <div className="wd-page rb-page">
        <div className="wd-page-head"><h1>{icon} {title}</h1><p>Loading…</p></div>
        <div className="wd-card wd-skel" style={{ height: 160 }} />
      </div>
    );
  }
  if (st.status === "error") {
    return (
      <div className="wd-page rb-page">
        <div className="wd-page-head"><h1>{icon} {title}</h1></div>
        <div className="wd-inline-err">
          {st.error} <button type="button" className="wd-ghost-btn" onClick={() => load(true)}>Try again</button>
        </div>
      </div>
    );
  }
  return (
    <div className="wd-page rb-page" data-testid={testId}>
      <div className="wd-page-head rb-head">
        <div><h1>{icon} {title}</h1><p>{sub}</p></div>
        <div className="rb-head-right"><SyncBadge st={st} />{actions}</div>
      </div>
      {st.error && st.sync === "error" && <div className="wd-inline-err">{st.error}</div>}
      {children}
      <Toasts />
    </div>
  );
}

/* ─── one editable field ───────────────────────────────────────────────────
   Saves when you leave the box, not on every keystroke: the outbox batches
   anyway, and a half-typed GST number is not worth sending. */

interface FieldProps {
  label: string;
  value: string | number | null | undefined;
  onSave: (v: string) => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
  step?: string;
  wide?: boolean;
}

export function Field({ label, value, onSave, type = "text", placeholder, step, wide }: FieldProps) {
  const [draft, setDraft] = useState(value === null || value === undefined ? "" : String(value));
  const committed = useRef(draft);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = value === null || value === undefined ? "" : String(value);
    // Only adopt a change that came from elsewhere — never fight the typist.
    if (next !== committed.current && document.activeElement !== input.current) {
      committed.current = next; setDraft(next);
    }
  }, [value, label]);
  const commit = () => {
    if (!input.current?.checkValidity()) { input.current?.reportValidity(); return; }
    if (draft === committed.current) {
      const latest = value == null ? "" : String(value);
      committed.current = latest; setDraft(latest);
      return;
    }
    committed.current = draft;
    onSave(draft.trim());
  };
  return (
    <label className={`rb-bfield${wide ? " is-wide" : ""}`}>
      <span>{label}</span>
      <input
        ref={input}
        data-field={label}
        min={type === "number" ? 0 : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
        type={type} step={step} placeholder={placeholder} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </label>
  );
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return <div className="rb-bempty"><b>{title}</b><span>{hint}</span></div>;
}

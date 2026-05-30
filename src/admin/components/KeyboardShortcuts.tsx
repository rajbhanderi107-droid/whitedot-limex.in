import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

/** `g` then <key> jumps to a section. */
const GOTO: Record<string, { to: string; label: string }> = {
  d: { to: "/admin/dashboard", label: "Dashboard" },
  i: { to: "/admin/inquiries", label: "Inquiries" },
  q: { to: "/admin/quote-requests", label: "Quote Requests" },
  s: { to: "/admin/sample-requests", label: "Sample Requests" },
  c: { to: "/admin/companies", label: "Companies" },
  k: { to: "/admin/calculator-submissions", label: "Calculator" },
  f: { to: "/admin/follow-ups", label: "Follow-Ups" },
  u: { to: "/admin/users", label: "Users" },
  l: { to: "/admin/activity-log", label: "Activity Log" },
};

function isTyping(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const awaitingGoto = useRef(false);
  const gotoTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;

      if (e.key === "Escape") { setHelpOpen(false); awaitingGoto.current = false; return; }

      // `?` toggles the help sheet
      if (e.key === "?") { e.preventDefault(); setHelpOpen((o) => !o); return; }

      // Two-key `g <x>` navigation
      if (awaitingGoto.current) {
        const dest = GOTO[e.key.toLowerCase()];
        awaitingGoto.current = false;
        window.clearTimeout(gotoTimer.current);
        if (dest) { e.preventDefault(); navigate(dest.to); }
        return;
      }
      if (e.key.toLowerCase() === "g") {
        awaitingGoto.current = true;
        window.clearTimeout(gotoTimer.current);
        gotoTimer.current = window.setTimeout(() => { awaitingGoto.current = false; }, 1200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.clearTimeout(gotoTimer.current); };
  }, [navigate]);

  if (!helpOpen) return null;

  return (
    <div className="adm-kbd-overlay" onClick={() => setHelpOpen(false)} role="dialog" aria-label="Keyboard shortcuts">
      <div className="adm-kbd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="adm-kbd-head">
          <strong>Keyboard shortcuts</strong>
          <button type="button" className="adm-kbd-close" onClick={() => setHelpOpen(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="adm-kbd-group-title">Go to</div>
        <ul className="adm-kbd-list">
          {Object.entries(GOTO).map(([key, { label }]) => (
            <li key={key}>
              <span className="adm-kbd-keys"><kbd>g</kbd> <kbd>{key}</kbd></span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <div className="adm-kbd-group-title">General</div>
        <ul className="adm-kbd-list">
          <li><span className="adm-kbd-keys"><kbd>?</kbd></span><span>Toggle this help</span></li>
          <li><span className="adm-kbd-keys"><kbd>Esc</kbd></span><span>Close menus &amp; dialogs</span></li>
        </ul>
      </div>
    </div>
  );
}

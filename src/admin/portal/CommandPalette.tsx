/* Command palette — Ctrl+K / Cmd+K from anywhere in the portal.
 *
 * One box to do everything fast:
 *   - type to fuzzy-filter all 35 modules and jump with Enter
 *   - type 2+ chars to also live-search leads (name/email/company)
 * Arrow keys move, Enter opens, Esc closes. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, Layers, User } from "lucide-react";
import { api } from "../lib/api.js";
import { MODULE_GROUPS, type PortalModule } from "./modules.js";

interface LeadHit {
  id: string;
  name: string;
  email: string;
  companyName?: string | null;
  status: string;
}

interface Item {
  key: string;
  kind: "module" | "lead";
  label: string;
  sub: string;
  to: string;
  icon: PortalModule["icon"] | typeof User;
}

const ALL_MODULES: PortalModule[] = MODULE_GROUPS.flatMap((g) => g.modules);

/** Subsequence fuzzy match — "cpq" hits "CPQ / Quotations", "seo g" hits "SEO Growth". */
function fuzzy(query: string, text: string): boolean {
  const q = query.toLowerCase().replace(/\s+/g, "");
  const t = text.toLowerCase();
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return i === q.length;
}

export function CommandPalette({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<LeadHit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  // Global hotkey: Ctrl+K / Cmd+K toggles; Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Also openable from the topbar search box.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("wd:open-palette", onOpen);
    return () => window.removeEventListener("wd:open-palette", onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setLeads([]);
      setActive(0);
      // Focus after the overlay paints.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced lead search.
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (!open || query.trim().length < 2) { setLeads([]); return; }
    debounceRef.current = window.setTimeout(() => {
      api.get<LeadHit[]>(`/api/inquiries?page=1&limit=5&search=${encodeURIComponent(query.trim())}`)
        .then((r) => setLeads(r.data))
        .catch(() => setLeads([]));
    }, 250);
    return () => window.clearTimeout(debounceRef.current);
  }, [query, open]);

  const items: Item[] = useMemo(() => {
    const visible = ALL_MODULES.filter((m) => !m.superAdminOnly || isSuperAdmin);
    const q = query.trim();
    const modules = (q ? visible.filter((m) => fuzzy(q, m.label) || fuzzy(q, m.key)) : visible)
      .slice(0, q ? 8 : 12)
      .map((m): Item => ({
        key: `m-${m.key}`, kind: "module", label: m.label, sub: m.blurb, to: m.path, icon: m.icon,
      }));
    const leadItems = leads.map((l): Item => ({
      key: `l-${l.id}`, kind: "lead",
      label: l.name,
      sub: `${l.companyName ? `${l.companyName} · ` : ""}${l.email} · ${l.status.replace(/_/g, " ")}`,
      to: `/admin/inquiries/${l.id}`,
      icon: User,
    }));
    return [...leadItems, ...modules];
  }, [query, leads, isSuperAdmin]);

  useEffect(() => { setActive(0); }, [items.length, query]);

  const go = useCallback((item: Item) => {
    setOpen(false);
    navigate(item.to);
  }, [navigate]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  if (!open) return null;

  return (
    <div className="wd-palette-overlay" onClick={() => setOpen(false)} role="dialog" aria-label="Command palette">
      <div className="wd-palette" onClick={(e) => e.stopPropagation()}>
        <div className="wd-palette-input">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Jump to a module or search leads…"
            aria-label="Command palette search"
          />
          <kbd>esc</kbd>
        </div>
        <div className="wd-palette-list">
          {items.length === 0 && (
            <div className="wd-palette-empty">No matches. Try a module name or a lead's name/email.</div>
          )}
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`wd-palette-item${i === active ? " active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
              >
                <span className={`wd-palette-icon${item.kind === "lead" ? " lead" : ""}`}>
                  <Icon size={15} />
                </span>
                <span className="wd-palette-text">
                  <span className="wd-palette-label">{item.label}</span>
                  <span className="wd-palette-sub">{item.sub}</span>
                </span>
                <span className="wd-palette-kind">{item.kind === "lead" ? <User size={11} /> : <Layers size={11} />}{item.kind}</span>
                {i === active && <CornerDownLeft size={13} className="wd-palette-enter" />}
              </button>
            );
          })}
        </div>
        <div className="wd-palette-foot">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>ctrl</kbd>+<kbd>k</kbd> toggle</span>
          <span><kbd>g</kbd> then key — quick jump</span>
        </div>
      </div>
    </div>
  );
}

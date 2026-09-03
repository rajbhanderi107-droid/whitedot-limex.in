/* LIMEX Route Book — the field-sales book inside the portal.
 *
 * 1,438 Gujarat plastics manufacturers in drivable legs, every mark shared
 * with the whole team and journaled by day, with the CRM one tap away. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Plus, Phone, Download, Upload, Save, Printer, RefreshCw, Sparkles, SlidersHorizontal, X, Route as RouteIcon,
  History, CloudOff, Cloud, CloudUpload, AlertTriangle, MapPin, Trash2,
} from "lucide-react";
import type { Fit, RbView } from "./types.js";
import {
  type Filters, type Row, type SortMode, emptyFilters, filtersActive, matchStop, tradeTags, FITLABEL, OUTS,
  toViewFilters, fromViewFilters, buildCSV, downloadText, today, vcardFor, phoneOf, PARKED, isRemoved, isTicked, DEFAULT_HOME,
} from "./logic.js";
import { useRb, load, setPrefs, saveView, deleteView, reseed, restoreMarks, getRb } from "./store.js";
import { UICtx, type UIApi, toast } from "./ctx.js";
import { RouteView } from "./RouteView.js";
import { StopsView } from "./StopsView.js";
import { DaysView } from "./DaysView.js";
import { PipelineView } from "./PipelineView.js";
import { CallQueue, Palette, AddCompany, HistoryPanel, Toasts, type PaletteAction } from "./Overlays.js";
import "./routebook.css";

type View = "route" | "all" | "plan" | "pipe";
const VIEWS: [View, string][] = [["route", "Route"], ["all", "Stops"], ["plan", "Days"], ["pipe", "Pipeline"]];
const HOME_KEY = "wd_rb_home";

export function RouteBookPage() {
  const st = useRb();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({ ...emptyFilters(), q: params.get("q") ?? "" }));
  const [view, setView] = useState<View>(() => (params.get("view") as View) || st.prefs.view || "route");
  const [sort, setSort] = useState<SortMode>(st.prefs.sort ?? "leg");
  const [editing, setEditing] = useState<string | null>(null);
  const [openLegs, setOpenLegs] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[] | null>(null);
  const [palette, setPalette] = useState(false);
  const [adding, setAdding] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [home, setHome] = useState(() => localStorage.getItem(HOME_KEY) || DEFAULT_HOME);
  const [homeEdit, setHomeEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const density = st.prefs.density ?? "cozy";

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (st.status === "ready" && !params.get("view") && st.prefs.view && st.prefs.view !== view) setView(st.prefs.view); }, [st.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const p = new URLSearchParams(params); p.set("view", view); if (filters.q) p.set("q", filters.q); else p.delete("q"); setParams(p, { replace: true }); }, [view, filters.q]); // eslint-disable-line react-hooks/exhaustive-deps
  const changeView = (v: View) => { setView(v); setPrefs({ view: v }); };
  const changeSort = (m: SortMode) => { setSort(m); setPrefs({ sort: m }); };

  // Rows and indexes
  const rows: Row[] = useMemo(() => st.stops.map((s) => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);
  const rowsByLeg = useMemo(() => { const mp = new Map<string, Row[]>(); for (const r of rows) (mp.get(r.s.legId) ?? mp.set(r.s.legId, []).get(r.s.legId)!).push(r); return mp; }, [rows]);
  const visible = useMemo(() => rows.filter((r) => matchStop(r.s, r.m, filters, st.index.legById[r.s.legId], st.index.legById[r.s.legId]?.familyId)), [rows, filters, st.index.legById]);
  const visibleByLeg = useMemo(() => { const mp = new Map<string, Row[]>(); for (const r of visible) (mp.get(r.s.legId) ?? mp.set(r.s.legId, []).get(r.s.legId)!).push(r); return mp; }, [visible]);
  const famCounts = useMemo(() => { const c: Record<string, number> = {}; for (const r of visible) { const f = st.index.legById[r.s.legId]?.familyId ?? "?"; c[f] = (c[f] ?? 0) + 1; } return c; }, [visible, st.index.legById]);
  const trades = useMemo(() => tradeTags(st.stops), [st.stops]);
  const fitCounts = useMemo(() => { const c: Partial<Record<Fit, number>> = {}; for (const s of st.stops) c[s.fit] = (c[s.fit] ?? 0) + 1; return c; }, [st.stops]);
  const outCounts = useMemo(() => { const c: Record<string, number> = { note: 0 }; for (const r of rows) { if (r.m?.outcome) c[r.m.outcome] = (c[r.m.outcome] ?? 0) + 1; if (r.m?.note) c.note++; } return c; }, [rows]);
  const sellable = useMemo(() => rows.filter((r) => !PARKED(r.s) && !isRemoved(r.m)), [rows]);
  const ticked = sellable.filter((r) => isTicked(r.m)).length;
  const starred = rows.filter((r) => r.m?.starred).length;

  // Deep link ?s=<id>
  const jumpTo = useCallback((stopId: string) => {
    const s = getRb().index.stopById[stopId]; if (!s) return;
    setFilters(emptyFilters()); setView("route");
    setOpenLegs((o) => new Set(o).add(s.legId));
    setEditing(null);
    window.setTimeout(() => { const el = document.getElementById(`rb-${stopId}`); el?.scrollIntoView({ block: "center", behavior: "smooth" }); el?.classList.add("is-flash"); window.setTimeout(() => el?.classList.remove("is-flash"), 1600); }, 60);
  }, []);
  useEffect(() => { const s = params.get("s"); if (s && st.status === "ready") { jumpTo(s); const p = new URLSearchParams(params); p.delete("s"); setParams(p, { replace: true }); } }, [st.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keys: "/" focuses search, Esc closes things
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "Escape") { setPalette(false); setQueue(null); setAdding(false); setEditing(null); return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === ".") { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleChip = (g: "fit" | "state" | "status" | "extra" | "trade", k: string) =>
    setFilters((f) => { const set = new Set(f[g] as Set<string>); if (set.has(k)) set.delete(k); else set.add(k); return { ...f, [g]: set }; });
  const has = (g: "fit" | "state" | "status" | "extra" | "trade", k: string) => (filters[g] as Set<string>).has(k);
  const clear = () => setFilters(emptyFilters());
  const active = filtersActive(filters);

  const exportCSV = () => { downloadText(`limex-route-book-${today()}.csv`, "﻿" + buildCSV(rows, st.index.legById), "text/csv"); toast("Whole book exported"); };
  const exportVcf = () => {
    const withPhone = sellable.filter((r) => phoneOf(r.s, r.m));
    if (!withPhone.length) { toast("No stops have a phone number yet"); return; }
    downloadText(`limex-contacts-${today()}.vcf`, withPhone.map((r) => vcardFor(r.s, r.m)).join("\r\n"), "text/vcard");
    toast(`${withPhone.length} contacts exported`);
  };
  const backup = () => {
    const data = { app: "limex-route-book", version: 2, exportedAt: new Date().toISOString(), by: st.me?.name, marks: Object.values(st.marks), legMarks: Object.values(st.legMarks), views: st.views, prefs: st.prefs };
    downloadText(`limex-route-book-backup-${today()}.json`, JSON.stringify(data), "application/json");
    toast("Backup saved");
  };
  const restore = async (file: File) => {
    try {
      const j = JSON.parse(await file.text()) as { marks?: Record<string, unknown>[] };
      if (!Array.isArray(j.marks)) throw new Error("That file is not a Route Book backup");
      const items = j.marks.filter((m): m is Record<string, unknown> & { stopId: string } => typeof m.stopId === "string").map((m) => {
        const { stopId, updatedAt, updatedById, updatedBy, ...patch } = m; void updatedAt; void updatedById; void updatedBy;
        return { stopId, ...(patch as object) };
      });
      const n = restoreMarks(items);
      toast(`${n} stops restored — saving in the background`);
    } catch (e) { toast(e instanceof Error ? e.message : "Could not read that file", undefined, "err"); }
  };
  const doSaveView = async () => {
    const name = window.prompt("Name this view", filters.q || "My view");
    if (!name) return;
    try { await saveView(name, toViewFilters(filters)); toast(`View “${name}” saved for the team`); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not save the view", undefined, "err"); }
  };
  const applyView = (v: RbView) => { setFilters(fromViewFilters(v.filters)); if (view === "pipe" || view === "plan") changeView("route"); };
  const doReseed = async () => {
    if (!window.confirm("Refresh the register data from the shipped dataset? Every tick, note and outcome is kept.")) return;
    try { const r = await reseed(); toast(`Register refreshed — ${r.stops} companies`); } catch (e) { toast(e instanceof Error ? e.message : "Reseed failed", undefined, "err"); }
  };
  const saveHome = (v: string) => { const h = v.trim() || DEFAULT_HOME; setHome(h); localStorage.setItem(HOME_KEY, h); setHomeEdit(false); };

  const ui: UIApi = useMemo(() => ({
    filters, setFilters, density, editing, setEditing, jumpTo, startQueue: (ids) => { if (!ids.length) { toast("Nothing to queue from what is showing"); return; } setQueue(ids); }, openAdd: () => setAdding(true), home,
  }), [filters, density, editing, jumpTo, home]);

  const actions: PaletteAction[] = [
    { l: "Add a company you found", k: "n", run: () => setAdding(true) },
    { l: "Call queue — from what is showing", run: () => ui.startQueue(visible.map((r) => r.s.id)) },
    { l: "Export CSV of the whole book", run: exportCSV },
    { l: "Export CSV of this view", run: () => { downloadText(`limex-view-${today()}.csv`, "﻿" + buildCSV(visible, st.index.legById), "text/csv"); } },
    { l: "Export all contacts (.vcf)", run: exportVcf },
    { l: "Back up everything (.json)", run: backup },
    { l: "Restore from a backup", run: () => fileRef.current?.click() },
    { l: "Save this view for the team", run: doSaveView },
    { l: "Toggle compact density", run: () => setPrefs({ density: density === "compact" ? "cozy" : "compact" }) },
    { l: "Go to Route", run: () => changeView("route") }, { l: "Go to Stops", run: () => changeView("all") },
    { l: "Go to Days", run: () => changeView("plan") }, { l: "Go to Pipeline", run: () => changeView("pipe") },
    { l: "Clear all filters", run: clear },
    { l: "Undo history", run: () => setHistoryOpen(true) },
    { l: "Reload from the server", run: () => load(true) },
    ...(st.me && ["SUPER_ADMIN", "ADMIN"].includes(st.me.role) ? [{ l: "Refresh register data (admin)", run: doReseed }] : []),
  ];

  const syncBadge = (() => {
    if (st.sync === "offline") return <span className="rb-sync is-off"><CloudOff size={13} /> Offline{st.pending ? ` · ${st.pending} queued` : ""}</span>;
    if (st.sync === "error") return <span className="rb-sync is-err" title={st.error ?? ""}><AlertTriangle size={13} /> Couldn’t save · retrying</span>;
    if (st.sync === "saving") return <span className="rb-sync is-saving"><CloudUpload size={13} /> Saving{st.pending ? ` ${st.pending}` : ""}…</span>;
    return <span className="rb-sync"><Cloud size={13} /> Saved{st.fromCache ? " · offline copy" : ""}</span>;
  })();

  if (st.status === "loading" || st.status === "idle") {
    return <div className="wd-page rb-page"><div className="wd-page-head"><h1><RouteIcon size={20} /> LIMEX Route Book</h1><p>Loading the book…</p></div><div className="wd-card wd-skel" style={{ height: 160 }} /></div>;
  }
  if (st.status === "error") {
    return <div className="wd-page rb-page"><div className="wd-page-head"><h1><RouteIcon size={20} /> LIMEX Route Book</h1></div><div className="wd-inline-err">{st.error} <button type="button" className="wd-ghost-btn" onClick={() => load(true)}>Try again</button></div></div>;
  }

  return (
    <UICtx.Provider value={ui}>
      <div className={`wd-page rb-page${density === "compact" ? " rb-compact" : ""}`} data-testid="rb-page">
        <div className="wd-page-head rb-head">
          <div>
            <h1><RouteIcon size={20} /> LIMEX Route Book</h1>
            <p>{sellable.length.toLocaleString()} sellable companies · {ticked} ticked · {starred} starred for the run · {st.fams.length} families, {st.legs.length} legs</p>
          </div>
          <div className="rb-head-right">
            {syncBadge}
            <button type="button" className="wd-ghost-btn" onClick={() => setHistoryOpen((o) => !o)} title="Undo history"><History size={13} /></button>
            <button type="button" className="wd-ghost-btn" onClick={() => setPalette(true)} title="Actions (.)"><Sparkles size={13} /> Actions</button>
            <button type="button" className="wd-primary-btn" onClick={() => setAdding(true)} data-testid="rb-addbtn"><Plus size={14} /> Add company</button>
          </div>
        </div>
        {st.error && st.sync === "error" && <div className="wd-inline-err">{st.error}</div>}

        <div className="rb-toolbar">
          <div className="rb-tabs" role="tablist">
            {VIEWS.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => changeView(v)} data-testid={`rb-tab-${v}`}>{l}{v === "plan" && starred ? <span className="rb-tabn">{starred}</span> : null}</button>)}
          </div>
          <div className="rb-find">
            <Search size={14} />
            <input ref={searchRef} value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search name, estate, product, note… ( / )" data-testid="rb-search" />
            {filters.q && <button type="button" onClick={() => setFilters((f) => ({ ...f, q: "" }))} aria-label="Clear search"><X size={13} /></button>}
          </div>
          <button type="button" className={`wd-ghost-btn rb-railbtn${active ? " on" : ""}`} onClick={() => setRailOpen((o) => !o)}><SlidersHorizontal size={13} /> Filters{active ? " ·" : ""}</button>
          {active && <button type="button" className="wd-ghost-btn" onClick={clear} data-testid="rb-clear">Clear filters</button>}
          <span className="rb-showing">{visible.length} of {rows.length}</span>
        </div>

        <div className="rb-layout">
          <aside className={`rb-rail${railOpen ? " is-open" : ""}`}>
            <div className="rb-rail-sec">
              <h5>Families</h5>
              <button type="button" className={`rb-fam-btn${!filters.fam ? " is-on" : ""}`} onClick={() => setFilters((f) => ({ ...f, fam: null }))}><span className="rb-fk">∗</span><span className="rb-fl">All</span><span className="rb-fc">{visible.length}</span></button>
              {st.fams.map((f) => (
                <button key={f.id} type="button" className={`rb-fam-btn${filters.fam === f.id ? " is-on" : ""}${!famCounts[f.id] ? " is-dim" : ""}`} onClick={() => setFilters((x) => ({ ...x, fam: x.fam === f.id ? null : f.id, ...(f.id === "X" ? { parked: true } : {}) }))} title={f.blurb ?? ""}>
                  <span className="rb-fk">{f.id}</span><span className="rb-fl">{f.name}</span><span className="rb-fc">{famCounts[f.id] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="rb-rail-sec">
              <h5>LIMEX fit</h5>
              <div className="rb-chips">
                {(["prime", "good", "weak", "channel"] as Fit[]).map((k) => <button key={k} type="button" className={`rb-chip rb-chip-${k}`} aria-pressed={has("fit", k)} onClick={() => toggleChip("fit", k)}>{FITLABEL[k]} <span>{fitCounts[k] ?? 0}</span></button>)}
                <button type="button" className="rb-chip" aria-pressed={filters.parked} onClick={() => setFilters((f) => ({ ...f, parked: !f.parked }))}>Parked <span>{(fitCounts.no ?? 0) + (fitCounts.clear ?? 0)}</span></button>
              </div>
            </div>
            <div className="rb-rail-sec">
              <h5>State</h5>
              <div className="rb-chips">
                {([["state", "precise", "Precise pins"], ["state", "plot", "Plot needed"], ["state", "phone", "Has a number"], ["state", "nophone", "Needs a number"],
                  ["state", "mine", "Added by us"], ["state", "due", "Follow-up due"], ["state", "stale", "Needs a nudge"], ["state", "promoted", "In the CRM"],
                  ["state", "dnc", "Not interested"], ["state", "merged", "Merged away"], ["state", "removed", "Removed"],
                  ["status", "done", "Ticked"], ["status", "none", "Not ticked"], ["status", "pin", "Starred"]] as const).map(([g, k, l]) => (
                  <button key={k} type="button" className="rb-chip" aria-pressed={has(g, k)} onClick={() => toggleChip(g, k)} data-testid={`rb-chip-${k}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="rb-rail-sec">
              <h5>Outcome</h5>
              <div className="rb-chips">
                {OUTS.map(([k, l]) => <button key={k} type="button" className="rb-chip" aria-pressed={has("extra", k)} onClick={() => toggleChip("extra", k)}>{l} <span>{outCounts[k] ?? 0}</span></button>)}
                <button type="button" className="rb-chip" aria-pressed={has("extra", "note")} onClick={() => toggleChip("extra", "note")}>Has a note <span>{outCounts.note}</span></button>
              </div>
            </div>
            <div className="rb-rail-sec">
              <h5>What they make</h5>
              <div className="rb-chips">{trades.map((t) => <button key={t.tag} type="button" className="rb-chip" aria-pressed={has("trade", t.tag)} onClick={() => toggleChip("trade", t.tag)}>{t.tag} <span>{t.n}</span></button>)}</div>
            </div>
            <div className="rb-rail-sec">
              <h5>Saved views <button type="button" className="rb-mini" onClick={doSaveView} title="Save the current filters for the whole team"><Save size={11} /></button></h5>
              {st.views.length ? st.views.map((v) => (
                <div key={v.id} className="rb-view"><button type="button" onClick={() => applyView(v)}>{v.name}<small>{v.createdBy?.name?.split(" ")[0]}</small></button><button type="button" className="rb-mini" onClick={() => deleteView(v.id).then(() => toast("View deleted")).catch(() => toast("Only the creator or an admin can delete this view", undefined, "err"))} aria-label="Delete view"><Trash2 size={11} /></button></div>
              )) : <p className="rb-rail-note">Filter the book, then save it here so the whole team can reuse it.</p>}
            </div>
            <div className="rb-rail-sec">
              <h5>Start point</h5>
              {homeEdit ? <input className="rb-home" defaultValue={home} autoFocus onBlur={(e) => saveHome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveHome((e.target as HTMLInputElement).value); }} />
                : <button type="button" className="rb-home-btn" onClick={() => setHomeEdit(true)} title="Where routes start from"><MapPin size={12} /> {home}</button>}
            </div>
            <div className="rb-rail-sec rb-rail-tools">
              <button type="button" className="wd-ghost-btn" onClick={exportCSV}><Download size={12} /> CSV</button>
              <button type="button" className="wd-ghost-btn" onClick={exportVcf}><Phone size={12} /> .vcf</button>
              <button type="button" className="wd-ghost-btn" onClick={backup}><Download size={12} /> Backup</button>
              <button type="button" className="wd-ghost-btn" onClick={() => fileRef.current?.click()}><Upload size={12} /> Restore</button>
              <button type="button" className="wd-ghost-btn" onClick={() => setPrefs({ density: density === "compact" ? "cozy" : "compact" })}>{density === "compact" ? "Cozy" : "Compact"}</button>
              <button type="button" className="wd-ghost-btn" onClick={() => load(true)} title="Reload from the server"><RefreshCw size={12} /></button>
              <button type="button" className="wd-ghost-btn" onClick={() => changeView("plan")}><Printer size={12} /> Run sheet</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void restore(f); e.target.value = ""; }} data-testid="rb-restore-input" />
            </div>
          </aside>

          <main className="rb-main">
            {view === "route" && <RouteView rowsByLeg={rowsByLeg} visibleByLeg={visibleByLeg} fams={st.fams} legsByFam={st.index.legsByFam} openLegs={openLegs} toggleLeg={(id) => setOpenLegs((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; })} shown={visible.length} />}
            {view === "all" && <StopsView rows={visible} sort={sort} setSort={changeSort} />}
            {view === "plan" && <DaysView rows={rows} />}
            {view === "pipe" && <PipelineView rows={rows} rowsByLeg={rowsByLeg} legs={st.legs} />}
          </main>
        </div>

        {queue && <CallQueue ids={queue} onClose={() => setQueue(null)} />}
        {palette && <Palette actions={actions} onClose={() => setPalette(false)} />}
        {adding && <AddCompany onClose={() => setAdding(false)} />}
        {historyOpen && <HistoryPanel onClose={() => setHistoryOpen(false)} />}
        <Toasts />
      </div>
    </UICtx.Provider>
  );
}

export default RouteBookPage;

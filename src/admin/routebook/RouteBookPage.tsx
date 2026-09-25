import { areaOf, areaOptions } from "./areas.js";
import { ResearchAdditions } from "./ResearchAdditions.js";
import { CompanyFilters } from "./CompanyFilters.js";
import { matchesProduct, type ProductFilter } from "./products.js";
import { useSourceFolder } from "./SourceFolders.js";
import { sourceFolderOf } from "./sources.js";
/* LIMEX Route Book — the field-sales book inside the portal.
 *
 * 1,438 Gujarat plastics manufacturers in drivable legs, every mark shared
 * with the whole team and journaled by day, with the CRM one tap away. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Phone, Download, Upload, Save, Printer, RefreshCw, Sparkles, Route as RouteIcon,
  History, CloudOff, Cloud, CloudUpload, AlertTriangle, MapPin, Trash2, IndianRupee, MoreHorizontal,
} from "lucide-react";
import type { RbView } from "./types.js";
import {
  type Filters, type Row, type SortMode, emptyFilters, filtersActive, matchStop,
  toViewFilters, fromViewFilters, buildCSV, downloadText, today, vcardFor, phoneOf, PARKED, isRemoved, isTicked, DEFAULT_HOME,
  num,
} from "./logic.js";
import { useRb, load, setPrefs, saveView, deleteView, reseed, restoreMarks, getRb, saveSettings, startLiveSync, importBook } from "./store.js";
import { UICtx, type UIApi, toast } from "./ctx.js";
import { OpenAsApp } from "./BookBits.js";
import { RouteView } from "./RouteView.js";
import { StopsView } from "./StopsView.js";
import { DaysView } from "./DaysView.js";
import { PipelineView } from "./PipelineView.js";
import { CallQueue, Palette, AddCompany, HistoryPanel, Toasts, type PaletteAction } from "./Overlays.js";
import "./routebook.css";

type View = "route" | "all" | "plan" | "pipe";
const VIEWS: [View, string][] = [["all", "Companies"], ["route", "Plan a route"], ["plan", "Visit history"], ["pipe", "Pipeline"]];
const HOME_KEY = "wd_rb_home";

export function RouteBookPage() {
  const st = useRb();
  const { folder, setFolder } = useSourceFolder();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({ ...emptyFilters(), parked: true, q: params.get("q") ?? "" }));
  const [view, setView] = useState<View>(() => (params.get("view") as View) || "all");
  const [product, setProduct] = useState<ProductFilter>("all");
  const [sort, setSort] = useState<SortMode>(st.prefs.sort ?? "leg");
  const [editing, setEditing] = useState<string | null>(null);
  const [openLegs, setOpenLegs] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[] | null>(null);
  const [palette, setPalette] = useState(false);
  const [adding, setAdding] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [home, setHome] = useState(() => localStorage.getItem(HOME_KEY) || DEFAULT_HOME);
  const [homeEdit, setHomeEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const density = st.prefs.density ?? "cozy";

  // Load once, then keep this tab in step with every other open device.
  useEffect(() => { void load(); return startLiveSync(); }, []);
  useEffect(() => { const p = new URLSearchParams(params); p.set("view", view); if (filters.q) p.set("q", filters.q); else p.delete("q"); setParams(p, { replace: true }); }, [view, filters.q]); // eslint-disable-line react-hooks/exhaustive-deps
  const changeView = (v: View) => { setView(v); setPrefs({ view: v }); if(v === "plan" || v === "pipe") { setProduct("all"); setFilters({ ...emptyFilters(), parked: true }); } };
  const changeSort = (m: SortMode) => { setSort(m); setPrefs({ sort: m }); };

  // Rows and indexes
  const allSourceRows: Row[] = useMemo(() => st.stops.map((s) => ({ s, m: st.marks[s.id] })), [st.stops, st.marks]);
  const rows = useMemo(() => allSourceRows.filter(r => folder === "ALL" || sourceFolderOf(r.s, r.m) === folder), [allSourceRows, folder]);
  const rowsByLeg = useMemo(() => { const mp = new Map<string, Row[]>(); for (const r of rows) (mp.get(r.s.legId) ?? mp.set(r.s.legId, []).get(r.s.legId)!).push(r); return mp; }, [rows]);
  const visible = useMemo(() => rows.filter((r) => matchesProduct(r.s, r.m, product) && matchStop(r.s, r.m, filters, st.index.legById[r.s.legId], areaOf(r))), [rows, filters, product, st.index.legById]);
  const visibleByLeg = useMemo(() => { const mp = new Map<string, Row[]>(); for (const r of visible) (mp.get(r.s.legId) ?? mp.set(r.s.legId, []).get(r.s.legId)!).push(r); return mp; }, [visible]);
  const sellable = useMemo(() => rows.filter((r) => !PARKED(r.s) && !isRemoved(r.m)), [rows]);
  const ticked = sellable.filter((r) => isTicked(r.m)).length;
  const starred = rows.filter((r) => r.m?.starred).length;

  // Deep link ?s=<id>
  const jumpTo = useCallback((stopId: string) => {
    const s = getRb().index.stopById[stopId]; if (!s) return;
    setFolder("ALL"); setProduct("all"); setFilters({...emptyFilters(), parked: true}); setView("route");
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

  const statusValue = [...filters.state][0] ?? [...filters.status][0] ?? "all";
  const setStatus = (value: string) => setFilters(f => ({ ...f, state: new Set(["done", "none", "pin"].includes(value) || value === "all" ? [] : [value]), status: new Set(["done", "none", "pin"].includes(value) ? [value] : []) }));
  const clear = () => { setFilters({ ...emptyFilters(), parked: true }); setProduct("all"); setFolder("ALL"); };
  const active = (filtersActive(filters) || !!filters.fam) || product !== "all" || folder !== "ALL";

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
  /** One file input, two jobs. A plain backup carries marks only and replays
   *  through the outbox. A file that also carries `events` is a whole book
   *  from the standalone app: that goes to the import endpoint, which keeps
   *  every journal line on the day it actually happened instead of stamping
   *  the lot with today's date. */
  const restore = async (file: File) => {
    try {
      const j = JSON.parse(await file.text()) as {
        marks?: Record<string, unknown>[];
        events?: { stopId: string; kind: string; value?: string | null; day: string; at: string }[];
      };
      if (!Array.isArray(j.marks)) throw new Error("That file is not a Route Book backup");
      const items = j.marks.filter((m): m is Record<string, unknown> & { stopId: string } => typeof m.stopId === "string").map((m) => {
        const { stopId, updatedAt, updatedById, updatedBy, ...patch } = m; void updatedAt; void updatedById; void updatedBy;
        return { stopId, ...(patch as object) };
      });

      if (Array.isArray(j.events) && j.events.length) {
        const r = await importBook({ marks: items as never, events: j.events });
        const skipped = r.skippedStops.length ? ` · ${r.skippedStops.length} not in this book` : "";
        toast(`${r.marks} companies and ${r.events} journal lines imported across ${r.days.length} day${r.days.length === 1 ? "" : "s"}${skipped}`);
        return;
      }

      const n = restoreMarks(items);
      toast(`${n} stops restored — saving in the background`);
    } catch (e) { toast(e instanceof Error ? e.message : "Could not read that file", undefined, "err"); }
  };
  const doSaveView = async () => {
    const name = window.prompt("Name this view", filters.q || "My view");
    if (!name) return;
    try { await saveView(name, {...toViewFilters(filters), product}); toast(`View “${name}” saved for the team`); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not save the view", undefined, "err"); }
  };
  const applyView = (v: RbView) => {
    const saved = fromViewFilters(v.filters);
    const allowed = ["due", "done", "none", "pin", "removed", "dnc", "merged"];
    const status = [...saved.state, ...saved.status].find(k => allowed.includes(k));
    setFilters({ ...emptyFilters(), parked: true, q: saved.q, fam: areaOptions(allSourceRows).some(a => a.id === saved.fam) ? saved.fam : null,
      state: new Set(status && !["done", "none", "pin"].includes(status) ? [status] : []),
      status: new Set(status && ["done", "none", "pin"].includes(status) ? [status] : []) });
    setProduct(v.filters.product ?? "all"); setFolder("ALL");
    if (view === "pipe" || view === "plan") setView("route");
  };
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
    { l: "Restore, or import the standalone app’s book", run: () => fileRef.current?.click() },
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
    return <div className="wd-page rb-page"><div className="wd-page-head"><h1><RouteIcon size={20} /> Companies</h1><p>Loading the book…</p></div><div className="wd-card wd-skel" style={{ height: 160 }} /></div>;
  }
  if (st.status === "error") {
    return <div className="wd-page rb-page"><div className="wd-page-head"><h1><RouteIcon size={20} /> Companies</h1></div><div className="wd-inline-err">{st.error} <button type="button" className="wd-ghost-btn" onClick={() => load(true)}>Try again</button></div></div>;
  }

  return (
    <UICtx.Provider value={ui}>
      <div className={`wd-page rb-page${density === "compact" ? " rb-compact" : ""}`} data-testid="rb-page">
        <div className="wd-page-head rb-head">
          <div>
            <h1><RouteIcon size={20} /> Companies</h1>
            <p>Route Book · {rows.filter(r => !r.m?.removed && !r.m?.dupOf).length} companies{ticked ? `, ${ticked} visited` : ""}</p>
          </div>
          <div className="rb-head-right">
            {syncBadge}
            <button type="button" className="wd-primary-btn" onClick={() => setAdding(true)} data-testid="rb-addbtn"><Plus size={14} /> Add company</button>
            <details className="rb-more-menu">
              <summary className="wd-ghost-btn" aria-label="More actions for the book"><MoreHorizontal size={15} /></summary>
              <div className="rb-more-panel">
                <button type="button" className="wd-ghost-btn" onClick={() => setPalette(true)} title="Actions (.)"><Sparkles size={13} /> All actions</button>
                <button type="button" className="wd-ghost-btn" onClick={() => setHistoryOpen((o) => !o)}><History size={13} /> Undo history</button>
                <OpenAsApp dir="route" label="Route Book" />
              </div>
            </details>
          </div>
        </div>
        {st.error && st.sync === "error" && <div className="wd-inline-err">{st.error}</div>}

        <div className="rb-toolbar">
          <div className="rb-tabs" role="tablist">
            {VIEWS.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => changeView(v)} data-testid={`rb-tab-${v}`}>{l}{v === "plan" && starred ? <span className="rb-tabn">{starred}</span> : null}</button>)}
          </div>
          <button type="button" className="wd-ghost-btn" aria-expanded={toolsOpen} onClick={() => setToolsOpen(o => !o)}>Tools & settings</button>
        </div>
        <CompanyFilters rows={rows} product={product} onProduct={setProduct} q={filters.q}
          onSearch={q => setFilters(f => ({...f,q}))} searchRef={searchRef} searchTestId="rb-search"
          folder={folder} onFolder={setFolder} onReset={clear} active={active} shown={visible.length}
          areas={areaOptions(allSourceRows)} area={filters.fam ?? ""} onArea={fam => setFilters(f => ({...f,fam:fam || null}))}
          status={statusValue} onStatus={setStatus}
          statuses={[["all","Any visit status"],["due","Follow-up due"],["none","Not visited"],["done","Visited"],["pin","Starred"],["dnc","Not interested"],["removed","Removed records"],["merged","Merged records"]]} />

        <div className="rb-simple-layout">
          {toolsOpen && <aside className="rb-tools-panel" aria-label="Tools and settings">
            <ResearchAdditions />
            <div className="rb-rail-sec">
              <h5>Saved views <button type="button" className="rb-mini" onClick={doSaveView} title="Save the current filters for the whole team"><Save size={11} /></button></h5>
              {st.views.length ? st.views.map((v) => (
                <div key={v.id} className="rb-view"><button type="button" onClick={() => applyView(v)}>{v.name}<small>{v.createdBy?.name?.split(" ")[0]}</small></button><button type="button" className="rb-mini" onClick={() => deleteView(v.id).then(() => toast("View deleted")).catch(() => toast("Only the creator or an admin can delete this view", undefined, "err"))} aria-label="Delete view"><Trash2 size={11} /></button></div>
              )) : <p className="rb-rail-note">Filter the book, then save it here so the whole team can reuse it.</p>}
            </div>
            <div className="rb-rail-sec">
              <h5>Commercial</h5>
              <RateBox />
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
            </div>
          </aside>}

          <main className="rb-main">
            {view === "route" && <RouteView rowsByLeg={rowsByLeg} visibleByLeg={visibleByLeg} fams={st.fams} legsByFam={st.index.legsByFam} openLegs={openLegs} toggleLeg={(id) => setOpenLegs((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; })} shown={visible.length} />}
            {view === "all" && !visible.length && <div className="rb-bempty"><b>No matching companies</b><span>Try another product or area, or reset the filters.</span><button type="button" className="wd-ghost-btn" onClick={clear}>Reset filters</button></div>}
            {view === "all" && <StopsView rows={visible} sort={sort} setSort={changeSort} />}
            {view === "plan" && <DaysView rows={visible} />}
            {view === "pipe" && <PipelineView rows={visible} rowsByLeg={visibleByLeg} legs={st.legs} />}
          </main>
        </div>

              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void restore(f); e.target.value = ""; }} data-testid="rb-restore-input" />
        {queue && <CallQueue ids={queue} onClose={() => setQueue(null)} />}
        {palette && <Palette actions={actions} onClose={() => setPalette(false)} />}
        {adding && <AddCompany onClose={() => setAdding(false)} />}
        {historyOpen && <HistoryPanel onClose={() => setHistoryOpen(false)} />}
        <Toasts />
      </div>
    </UICtx.Provider>
  );
}

/** Your rate and target share. Every rupee figure in the book derives from
 *  these two numbers, so they are entered here rather than assumed anywhere. */
function RateBox() {
  const st = useRb();
  const { folder, setFolder } = useSourceFolder();
  const admin = !!st.me && ["SUPER_ADMIN", "ADMIN"].includes(st.me.role);
  const [rate, setRate] = useState(num(st.settings?.limexRate)?.toString() ?? "");
  const [pct, setPct] = useState((st.settings?.substitutionPct ?? 30).toString());
  const [busy, setBusy] = useState(false);
  const dirty = rate !== (num(st.settings?.limexRate)?.toString() ?? "") || pct !== (st.settings?.substitutionPct ?? 30).toString();

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({ limexRate: rate === "" ? null : Number(rate), substitutionPct: Number(pct) });
      toast("Sizing updated across the book");
    } catch (e) { toast(e instanceof Error ? e.message : "Could not save", undefined, "err"); }
    finally { setBusy(false); }
  };

  if (!admin) {
    return (
      <p className="rb-rail-note">
        {st.settings?.limexRate == null
          ? "No LIMEX rate set yet, so opportunities show in tonnes. An admin can set it."
          : `Sizing at ₹${num(st.settings.limexRate)}/kg, ${st.settings.substitutionPct}% substitution.`}
      </p>
    );
  }
  return (
    <div className="rb-ratebox" data-testid="rb-ratebox">
      <label>LIMEX rate <small>₹ / kg</small>
        <input type="number" min="0" step="0.5" inputMode="decimal" value={rate}
          onChange={(e) => setRate(e.target.value)} placeholder="not set" data-testid="rb-rate" />
      </label>
      <label>Substitution <small>% of their volume</small>
        <input type="number" min="0" max="100" step="5" inputMode="numeric" value={pct}
          onChange={(e) => setPct(e.target.value)} data-testid="rb-pct" />
      </label>
      {dirty && <button type="button" className="wd-primary-btn" onClick={save} disabled={busy} data-testid="rb-rate-save">{busy ? "Saving…" : "Apply"}</button>}
      <p className="rb-rail-note"><IndianRupee size={10} /> Every rupee figure in the book comes from these.</p>
    </div>
  );
}

export default RouteBookPage;

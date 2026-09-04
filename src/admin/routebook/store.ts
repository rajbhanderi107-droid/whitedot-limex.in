/* LIMEX Route Book — client store.
 *
 * One external store (useSyncExternalStore) holding the whole book. Marks
 * are applied optimistically and pushed through an outbox that batches
 * changes into bulk calls, survives reloads, and replays when the phone
 * gets signal again — GIDC estates are not famous for coverage. The last
 * good snapshot is cached in localStorage so the book opens instantly. */

import { useSyncExternalStore } from "react";
import { rbApi } from "./api.js";
import { ApiError } from "../lib/api.js";
import type {
  RbBootstrap, RbFamily, RbLeg, RbStop, RbMark, RbLegMark, RbView, RbPrefs, MarkPatch, NewStop, ViewFilters,
} from "./types.js";
import { today } from "./logic.js";

const CACHE_KEY = "wd_rb_cache_v2";
const OUTBOX_KEY = "wd_rb_outbox_v2";

export interface Index {
  legById: Record<string, RbLeg>;
  famById: Record<string, RbFamily>;
  stopById: Record<string, RbStop>;
  stopsByLeg: Map<string, RbStop[]>;
  legsByFam: Map<string, RbLeg[]>;
}

export type SyncState = "saved" | "saving" | "offline" | "error";

export interface RbState {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  fromCache: boolean;
  fams: RbFamily[];
  legs: RbLeg[];
  stops: RbStop[];
  marks: Record<string, RbMark>;
  legMarks: Record<string, RbLegMark>;
  views: RbView[];
  prefs: RbPrefs;
  me: { id: string; name: string; role: string } | null;
  userLeg: string;
  index: Index;
  sync: SyncState;
  pending: number;
  lastSavedAt: number | null;
  version: number;
}

interface MarkOp { stopId: string; patch: MarkPatch; day: string }

const emptyIndex = (): Index => ({ legById: {}, famById: {}, stopById: {}, stopsByLeg: new Map(), legsByFam: new Map() });

let state: RbState = {
  status: "idle", error: null, fromCache: false,
  fams: [], legs: [], stops: [], marks: {}, legMarks: {}, views: [], prefs: {},
  me: null, userLeg: "M1", index: emptyIndex(),
  sync: "saved", pending: 0, lastSavedAt: null, version: 0,
};

const listeners = new Set<() => void>();
function emit() { for (const l of listeners) l(); }
function set(partial: Partial<RbState>) {
  state = { ...state, ...partial, version: state.version + 1 };
  emit();
}
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
const getSnapshot = () => state;

export function useRb(): RbState { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot); }
export function getRb(): RbState { return state; }

/* ─── indexing ─── */

function buildIndex(fams: RbFamily[], legs: RbLeg[], stops: RbStop[]): Index {
  const ix = emptyIndex();
  for (const f of fams) ix.famById[f.id] = f;
  for (const l of legs) {
    ix.legById[l.id] = l;
    (ix.legsByFam.get(l.familyId) ?? ix.legsByFam.set(l.familyId, []).get(l.familyId)!).push(l);
  }
  for (const s of stops) {
    ix.stopById[s.id] = s;
    (ix.stopsByLeg.get(s.legId) ?? ix.stopsByLeg.set(s.legId, []).get(s.legId)!).push(s);
  }
  return ix;
}

function toMap<T extends { stopId?: string; legId?: string }>(rows: T[], key: "stopId" | "legId"): Record<string, T> {
  const out: Record<string, T> = {};
  for (const r of rows) out[r[key] as string] = r;
  return out;
}

/* ─── cache ─── */

interface CacheShape {
  at: number; fams: RbFamily[]; legs: RbLeg[]; stops: RbStop[]; marks: Record<string, RbMark>;
  legMarks: Record<string, RbLegMark>; views: RbView[]; prefs: RbPrefs;
  me: RbState["me"]; userLeg: string;
}
function readCache(): CacheShape | null {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? (JSON.parse(raw) as CacheShape) : null; }
  catch { return null; }
}
let cacheTimer: number | undefined;
function writeCacheSoon() {
  window.clearTimeout(cacheTimer);
  cacheTimer = window.setTimeout(() => {
    try {
      const c: CacheShape = {
        at: Date.now(), fams: state.fams, legs: state.legs, stops: state.stops, marks: state.marks,
        legMarks: state.legMarks, views: state.views, prefs: state.prefs, me: state.me, userLeg: state.userLeg,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch { /* quota or private mode — the server copy is authoritative anyway */ }
  }, 1500);
}

/* ─── outbox ─── */

let outbox: MarkOp[] = (() => {
  try { const raw = localStorage.getItem(OUTBOX_KEY); return raw ? (JSON.parse(raw) as MarkOp[]) : []; }
  catch { return []; }
})();
let inflight: MarkOp[] = [];
let flushTimer: number | undefined;
let backoff = 0;

function saveOutbox() {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)); } catch { /* ignore */ }
}
function enqueue(op: MarkOp) {
  const existing = outbox.find((o) => o.stopId === op.stopId && o.day === op.day && !inflight.includes(o));
  if (existing) Object.assign(existing.patch, op.patch);
  else outbox.push(op);
  saveOutbox();
  set({ pending: outbox.length, sync: navigator.onLine ? "saving" : "offline" });
  scheduleFlush();
}
function scheduleFlush(ms = 600) {
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => { void flush(); }, ms);
}

function applyServerMarks(marks: RbMark[]) {
  const next = { ...state.marks };
  for (const m of marks) {
    // A newer local edit is still queued — keep the optimistic copy.
    if (outbox.some((o) => o.stopId === m.stopId)) continue;
    next[m.stopId] = m;
  }
  set({ marks: next });
}

export async function flush(): Promise<void> {
  if (inflight.length || !outbox.length) return;
  if (!navigator.onLine) { set({ sync: "offline", pending: outbox.length }); return; }
  const day = outbox[0].day;
  const batch: MarkOp[] = [];
  for (const o of outbox) { if (o.day !== day || batch.length >= 50) break; batch.push(o); }
  inflight = batch;
  set({ sync: "saving" });
  try {
    const res = await rbApi.bulkMarks(batch.map((o) => ({ stopId: o.stopId, ...o.patch })), day);
    outbox = outbox.filter((o) => !batch.includes(o));
    inflight = [];
    saveOutbox();
    applyServerMarks(res.data);
    backoff = 0;
    set({ sync: outbox.length ? "saving" : "saved", pending: outbox.length, lastSavedAt: Date.now(), error: null });
    writeCacheSoon();
    if (outbox.length) scheduleFlush(80);
  } catch (err) {
    inflight = [];
    const status = err instanceof ApiError ? err.status : 0;
    if (status && status < 500 && status !== 429) {
      // Something in the batch was rejected — send one by one and drop only the bad ones.
      await flushIndividually(batch, err instanceof Error ? err.message : "Rejected");
    } else {
      backoff = Math.min(60_000, backoff ? backoff * 2 : 5_000);
      set({ sync: navigator.onLine && status !== 0 ? "error" : "offline", pending: outbox.length,
        error: err instanceof Error ? err.message : "Could not save" });
      scheduleFlush(backoff);
    }
  }
}

async function flushIndividually(batch: MarkOp[], reason: string) {
  const served: RbMark[] = [];
  let dropped = 0;
  for (const op of batch) {
    try {
      const r = await rbApi.patchMark(op.stopId, { ...op.patch, day: op.day });
      served.push(r.data);
      outbox = outbox.filter((o) => o !== op);
    } catch (e) {
      const st = e instanceof ApiError ? e.status : 0;
      if (st && st < 500 && st !== 429) { outbox = outbox.filter((o) => o !== op); dropped++; }
      else { saveOutbox(); set({ sync: "error", pending: outbox.length, error: reason }); scheduleFlush(5_000); return; }
    }
  }
  saveOutbox();
  applyServerMarks(served);
  set({ sync: outbox.length ? "saving" : "saved", pending: outbox.length, lastSavedAt: Date.now(),
    error: dropped ? `${dropped} change${dropped === 1 ? "" : "s"} could not be saved (${reason})` : null });
  writeCacheSoon();
  if (outbox.length) scheduleFlush(80);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { backoff = 0; scheduleFlush(100); });
  window.addEventListener("offline", () => set({ sync: "offline", pending: outbox.length }));
}

/* ─── loading ─── */

function adopt(b: Omit<RbBootstrap, "serverDay"> & { serverDay?: string }, fromCache: boolean) {
  const marks = toMap(b.marks, "stopId");
  // Re-apply anything still queued so a reload never "loses" an unsent tick.
  for (const o of outbox) {
    const prev = marks[o.stopId] ?? blankMark(o.stopId);
    marks[o.stopId] = { ...prev, ...o.patch };
  }
  set({
    status: "ready", error: null, fromCache,
    fams: b.fams, legs: b.legs, stops: b.stops, marks,
    legMarks: toMap(b.legMarks, "legId"), views: b.views, prefs: b.prefs ?? {},
    me: b.me, userLeg: b.userLeg, index: buildIndex(b.fams, b.legs, b.stops),
    pending: outbox.length, sync: outbox.length ? (navigator.onLine ? "saving" : "offline") : "saved",
  });
}

let loading: Promise<void> | null = null;
export function load(force = false): Promise<void> {
  if (loading && !force) return loading;
  loading = (async () => {
    if (state.status === "idle") {
      const c = readCache();
      if (c) {
        adopt({ fams: c.fams, legs: c.legs, stops: c.stops, marks: Object.values(c.marks),
          legMarks: Object.values(c.legMarks), views: c.views, prefs: c.prefs, me: c.me ?? { id: "", name: "", role: "" },
          userLeg: c.userLeg }, true);
      } else set({ status: "loading" });
    }
    try {
      const res = await rbApi.bootstrap();
      adopt(res.data, false);
      writeCacheSoon();
      if (outbox.length) scheduleFlush(200);
    } catch (err) {
      if (state.status !== "ready") {
        set({ status: "error", error: err instanceof Error ? err.message : "Could not load the route book" });
      } else {
        set({ sync: navigator.onLine ? "error" : "offline", error: err instanceof Error ? err.message : "Offline — showing the last copy" });
      }
    } finally { loading = null; }
  })();
  return loading;
}

/* ─── marks ─── */

export function blankMark(stopId: string): RbMark {
  return {
    stopId, ticked: false, tickedOn: null, starred: false, note: null, outcome: null, dueOn: null,
    contactName: null, contactPhone: null, addrOverride: null, addrPrecise: null, dnc: false, removed: false,
    dupOf: null, snoozedOn: null, companyId: null, followUpId: null,
    updatedAt: new Date().toISOString(), updatedById: null, updatedBy: null,
  };
}

/** Optimistically apply a change and queue it. Returns the previous mark so
 *  the caller can offer Undo. */
export function patchMark(stopId: string, patch: MarkPatch, day = today()): RbMark {
  const prev = state.marks[stopId] ?? blankMark(stopId);
  const next: RbMark = {
    ...prev, ...patch,
    updatedAt: new Date().toISOString(),
    updatedById: state.me?.id ?? null,
    updatedBy: state.me ? { id: state.me.id, name: state.me.name } : null,
  };
  const p: MarkPatch = { ...patch };
  if (patch.ticked === true && !patch.tickedOn && !prev.tickedOn) { next.tickedOn = day; p.tickedOn = day; }
  if (patch.ticked === false) { next.tickedOn = null; p.tickedOn = null; }
  set({ marks: { ...state.marks, [stopId]: next } });
  enqueue({ stopId, patch: p, day });
  return prev;
}

/** Undo: put back exactly the fields a patch touched. */
export function revertMark(stopId: string, prev: RbMark, patch: MarkPatch, day = today()): void {
  const inverse: MarkPatch = {};
  for (const k of Object.keys(patch) as (keyof MarkPatch)[]) {
    (inverse as Record<string, unknown>)[k] = prev[k] ?? (typeof patch[k] === "boolean" ? false : null);
  }
  if ("ticked" in patch) inverse.tickedOn = prev.tickedOn;
  patchMark(stopId, inverse, day);
}

export function patchMany(items: (MarkPatch & { stopId: string })[], day = today()): RbMark[] {
  return items.map(({ stopId, ...patch }) => patchMark(stopId, patch, day));
}

export async function patchLegMark(legId: string, patch: Partial<Pick<RbLegMark, "ticked" | "starred" | "note">>): Promise<void> {
  const prev = state.legMarks[legId];
  const base: RbLegMark = prev ?? { legId, ticked: false, starred: false, note: null, updatedAt: "", updatedById: null };
  const next: RbLegMark = { ...base, ...patch, updatedAt: new Date().toISOString(), updatedById: state.me?.id ?? null };
  set({ legMarks: { ...state.legMarks, [legId]: next } });
  try {
    const r = await rbApi.patchLegMark(legId, { ...patch, day: today() });
    set({ legMarks: { ...state.legMarks, [legId]: r.data } });
    writeCacheSoon();
  } catch (err) {
    const lm = { ...state.legMarks };
    if (prev) lm[legId] = prev; else delete lm[legId];
    set({ legMarks: lm, error: err instanceof Error ? err.message : "Could not save" });
    throw err;
  }
}

/* ─── stops added on the road ─── */

function withStops(stops: RbStop[]) {
  set({ stops, index: buildIndex(state.fams, state.legs, stops) });
  writeCacheSoon();
}

export async function addStop(fields: NewStop): Promise<RbStop> {
  const r = await rbApi.createStop({ ...fields, day: today() });
  withStops([...state.stops, r.data]);
  return r.data;
}
export async function addStops(items: NewStop[]): Promise<RbStop[]> {
  const out: RbStop[] = [];
  for (let i = 0; i < items.length; i += 50) {
    const r = await rbApi.bulkStops(items.slice(i, i + 50), today());
    out.push(...r.data);
  }
  withStops([...state.stops, ...out]);
  return out;
}
export async function updateStop(id: string, fields: Partial<Omit<NewStop, "legId">>): Promise<RbStop> {
  const r = await rbApi.updateStop(id, fields);
  withStops(state.stops.map((s) => (s.id === id ? r.data : s)));
  return r.data;
}
export async function deleteStop(id: string): Promise<void> {
  const before = state.stops;
  withStops(before.filter((s) => s.id !== id));
  try { await rbApi.deleteStop(id); }
  catch (err) { withStops(before); throw err; }
}
export async function restoreStop(id: string): Promise<RbStop> {
  const r = await rbApi.restoreStop(id);
  withStops([...state.stops, r.data]);
  return r.data;
}

/* ─── views & prefs ─── */

export async function saveView(name: string, filters: ViewFilters): Promise<RbView> {
  const r = await rbApi.createView(name, filters);
  set({ views: [...state.views, r.data] });
  writeCacheSoon();
  return r.data;
}
export async function deleteView(id: string): Promise<void> {
  const before = state.views;
  set({ views: before.filter((v) => v.id !== id) });
  try { await rbApi.deleteView(id); writeCacheSoon(); }
  catch (err) { set({ views: before }); throw err; }
}

let prefTimer: number | undefined;
export function setPrefs(patch: RbPrefs): void {
  const prefs = { ...state.prefs, ...patch };
  set({ prefs });
  writeCacheSoon();
  window.clearTimeout(prefTimer);
  prefTimer = window.setTimeout(() => { rbApi.putPrefs(prefs).catch(() => { /* prefs are a convenience */ }); }, 900);
}

export async function reseed(): Promise<{ stops: number }> {
  const r = await rbApi.reseed();
  await load(true);
  return r.data;
}

/** Full-book restore from a backup file (marks only, chunked). */
export function restoreMarks(marks: (MarkPatch & { stopId: string })[]): number {
  let n = 0;
  for (const m of marks) {
    if (!state.index.stopById[m.stopId]) continue;
    const { stopId, ...patch } = m;
    patchMark(stopId, patch);
    n++;
  }
  return n;
}

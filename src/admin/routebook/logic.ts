/* LIMEX Route Book — pure helpers. No React, no network: everything here
 * takes a stop plus its (optional) mark and answers a question about it, so
 * the same rules drive the cards, the filters, the exports and the tests. */

import type {
  Fit, Outcome, RbStop, RbMark, RbLeg, RbFamily, ViewFilters, MarkPatch,
  RbSample, RbSettings, Polymer, Process, SampleResult,
} from "./types.js";

export const PARKED = (s: RbStop) => s.fit === "no" || s.fit === "clear";
export const FITLABEL: Record<Fit, string> = {
  prime: "Prime target", good: "Likely fit", weak: "Long shot",
  channel: "Channel", clear: "Needs clarity", no: "Not a buyer",
};
export const FITRANK: Record<Fit, number> = { prime: 0, good: 1, channel: 2, weak: 3, clear: 4, no: 5 };
export const OUTS: [Outcome, string][] = [
  ["int", "Interested"], ["smp", "Sample sent"], ["later", "Not now"], ["noans", "No answer"], ["dead", "Closed"],
];
export const OUTMAP: Record<string, string> = Object.fromEntries(OUTS);
export const DEFAULT_HOME = "Riviera Woods, Shela, Ahmedabad";
export const MAX_STOPS = 10;            // Google Maps: destination + 9 waypoints
export const STALE_DAYS = 5;
export const STATE_TAGS = new Set(["Plot needed", "Area only", "Address needed", "Thin data"]);

/* ─── dates (the salesperson's local calendar, not UTC) ─── */

export function today(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
export function daysSince(iso: string | null | undefined, ref = today()): number {
  if (!iso) return 0;
  const a = Date.parse(iso + "T00:00:00"), b = Date.parse(ref + "T00:00:00");
  return Math.round((b - a) / 86_400_000);
}
export function relDays(iso: string | null | undefined, ref = today()): string {
  const n = daysSince(iso, ref);
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  return `${n} days ago`;
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" }); }
  catch { return iso; }
}
export function dayLabel(d: string, ref = today()): string {
  if (d === ref) return "Today";
  const y = new Date(Date.parse(ref + "T00:00:00") - 86_400_000);
  const yIso = new Date(y.getTime() - y.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  if (d === yIso) return "Yesterday";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}
export function lastDays(n: number, ref = today()): string[] {
  const out: string[] = [];
  const base = new Date(ref + "T00:00:00");
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86_400_000);
    out.push(new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10));
  }
  return out;
}
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/* ─── reading a stop through its mark ─── */

export const isTicked = (m?: RbMark) => !!m?.ticked;
export const isStar = (m?: RbMark) => !!m?.starred;
export const noteOf = (m?: RbMark) => m?.note ?? "";
export const outOf = (m?: RbMark): Outcome | "" => m?.outcome ?? "";
export const dueOf = (m?: RbMark) => m?.dueOn ?? "";
export const conOf = (m?: RbMark) => ({ n: m?.contactName ?? "", p: m?.contactPhone ?? "" });
export const addrOf = (s: RbStop, m?: RbMark) => m?.addrOverride || s.addr || "";
export const preciseOf = (s: RbStop, m?: RbMark) => (m?.addrOverride ? !!m.addrPrecise : s.precise);
export const phoneOf = (s: RbStop, m?: RbMark) => (conOf(m).p || s.tel || "").trim();
export const isDNC = (m?: RbMark) => !!m?.dnc;
export const isRemoved = (m?: RbMark) => !!m?.removed;
export const isMerged = (m?: RbMark) => !!m?.dupOf;
export const isDue = (m: RbMark | undefined, ref = today()) => !!m?.dueOn && m.dueOn <= ref;
export function needsFollowUp(m: RbMark | undefined, ref = today()): boolean {
  if (!m || !m.ticked || m.dueOn || m.outcome) return false;
  return daysSince(m.tickedOn, ref) >= STALE_DAYS && (m.snoozedOn ?? "") < (m.tickedOn ?? "");
}
export const pinOf = (addr: string) => /\b(\d{6})\b/.exec(addr)?.[1] ?? "";

export const mapsSearch = (q: string) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
export function mapOf(s: RbStop, m?: RbMark): string {
  if (m?.addrOverride) return mapsSearch(`${s.name}, ${m.addrOverride}`);
  return s.map || mapsSearch([s.name, s.addr].filter(Boolean).join(", "));
}
export function placeOf(s: RbStop, m?: RbMark): string {
  if (m?.addrOverride) return `${s.name}, ${m.addrOverride}`;
  try {
    if (s.map) { const p = new URL(s.map).searchParams.get("query"); if (p) return p; }
  } catch { /* fall through */ }
  return [s.name, s.addr].filter(Boolean).join(", ");
}
export function waHref(phone: string, text?: string): string {
  const d = phone.replace(/\D/g, "");
  const num = d.length === 10 ? "91" + d : d;
  return `https://wa.me/${num}${text ? "?text=" + encodeURIComponent(text) : ""}`;
}
export const telHref = (phone: string) => "tel:" + phone.replace(/[^\d+]/g, "");

export interface Row { s: RbStop; m?: RbMark }

export function routeURL(list: Row[], origin: string = DEFAULT_HOME): string {
  const pts = list.slice(0, MAX_STOPS).map((r) => placeOf(r.s, r.m));
  const dest = pts[pts.length - 1] ?? "";
  const way = pts.slice(0, -1);
  return "https://www.google.com/maps/dir/?api=1&travelmode=driving"
    + "&origin=" + encodeURIComponent(origin)
    + "&destination=" + encodeURIComponent(dest)
    + (way.length ? "&waypoints=" + way.map(encodeURIComponent).join("%7C") : "");
}
/** One navigation link per 9 stops, each leg starting where the last ended. */
export function mapsLinks(list: Row[], home: string = DEFAULT_HOME): string[] {
  const out: string[] = [];
  for (let i = 0; i < list.length; i += 9) {
    const origin = i === 0 ? home : placeOf(list[i - 1].s, list[i - 1].m);
    out.push(routeURL(list.slice(i, i + 9), origin));
  }
  return out;
}

/* ─── search & filters ─── */

const HAY = new WeakMap<RbStop, string>();
export function hayOf(s: RbStop, leg?: RbLeg): string {
  let h = HAY.get(s);
  if (!h) {
    h = [s.legId, s.name, s.addr, s.makes, s.src, leg?.name, leg?.belt, (s.tags ?? []).map((t) => t.t).join(" ")]
      .filter(Boolean).join(" ").toLowerCase();
    HAY.set(s, h);
  }
  return h;
}

export interface Filters {
  q: string;
  fam: string | null;
  fit: Set<Fit>;
  state: Set<string>;
  status: Set<string>;
  extra: Set<string>;
  trade: Set<string>;
  parked: boolean;
}
export const emptyFilters = (): Filters => ({
  q: "", fam: null, fit: new Set(), state: new Set(), status: new Set(), extra: new Set(), trade: new Set(), parked: false,
});
export const filtersActive = (f: Filters) =>
  !!(f.q || f.fit.size || f.state.size || f.status.size || f.extra.size || f.trade.size);
export function toViewFilters(f: Filters): ViewFilters {
  return {
    q: f.q || undefined, fam: f.fam, fit: [...f.fit], state: [...f.state], status: [...f.status],
    extra: [...f.extra], trade: [...f.trade], parked: f.parked || undefined,
  };
}
export function fromViewFilters(v: ViewFilters): Filters {
  return {
    q: v.q ?? "", fam: v.fam ?? null, fit: new Set(v.fit ?? []), state: new Set(v.state ?? []),
    status: new Set(v.status ?? []), extra: new Set(v.extra ?? []), trade: new Set(v.trade ?? []), parked: !!v.parked,
  };
}

export function matchStop(s: RbStop, m: RbMark | undefined, f: Filters, leg?: RbLeg, famId?: string): boolean {
  if (!f.parked && PARKED(s)) return false;
  if (isDNC(m) && !f.state.has("dnc")) return false;
  if (isMerged(m) && !f.state.has("merged")) return false;
  if (isRemoved(m) && !f.state.has("removed")) return false;
  if (f.fam && famId && famId !== f.fam) return false;
  if (f.fit.size && !f.fit.has(s.fit)) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!hayOf(s, leg).includes(q)) {
      const c = conOf(m);
      const extra = `${noteOf(m)} ${c.n} ${c.p} ${addrOf(s, m)}`.toLowerCase();
      if (!extra.includes(q)) return false;
    }
  }
  if (f.state.size) {
    const pz = preciseOf(s, m), ph = !!phoneOf(s, m);
    let ok = false;
    for (const k of f.state) {
      if (k === "precise" && pz) ok = true;
      if (k === "plot" && !pz) ok = true;
      if (k === "phone" && ph) ok = true;
      if (k === "nophone" && !ph) ok = true;
      if (k === "mine" && s.userAdded) ok = true;
      if (k === "dnc" && isDNC(m)) ok = true;
      if (k === "merged" && isMerged(m)) ok = true;
      if (k === "removed" && isRemoved(m)) ok = true;
      if (k === "due" && isDue(m)) ok = true;
      if (k === "stale" && needsFollowUp(m)) ok = true;
      if (k === "promoted" && m?.companyId) ok = true;
      if (k === "profiled" && hasProfile(m)) ok = true;
      if (k === "unprofiled" && !hasProfile(m)) ok = true;
      if (k === "sampled" && samplesOf(m).length) ok = true;
      if (k === "stalled" && samplesOf(m).some((x) => sampleStalled(x))) ok = true;
    }
    if (!ok) return false;
  }
  if (f.status.size) {
    const st = isTicked(m) ? "done" : "none";
    let ok = false;
    for (const k of f.status) if (k === "pin" ? isStar(m) : st === k) ok = true;
    if (!ok) return false;
  }
  if (f.extra.size) {
    let ok = false;
    for (const k of f.extra) {
      if (k === "note") { if (noteOf(m)) ok = true; }
      else if (outOf(m) === k) ok = true;
    }
    if (!ok) return false;
  }
  if (f.trade.size && !(s.tags ?? []).some((t) => f.trade.has(t.t))) return false;
  return true;
}

/** The dozen most common product tags, for the trade filter chips. */
export function tradeTags(stops: RbStop[]): { tag: string; n: number }[] {
  const tally = new Map<string, number>();
  for (const s of stops) for (const t of s.tags ?? []) {
    if (!STATE_TAGS.has(t.t)) tally.set(t.t, (tally.get(t.t) ?? 0) + 1);
  }
  return [...tally.entries()].filter(([, n]) => n >= 8).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([tag, n]) => ({ tag, n }));
}

export type SortMode = "leg" | "az" | "fit" | "open";
export function sortRows(rows: Row[], mode: SortMode): Row[] {
  if (mode === "leg") return rows;
  const a = rows.slice();
  if (mode === "az") a.sort((x, y) => x.s.name.localeCompare(y.s.name));
  if (mode === "fit") a.sort((x, y) => (FITRANK[x.s.fit] ?? 9) - (FITRANK[y.s.fit] ?? 9));
  if (mode === "open") a.sort((x, y) => (isTicked(x.m) ? 1 : 0) - (isTicked(y.m) ? 1 : 0));
  return a;
}

/* ─── duplicates & merging ─── */

export function dupKey(n: string): string {
  return n.toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|llp|co|company|inc|the|industries|industry|enterprise|enterprises|corporation|corp|works|india)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}
export function duplicates(rows: Row[]): Row[][] {
  const by = new Map<string, Row[]>();
  for (const r of rows) {
    if (PARKED(r.s) || isMerged(r.m) || isRemoved(r.m)) continue;
    const k = dupKey(r.s.name); if (!k) continue;
    (by.get(k) ?? by.set(k, []).get(k)!).push(r);
  }
  return [...by.values()].filter((g) => g.length > 1).sort((a, b) => b.length - a.length);
}
/** Decide which duplicate survives and what the others hand over to it. */
export function mergePlan(group: Row[]): { keep: Row; rest: Row[]; patches: (MarkPatch & { stopId: string })[] } {
  const score = (r: Row) => (isTicked(r.m) ? 4 : 0) + (phoneOf(r.s, r.m) ? 2 : 0) + (noteOf(r.m) ? 1 : 0) + (preciseOf(r.s, r.m) ? 1 : 0);
  const rows = group.slice().sort((a, b) => score(b) - score(a));
  const keep = rows[0], rest = rows.slice(1);
  const keepPatch: MarkPatch & { stopId: string } = { stopId: keep.s.id };
  for (const r of rest) {
    if (!phoneOf(keep.s, keep.m) && !keepPatch.contactPhone && phoneOf(r.s, r.m)) {
      keepPatch.contactName = conOf(r.m).n || keepPatch.contactName; keepPatch.contactPhone = phoneOf(r.s, r.m);
    }
    if (!noteOf(keep.m) && !keepPatch.note && noteOf(r.m)) keepPatch.note = noteOf(r.m);
    if (!isTicked(keep.m) && !keepPatch.ticked && isTicked(r.m)) { keepPatch.ticked = true; keepPatch.tickedOn = r.m?.tickedOn ?? null; }
  }
  const patches: (MarkPatch & { stopId: string })[] = [];
  if (Object.keys(keepPatch).length > 1) patches.push(keepPatch);
  for (const r of rest) patches.push({ stopId: r.s.id, dupOf: keep.s.id });
  return { keep, rest, patches };
}

/* ─── pipeline intelligence ─── */

export interface LegSuggestion { leg: RbLeg; open: Row[]; prime: number; good: number; score: number }
export function legSuggestions(legs: RbLeg[], rowsByLeg: Map<string, Row[]>, skipFams: Set<string>, take = 3): LegSuggestion[] {
  return legs.filter((l) => !skipFams.has(l.familyId)).map((l) => {
    const open = (rowsByLeg.get(l.id) ?? []).filter((r) => !PARKED(r.s) && !isTicked(r.m) && !isRemoved(r.m) && !isDNC(r.m));
    const prime = open.filter((r) => r.s.fit === "prime").length;
    const good = open.filter((r) => r.s.fit === "good").length;
    return { leg: l, open, prime, good, score: prime * 3 + good };
  }).filter((r) => r.open.length > 0 && r.score > 0)
    .sort((a, b) => b.score - a.score || a.open.length - b.open.length).slice(0, take);
}
export function clusters(pool: Row[], take = 10): { pin: string; rows: Row[] }[] {
  const pinMap = new Map<string, Row[]>();
  for (const r of pool) {
    if (isTicked(r.m) || !(r.s.fit === "prime" || r.s.fit === "good")) continue;
    const pin = pinOf(addrOf(r.s, r.m)); if (!pin) continue;
    (pinMap.get(pin) ?? pinMap.set(pin, []).get(pin)!).push(r);
  }
  return [...pinMap.entries()].filter(([, v]) => v.length >= 3).sort((a, b) => b[1].length - a[1].length)
    .slice(0, take).map(([pin, rows]) => ({ pin, rows }));
}

/** 0–100: how worth a visit a stop is right now. Transparent and tunable. */
export function stopScore(s: RbStop, m: RbMark | undefined, ref = today()): number {
  let n = 0;
  n += { prime: 45, good: 30, channel: 15, weak: 8, clear: 0, no: 0 }[s.fit] ?? 0;
  if (preciseOf(s, m)) n += 12;
  if (phoneOf(s, m)) n += 10;
  if (conOf(m).n) n += 5;
  const o = outOf(m);
  if (o === "int") n += 25; if (o === "smp") n += 20; if (o === "later") n += 5;
  if (o === "dead") n -= 40; if (o === "noans") n -= 5;
  if (isDue(m, ref)) n += 15;
  if (needsFollowUp(m, ref)) n += 8;
  if (isTicked(m) && !o) n -= 10;
  if (isDNC(m) || isRemoved(m) || isMerged(m)) n = 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* ─── fit profile, opportunity sizing and the sample cycle ───────────────
   LIMEX is >50% calcium carbonate carried in a polyolefin and runs on the
   plant's existing machines. So polyolefin processors are the real market,
   and how much they consume is what a prospect is worth. Every rupee below
   comes from settings the user enters — nothing here invents a price. */

/** Prisma serialises Decimal as a string; read every numeric field through this. */
export function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export const POLYMER_LABEL: Record<string, string> = {
  PP: "Polypropylene", HDPE: "HDPE", LDPE: "LDPE", LLDPE: "LLDPE",
  PS: "Polystyrene", PVC: "PVC", PET: "PET", ABS: "ABS", OTHER: "Other",
};
export const PROCESS_LABEL: Record<string, string> = {
  INJECTION: "Injection", BLOW: "Blow", EXTRUSION: "Extrusion",
  THERMOFORM: "Thermoform", FILM: "Film", SHEET: "Sheet",
};
/** Polyolefins carry calcium carbonate happily; the rest are a stretch. */
const POLYOLEFINS = new Set(["PP", "HDPE", "LDPE", "LLDPE"]);

export const csv = (v: string | null | undefined): string[] =>
  (v ?? "").split(",").map((x) => x.trim()).filter(Boolean);

export const polymersOf = (m?: RbMark) => csv(m?.polymers) as Polymer[];
export const processesOf = (m?: RbMark) => csv(m?.processes) as Process[];
export const tonnesOf = (m?: RbMark) => num(m?.monthlyTonnes);
export const resinRateOf = (m?: RbMark) => num(m?.resinRate);
export const hasProfile = (m?: RbMark) =>
  !!(m?.polymers || m?.processes || tonnesOf(m) !== null || m?.machines != null || m?.resinRate != null);

export interface Opportunity {
  tonnes: number | null;   // LIMEX tonnes/month at the target substitution
  value: number | null;    // ₹/month at your rate
  saving: number | null;   // ₹/month vs what they pay for resin today
  known: boolean;          // false when we simply have not asked yet
}

/** What this plant is worth per month, from their volume and your settings. */
export function opportunity(m: RbMark | undefined, set: RbSettings | null): Opportunity {
  const t = tonnesOf(m);
  const pct = set?.substitutionPct ?? 30;
  const rate = num(set?.limexRate);
  if (t === null) return { tonnes: null, value: null, saving: null, known: false };
  const tonnes = (t * pct) / 100;
  const value = rate === null ? null : tonnes * 1000 * rate;
  const resin = resinRateOf(m);
  const saving = rate === null || resin === null ? null : tonnes * 1000 * (resin - rate);
  return { tonnes, value, saving, known: true };
}

/** Short money, the way an Indian business reads it: ₹1.2 Cr, ₹8.4 L, ₹42,000. */
export function inr(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const a = Math.abs(v), sign = v < 0 ? "-" : "";
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(a / 1e7 >= 10 ? 0 : 2)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(a / 1e5 >= 10 ? 0 : 2)} L`;
  if (a >= 1000) return `${sign}₹${Math.round(a).toLocaleString("en-IN")}`;
  return `${sign}₹${a.toFixed(0)}`;
}
export const tonnesText = (t: number | null) =>
  t === null ? "—" : t >= 100 ? `${Math.round(t)} t/mo` : `${t.toFixed(1)} t/mo`;

/** Fit graded from what was actually captured, falling back to the register
 *  guess while a plant is still unprofiled. Returned with its reasons so the
 *  card can explain itself instead of showing an oracle number. */
export function gradeFit(s: RbStop, m: RbMark | undefined): { fit: Fit; why: string[]; profiled: boolean } {
  if (!hasProfile(m)) return { fit: s.fit, why: [s.why ?? "From the register"], profiled: false };
  const why: string[] = [];
  const polys = polymersOf(m);
  const olefin = polys.filter((p) => POLYOLEFINS.has(p));
  let score = 0;
  if (olefin.length) { score += 3; why.push(`Runs ${olefin.join(", ")} — takes calcium carbonate well`); }
  else if (polys.length) { why.push(`Runs ${polys.join(", ")} — not a polyolefin, harder for LIMEX`); score -= 1; }
  const t = tonnesOf(m);
  if (t !== null) {
    if (t >= 50) { score += 3; why.push(`${t} t/month is serious volume`); }
    else if (t >= 10) { score += 2; why.push(`${t} t/month`); }
    else { score += 1; why.push(`${t} t/month is small`); }
  }
  const filler = m?.fillerPct ?? null;
  if (filler !== null && filler > 0) { score += 2; why.push(`Already runs ${filler}% filler — displacement, not persuasion`); }
  else if (filler === 0) { why.push("No filler today — needs the case made from scratch"); }
  if (m?.thinWall) { score -= 2; why.push("Thin wall work caps how much filler they can take"); }
  const proc = processesOf(m);
  if (proc.length) why.push(proc.map((x) => PROCESS_LABEL[x] ?? x).join(", "));
  const fit: Fit = score >= 6 ? "prime" : score >= 4 ? "good" : score >= 2 ? "weak" : "clear";
  return { fit, why, profiled: true };
}

/* ─── samples ─── */

export const samplesOf = (m?: RbMark): RbSample[] => m?.samples ?? [];
export const openSamplesOf = (m?: RbMark) => samplesOf(m).filter((x) => x.result === "PENDING");
export const RESULT_LABEL: Record<SampleResult, string> = {
  PENDING: "Awaiting trial", PASS: "Passed", PARTIAL: "Partial", FAIL: "Failed",
};
/** A sample is stalling once the trial date has passed, or after 21 days. */
export function sampleStalled(x: RbSample, ref = today()): boolean {
  if (x.result !== "PENDING") return false;
  if (x.trialDueOn) return x.trialDueOn < ref;
  return daysSince(x.givenOn, ref) >= 21;
}
export const sampleAge = (x: RbSample, ref = today()) => daysSince(x.givenOn, ref);

/* ─── exports ─── */

export function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function buildCSV(rows: Row[], legById: Record<string, RbLeg>): string {
  const head = ["Leg", "Leg name", "Company", "Address", "Makes", "LIMEX fit", "Address quality",
    "Ticked", "Ticked on", "Outcome", "Follow up on", "Contact", "Phone", "Starred", "Note",
    "Removed", "Not interested", "CRM company id", "Last touched by", "Source", "Map"];
  const body = rows.map(({ s, m }) => [
    s.legId, legById[s.legId]?.name ?? "", s.name, addrOf(s, m), s.makes ?? "", FITLABEL[s.fit],
    preciseOf(s, m) ? "precise" : "plot needed",
    isTicked(m) ? "yes" : "", m?.tickedOn ?? "", OUTMAP[outOf(m)] ?? "", dueOf(m),
    conOf(m).n, phoneOf(s, m), isStar(m) ? "yes" : "", noteOf(m),
    isRemoved(m) ? "yes" : "", isDNC(m) ? "yes" : "", m?.companyId ?? "", m?.updatedBy?.name ?? "",
    s.src ?? "", mapOf(s, m),
  ]);
  return [head, ...body].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export const vcardEscape = (v: string) => String(v ?? "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
export function vcardFor(s: RbStop, m?: RbMark): string {
  const c = conOf(m), phone = phoneOf(s, m);
  const lines = ["BEGIN:VCARD", "VERSION:3.0",
    "FN:" + vcardEscape(c.n ? `${c.n} (${s.name})` : s.name), "ORG:" + vcardEscape(s.name)];
  if (phone) lines.push("TEL;TYPE=CELL:" + vcardEscape(phone));
  const addr = addrOf(s, m);
  if (addr) lines.push("ADR;TYPE=WORK:;;" + vcardEscape(addr) + ";;;;");
  const note = [noteOf(m), s.makes ?? ""].filter(Boolean).join(" — ");
  if (note) lines.push("NOTE:" + vcardEscape(note));
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
export function downloadText(name: string, data: string, mime = "text/plain"): void {
  const blob = new Blob([data], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/* ─── day journal roll-up ─── */

export interface DayRow { stopId: string; name: string; legId: string; tick: 1 | 0 | null; star: 1 | 0 | null; note: string | null; out: string | null; extra: string[]; t: number; by: string }
export function rollDay(events: { kind: string; value: string | null; at: string; stopId: string | null; stop: { name: string; legId: string } | null; user: { name: string } | null }[]): DayRow[] {
  const per = new Map<string, DayRow>();
  for (const e of events) {
    if (!e.stopId) continue;
    const r = per.get(e.stopId) ?? {
      stopId: e.stopId, name: e.stop?.name ?? "(deleted)", legId: e.stop?.legId ?? "", tick: null, star: null,
      note: null, out: null, extra: [], t: 0, by: e.user?.name ?? "",
    };
    if (e.kind === "tick") r.tick = 1; if (e.kind === "untick") r.tick = 0;
    if (e.kind === "star") r.star = 1; if (e.kind === "unstar") r.star = 0;
    if (e.kind === "note") r.note = e.value;
    if (e.kind === "out") r.out = e.value;
    if (e.kind === "dnc") r.extra.push(e.value === "1" ? "not interested" : "restored");
    if (e.kind === "removed") r.extra.push("removed"); if (e.kind === "restored") r.extra.push("restored");
    if (e.kind === "merged") r.extra.push("merged"); if (e.kind === "con") r.extra.push("contact");
    if (e.kind === "addr") r.extra.push("address"); if (e.kind === "due") r.extra.push(e.value ? "follow-up " + fmtDate(e.value) : "follow-up cleared");
    if (e.kind === "added") r.extra.push("added"); if (e.kind === "promote") r.extra.push("to CRM");
    if (e.kind === "followup") r.extra.push("task");
    r.t = Math.max(r.t, Date.parse(e.at)); r.by = e.user?.name ?? r.by;
    per.set(e.stopId, r);
  }
  return [...per.values()].sort((a, b) => a.t - b.t);
}

export function famOfLeg(leg: RbLeg | undefined): string { return leg?.familyId ?? "?"; }
export function famName(fams: RbFamily[], id: string): string { return fams.find((f) => f.id === id)?.name ?? id; }

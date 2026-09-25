/* Whole-book data jobs — export, contacts, backup and restore. Shared by the
 * Companies page (its ⋯ actions) and the Settings page, so there is one copy. */

import { buildCSV, downloadText, today, vcardFor, phoneOf, PARKED, isRemoved, DEFAULT_HOME, type Row } from "./logic.js";
import { getRb, importBook, restoreMarks } from "./store.js";
import { toast } from "./ctx.js";

export const HOME_KEY = "wd_rb_home";

/** Where routes start from — per person, kept on this device. */
export function getHome(): string {
  try { return localStorage.getItem(HOME_KEY) || DEFAULT_HOME; } catch { return DEFAULT_HOME; }
}
export function setHome(v: string): string {
  const h = v.trim() || DEFAULT_HOME;
  try { localStorage.setItem(HOME_KEY, h); } catch { /* private window: keep for this session only */ }
  window.dispatchEvent(new CustomEvent("wd:home", { detail: h }));
  return h;
}

const allRows = (): Row[] => { const st = getRb(); return st.stops.map((s) => ({ s, m: st.marks[s.id] })); };

export function exportWholeBookCSV(): void {
  downloadText(`limex-route-book-${today()}.csv`, "﻿" + buildCSV(allRows(), getRb().index.legById), "text/csv");
  toast("Whole book exported");
}

export function exportContactsVcf(): void {
  const withPhone = allRows().filter((r) => !PARKED(r.s) && !isRemoved(r.m) && phoneOf(r.s, r.m));
  if (!withPhone.length) { toast("No stops have a phone number yet"); return; }
  downloadText(`limex-contacts-${today()}.vcf`, withPhone.map((r) => vcardFor(r.s, r.m)).join("\r\n"), "text/vcard");
  toast(`${withPhone.length} contacts exported`);
}

export function backupBook(): void {
  const st = getRb();
  const data = { app: "limex-route-book", version: 2, exportedAt: new Date().toISOString(), by: st.me?.name, marks: Object.values(st.marks), legMarks: Object.values(st.legMarks), views: st.views, prefs: st.prefs };
  downloadText(`limex-route-book-backup-${today()}.json`, JSON.stringify(data), "application/json");
  toast("Backup saved");
}

/** One file input, two jobs. A plain backup carries marks only and replays
 *  through the outbox. A file that also carries `events` is a whole book
 *  from the standalone app: that goes to the import endpoint, which keeps
 *  every journal line on the day it actually happened instead of stamping
 *  the lot with today's date. */
export async function restoreFromFile(file: File): Promise<void> {
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
}

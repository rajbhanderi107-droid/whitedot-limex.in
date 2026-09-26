/* Region — India or Canada.
 *
 * The register holds Gujarat and wider-India plants and, for the partner in
 * Canada, Canadian makers and importers. Each person works one region at a
 * time: the choice filters every book and swaps the product list. It is kept
 * per person on this device, like the route start point. */

import { useEffect, useState } from "react";
import type { RbStop, RbMark } from "./types.js";

export type Region = "IN" | "CA";
export const REGIONS: [Region, string][] = [["IN", "India"], ["CA", "Canada"]];
const KEY = "wd_region";

export function getRegion(): Region {
  try { return localStorage.getItem(KEY) === "CA" ? "CA" : "IN"; } catch { return "IN"; }
}
export function setRegion(r: Region): void {
  try { localStorage.setItem(KEY, r); } catch { /* private window: this session only */ }
  window.dispatchEvent(new CustomEvent<Region>("wd:region", { detail: r }));
}
export function useRegion(): [Region, (r: Region) => void] {
  const [region, set] = useState<Region>(getRegion);
  useEffect(() => {
    const on = (e: Event) => set((e as CustomEvent<Region>).detail);
    window.addEventListener("wd:region", on);
    return () => window.removeEventListener("wd:region", on);
  }, []);
  return [region, setRegion];
}

/** A Canadian postal code (A1A 1A1), a province code beside it, a province or
 *  city name, or the register's own Canada tag. */
const CA_ADDR = /\b(?:ON|QC|BC|AB|MB|SK|NS|NB|NL|PE)\b\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d|\bCanada\b|\bOntario\b|\bQu[eé]bec\b|British Columbia|\bAlberta\b|\bManitoba\b|Saskatchewan|Nova Scotia|New Brunswick|Newfoundland|\bToronto\b|\bMississauga\b|\bBrampton\b|\bMontr[eé]al\b|\bVancouver\b|\bCalgary\b|\bEdmonton\b|\bWinnipeg\b/i;

export function isCanadian(s: RbStop, m?: RbMark): boolean {
  if ((s.tags ?? []).some((t) => /^canada$/i.test(t.t))) return true;
  return CA_ADDR.test(`${m?.addrOverride ?? ""} ${s.addr ?? ""}`);
}
export const inRegion = (region: Region) => (s: RbStop, m?: RbMark) => (region === "CA") === isCanadian(s, m);

/* ── Canada products ─────────────────────────────────────────────────
 * The partner's three: single-use PE bags, thin-wall containers, and food
 * containers made by thermoforming. Read from what a company makes. */
export const CANADA_PRODUCTS = [
  ["ca-bags", "Use-and-throw bags"],
  ["ca-thinwall", "Thin-wall containers"],
  ["ca-thermo", "Food containers (thermoforming)"],
] as const;
export type CanadaProduct = typeof CANADA_PRODUCTS[number][0];

export function canadaCategories(s: RbStop): CanadaProduct[] {
  const t = `${s.makes ?? ""} ${s.name} ${(s.tags ?? []).map((x) => x.t).join(" ")}`.toLowerCase();
  const out: CanadaProduct[] = [];
  if (/(carry|t-?shirt|shopping|grocery|produce|roll|garbage|trash|can[ -]?liner|refuse|courier|mailer|poly|plastic|film)\s+bags?|can[ -]?liners?|bag(s)? (?:and|&) liners?|single[- ]use bags?|use[- ]and[- ]throw/.test(t)) out.push("ca-bags");
  if (/thin[ -]?wall|deli (?:container|cup|tub)s?|(?:yogh?urt|ice[ -]?cream|dairy|margarine|food) (?:tub|pail)s?|(?:yogh?urt|ice[ -]?cream|dairy|margarine) (?:cup|container)s?|injection[- ]moulded (?:food )?containers?|\btubs?\b/.test(t)) out.push("ca-thinwall");
  if (/thermoform|clamshells?|\btrays?\b|take[- ]?out containers?|takeaway containers?|food service containers?|foodservice packaging|disposable (?:food )?containers?/.test(t)) out.push("ca-thermo");
  return out;
}

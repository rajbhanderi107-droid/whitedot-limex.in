/* Heuristic lead scoring.
 *
 * The full spec scores behavioural signals (page views, brochure/datasheet
 * downloads, calculator use, multiple visits). Those events are not yet
 * stored, so this computes a pragmatic 0–100 score from the signals the
 * inquiry record DOES carry today: pipeline stage, priority, whether a
 * company / business email is present, assignment and recency.
 *
 * It is deliberately transparent and tunable — when behavioural events are
 * wired in a later phase, add their weights here without touching the UI. */

export interface ScorableLead {
  email?: string;
  phone?: string;
  companyName?: string;
  industry?: string | null;
  inquiryType?: string | null;
  sourcePage?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: { id: string; name: string } | null;
}

export type Temperature = "Cold" | "Warm" | "Hot" | "Priority";

const FREE_EMAIL = /@(gmail|yahoo|hotmail|outlook|icloud|proton(mail)?|rediffmail|ymail|live)\./i;

const STATUS_WEIGHT: Record<string, number> = {
  NEW: 5, CONTACTED: 15, QUALIFIED: 30, PROPOSAL_SENT: 45, WON: 60, LOST: -20, ARCHIVED: -10,
};
const PRIORITY_WEIGHT: Record<string, number> = { URGENT: 35, HIGH: 25, MEDIUM: 10, LOW: 0 };

export function leadScore(lead: ScorableLead): number {
  let s = 0;
  s += STATUS_WEIGHT[lead.status] ?? 0;
  s += PRIORITY_WEIGHT[lead.priority] ?? 0;
  if (lead.companyName?.trim()) s += 10;
  if (lead.email && !FREE_EMAIL.test(lead.email)) s += 15; // business domain
  if (lead.phone?.trim()) s += 8;
  if (lead.industry?.trim()) s += 8;
  if (/bulk|sample|quote|price|technical|procurement|distribut/i.test(lead.inquiryType ?? "")) s += 12;
  if (/utm_|source=|campaign=|gclid|fbclid|li_fat_id|ref=/i.test(lead.sourcePage ?? "")) s += 8;
  if (lead.assignedTo) s += 10;

  const ageDays = (Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000;
  if (ageDays <= 7) s += 10;
  else if (ageDays <= 30) s += 5;
  // Penalise stale, untouched leads.
  if (lead.status === "NEW" && ageDays > 14) s -= 15;

  return Math.max(0, Math.min(100, Math.round(s)));
}

export function temperature(score: number): Temperature {
  if (score >= 81) return "Priority";
  if (score >= 61) return "Hot";
  if (score >= 31) return "Warm";
  return "Cold";
}

export function tempClass(t: Temperature): string {
  return { Cold: "cold", Warm: "warm", Hot: "hot", Priority: "priority" }[t];
}

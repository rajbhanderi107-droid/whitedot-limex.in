/* LIMEX Route Book — shared types (mirror of /api/portal/route-book). */

export type Fit = "prime" | "good" | "weak" | "channel" | "no" | "clear";
export type Outcome = "int" | "smp" | "later" | "noans" | "dead";

export interface RbFamily { id: string; name: string; blurb: string | null; sortOrder: number }
export interface RbLeg { id: string; familyId: string; name: string; belt: string | null; nav: string | null; sortOrder: number }
export interface RbTag { t: string; c: string }

export interface RbStop {
  id: string;
  legId: string;
  name: string;
  addr: string | null;
  makes: string | null;
  src: string | null;
  tags: RbTag[] | null;
  precise: boolean;
  map: string | null;
  tel: string | null;
  telLabel: string | null;
  link: string | null;
  linkLabel: string | null;
  fit: Fit;
  why: string | null;
  sortOrder: number;
  userAdded: boolean;
  addedById: string | null;
  addedBy: { name: string } | null;
}

export interface RbMark {
  stopId: string;
  ticked: boolean;
  tickedOn: string | null;
  starred: boolean;
  note: string | null;
  outcome: Outcome | null;
  dueOn: string | null;
  contactName: string | null;
  contactPhone: string | null;
  addrOverride: string | null;
  addrPrecise: boolean | null;
  dnc: boolean;
  removed: boolean;
  dupOf: string | null;
  snoozedOn: string | null;
  companyId: string | null;
  followUpId: string | null;
  updatedAt: string;
  updatedById: string | null;
  updatedBy: { id: string; name: string } | null;
}

export type MarkPatch = Partial<Omit<RbMark, "stopId" | "updatedAt" | "updatedById" | "updatedBy">>;

export interface RbLegMark {
  legId: string;
  ticked: boolean;
  starred: boolean;
  note: string | null;
  updatedAt: string;
  updatedById: string | null;
}

export interface ViewFilters {
  q?: string;
  fam?: string | null;
  fit?: Fit[];
  state?: string[];
  status?: string[];
  extra?: string[];
  trade?: string[];
  parked?: boolean;
}

export interface RbView {
  id: string;
  name: string;
  filters: ViewFilters;
  createdAt: string;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
}

export interface RbEvent {
  id: string;
  kind: string;
  value: string | null;
  day: string;
  at: string;
  stopId: string | null;
  legId: string | null;
  userId: string | null;
  user: { id: string; name: string } | null;
  stop: { name: string; legId: string } | null;
}

/** Per-user preferences. Long lists are comma-joined strings because the
 *  API sanitizer caps request arrays at 50 entries. */
export interface RbPrefs {
  view?: "route" | "all" | "plan" | "pipe";
  sort?: "leg" | "az" | "fit" | "open";
  density?: "cozy" | "compact";
  order?: string;
  recent?: string;
  openLegs?: string;
}

export interface RbBootstrap {
  fams: RbFamily[];
  legs: RbLeg[];
  stops: RbStop[];
  marks: RbMark[];
  legMarks: RbLegMark[];
  views: RbView[];
  prefs: RbPrefs;
  me: { id: string; name: string; role: string };
  serverDay: string;
  userLeg: string;
}

export interface RbSummary {
  total: number;
  sellable: number;
  ticked: number;
  tickedWeek: number;
  interested: number;
  samples: number;
  starred: number;
  dueToday: number;
  lastEvent: { at: string; kind: string; user: { name: string } | null } | null;
}

export interface NewStop {
  name: string;
  addr?: string;
  tel?: string;
  makes?: string;
  fit?: Fit;
  legId?: string;
}

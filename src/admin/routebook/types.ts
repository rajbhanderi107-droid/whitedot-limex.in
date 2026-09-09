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

export type SourceFolder = "GPT" | "CLAUDE" | "TEAM" | "UNKNOWN";

export interface RbMark {
  sourceFolder?: SourceFolder | null;
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

  /* Fit profile. LIMEX is >50% calcium carbonate in a polyolefin carrier and
     runs on the plant's existing machines, so these are the facts that decide
     whether it suits them. Prisma serialises Decimal as a string, hence the
     `string | number` — read them through `num()` in logic.ts, never raw. */
  polymers: string | null;          // csv of Polymer
  processes: string | null;         // csv of Process
  monthlyTonnes: string | number | null;
  machines: number | null;
  fillerPct: number | null;         // filler they already run, %
  resinRate: string | number | null; // ₹/kg they pay today
  thinWall: boolean | null;
  profiledOn: string | null;

  /* Lifecycle. One company, three books: `stage` is the only thing that
     decides which book shows this row, so nothing is ever duplicated. */
  stage: Stage;
  leadOn: string | null;
  customerOn: string | null;
  lostOn: string | null;
  lostReason: string | null;
  nextStep: string | null;
  expectedMt: string | number | null;   // MT/month they say they would take
  quotedRate: string | number | null;   // ₹/kg quoted to them
  gstNumber: string | null;
  billTo: string | null;
  shipTo: string | null;
  paymentTerms: string | null;
  inquiryId: string | null;

  samples?: RbSample[];
  orders?: RbOrder[];
  updatedAt: string;
  updatedById: string | null;
  updatedBy: { id: string; name: string } | null;
}

export const POLYMERS = ["PP", "HDPE", "LDPE", "LLDPE", "PS", "PVC", "PET", "ABS", "OTHER"] as const;
export type Polymer = (typeof POLYMERS)[number];

export const PROCESSES = ["INJECTION", "BLOW", "EXTRUSION", "THERMOFORM", "FILM", "SHEET"] as const;
export type Process = (typeof PROCESSES)[number];

export const STAGES = ["PROSPECT", "LEAD", "CUSTOMER", "LOST"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  PROSPECT: "Prospect", LEAD: "Lead", CUSTOMER: "Customer", LOST: "Lost",
};

export const SAMPLE_RESULTS = ["PENDING", "PASS", "PARTIAL", "FAIL"] as const;
export type SampleResult = (typeof SAMPLE_RESULTS)[number];

export interface RbSample {
  id: string;
  stopId: string;
  grade: string;
  kg: string | number;
  givenOn: string;
  contactName: string | null;
  trialDueOn: string | null;
  result: SampleResult;
  resultOn: string | null;
  resultNote: string | null;
  createdAt: string;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
  /** Present only on /samples/open, which joins back to the stop. */
  mark?: {
    stopId: string;
    contactName: string | null;
    contactPhone: string | null;
    stop: { name: string; legId: string };
  };
}

export type NewSample = {
  grade: string; kg: number; givenOn?: string; contactName?: string | null;
  trialDueOn?: string | null; result?: SampleResult; resultOn?: string | null; resultNote?: string | null;
};

/** Commercial assumptions. Every rupee figure derives from these — the app
 *  never invents a price. `limexRate` null means sizing stays in tonnes. */
export interface RbSettings {
  id: string;
  limexRate: string | number | null;
  substitutionPct: number;
  currency: string;
  updatedAt?: string;
  updatedById?: string | null;
}

export const ORDER_STATUSES = ["CONFIRMED", "DISPATCHED", "DELIVERED", "PAID", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CONFIRMED: "Confirmed", DISPATCHED: "Dispatched", DELIVERED: "Delivered",
  PAID: "Paid", CANCELLED: "Cancelled",
};

/** An order. LIMEX is sold by the metric tonne, so quantity is MT and the
 *  rate is per kg the way converters quote resin. `amount` is worked out on
 *  the server, never here, so an export cannot disagree with the screen. */
export interface RbOrder {
  id: string;
  stopId: string;
  orderNo: string;
  grade: string;
  quantityMt: string | number;
  rate: string | number | null;
  amount: string | number | null;
  orderedOn: string;
  dispatchOn: string | null;
  status: OrderStatus;
  poRef: string | null;
  note: string | null;
  createdAt: string;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
  /** Present only on /orders, which joins back to the company. */
  mark?: {
    stopId: string;
    gstNumber: string | null;
    contactName: string | null;
    contactPhone: string | null;
    stop: { name: string; legId: string };
  };
}

export type NewOrder = {
  grade: string; quantityMt: number; rate?: number | null; orderedOn?: string;
  dispatchOn?: string | null; status?: OrderStatus; poRef?: string | null; note?: string | null;
};

export type MarkPatch = Partial<Omit<RbMark, "stopId" | "updatedAt" | "updatedById" | "updatedBy" | "samples" | "orders">>;

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
  settings: RbSettings | null;
  me: { id: string; name: string; role: string };
  serverDay: string;
  userLeg: string;
}

/** A whole book arriving from the standalone app: the marks, and the day
 *  journal that produced them. Journal lines keep their own day and instant,
 *  so importing never re-dates someone's round to today. */
export interface RbImport {
  marks: (MarkPatch & { stopId: string })[];
  events: { stopId: string; kind: string; value?: string | null; day: string; at: string }[];
}

export interface RbImportResult {
  marks: number;
  events: number;
  duplicateEvents: number;
  days: string[];
  skippedStops: string[];
}

/** What moved since the caller last looked — how every open device agrees. */
export interface RbChanges {
  marks: RbMark[];
  stops: RbStop[];
  removedStopIds: string[];
  at: string;
}

export interface NewStop {
  name: string;
  addr?: string;
  tel?: string;
  makes?: string;
  fit?: Fit;
  legId?: string;
}

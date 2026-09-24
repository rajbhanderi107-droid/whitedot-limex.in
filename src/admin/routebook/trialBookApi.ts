/* Typed client for /api/portal/trial-book.
 *
 * The Trial Book holds the same fifteen heads as the workbook on the laptop,
 * in the same order. The laptop folder stays the record of truth: a trial
 * typed here is written out to "TRIAL WEEKLY LIST\<n>. WHITEDOT BY SEVENDOT
 * - ....xlsx" by portal_sync.py, which then reports the file name back. */

import { api } from "../lib/api.js";

const B = "/api/portal/trial-book";
const enc = encodeURIComponent;

/** The fifteen heads, in the workbook's own order. All text: the workbook has
 *  always held text here ("NA", "48.4gm", "1250gm  TRIAL BATCH"). */
export interface TrialFields {
  projectBackground?: string;   //  1
  mouldingProcess?: string;     //  2
  limexGrade?: string;          //  3
  mixBatch?: string;            //  4, line 1
  mixResin?: string;            //  4, line 2
  mixLimex?: string;            //  4, line 3
  colouring?: string;           //  5
  product?: string;             //  6  — the one head a trial cannot be saved without
  brandOwner?: string;          //  7
  originalResin?: string;       //  8
  barrelTemp?: string;          //  9
  originalWeight?: string;      // 10
  trialWeight?: string;         // 11
  result?: string;              // 12
  problems?: string;            // 13
  nextStep?: string;            // 14
  // 15 — the photo lives in the laptop folder and in Google Drive, never here
  imageName?: string;
  imageDriveUrl?: string;
  imageLocal?: string;

  stopId?: string;
  company?: string;
  trialOn?: string;             // YYYY-MM-DD
}

export interface Trial extends TrialFields {
  id: string;
  trialNo: number;
  fileName?: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
}

export const trialApi = {
  /** Oldest first, so the newest trial reads at the bottom. */
  list: () => api.getFresh<{ trials: Trial[]; nextTrialNo: number }>(B),
  nextNumber: () => api.getFresh<{ nextTrialNo: number }>(`${B}/next-number`),
  create: (body: TrialFields) => api.post<{ trial: Trial }>(B, body),
  update: (id: string, body: TrialFields) => api.patch<{ trial: Trial }>(`${B}/${enc(id)}`, body),
  remove: (id: string) => api.delete<null>(`${B}/${enc(id)}`),
};

/** The heads as the form and the workbook both show them, so the two can never
 *  drift apart. `key` is the column in the row; `sr` is the number printed in
 *  column A of the workbook. */
export const TRIAL_HEADS: { sr: number | ""; key: keyof TrialFields; label: string; long?: boolean }[] = [
  { sr: 1,  key: "projectBackground", label: "Project background", long: true },
  { sr: 2,  key: "mouldingProcess",   label: "Moulding Process" },
  { sr: 3,  key: "limexGrade",        label: "LIMEX grade" },
  { sr: 4,  key: "mixBatch",          label: "Mixing Ratio — batch" },
  { sr: "", key: "mixResin",          label: "Mixing Ratio — resin" },
  { sr: "", key: "mixLimex",          label: "Mixing Ratio — LIMEX" },
  { sr: 5,  key: "colouring",         label: "Colouring" },
  { sr: 6,  key: "product",           label: "Product" },
  { sr: 7,  key: "brandOwner",        label: "Brand owner" },
  { sr: 8,  key: "originalResin",     label: "Original resin" },
  { sr: 9,  key: "barrelTemp",        label: "Barrel temperature" },
  { sr: 10, key: "originalWeight",    label: "Original weight of product" },
  { sr: 11, key: "trialWeight",       label: "Weight during trial" },
  { sr: 12, key: "result",            label: "Result", long: true },
  { sr: 13, key: "problems",          label: "Problems highlighted by customer", long: true },
  { sr: 14, key: "nextStep",          label: "Next Step", long: true },
];

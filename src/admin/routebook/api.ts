/* Typed client for /api/portal/route-book. */

import { api } from "../lib/api.js";
import type {
  RbBootstrap, RbSummary, RbEvent, RbMark, RbLegMark, RbStop, RbView, RbPrefs,
  MarkPatch, NewStop, ViewFilters, RbSample, NewSample, RbSettings,
} from "./types.js";

const B = "/api/portal/route-book";
const enc = encodeURIComponent;

function qs(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${enc(k)}=${enc(v as string)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export const rbApi = {
  bootstrap: () => api.getFresh<RbBootstrap>(`${B}/bootstrap`),
  summary: () => api.get<RbSummary>(`${B}/summary`),
  events: (params: { day?: string; from?: string; to?: string; stopId?: string }) =>
    api.getFresh<RbEvent[]>(`${B}/events${qs(params)}`),
  days: () => api.getFresh<Record<string, Record<string, number>>>(`${B}/days`),

  patchMark: (stopId: string, body: MarkPatch & { day?: string }) =>
    api.patch<RbMark>(`${B}/marks/${enc(stopId)}`, body),
  bulkMarks: (items: (MarkPatch & { stopId: string })[], day?: string) =>
    api.post<RbMark[]>(`${B}/marks/bulk`, { items, day }),
  patchLegMark: (legId: string, body: Partial<Pick<RbLegMark, "ticked" | "starred" | "note">> & { day?: string }) =>
    api.patch<RbLegMark>(`${B}/legs/${enc(legId)}/mark`, body),

  createStop: (body: NewStop & { day?: string }) => api.post<RbStop>(`${B}/stops`, body),
  bulkStops: (items: NewStop[], day?: string) => api.post<RbStop[]>(`${B}/stops/bulk`, { items, day }),
  updateStop: (id: string, body: Partial<Omit<NewStop, "legId">>) => api.patch<RbStop>(`${B}/stops/${enc(id)}`, body),
  deleteStop: (id: string) => api.delete<null>(`${B}/stops/${enc(id)}`),
  restoreStop: (id: string) => api.post<RbStop>(`${B}/stops/${enc(id)}/restore`, {}),

  listViews: () => api.getFresh<RbView[]>(`${B}/views`),
  createView: (name: string, filters: ViewFilters) => api.post<RbView>(`${B}/views`, { name, filters }),
  deleteView: (id: string) => api.delete<null>(`${B}/views/${enc(id)}`),
  getPrefs: () => api.getFresh<RbPrefs>(`${B}/prefs`),
  putPrefs: (data: RbPrefs) => api.patch<RbPrefs>(`${B}/prefs`, { data }),

  // Samples: the trial cycle that actually closes a materials sale.
  openSamples: () => api.getFresh<RbSample[]>(`${B}/samples/open`),
  createSample: (stopId: string, body: NewSample) =>
    api.post<RbSample>(`${B}/stops/${enc(stopId)}/samples`, body),
  updateSample: (id: string, body: Partial<NewSample>) =>
    api.patch<RbSample>(`${B}/samples/${enc(id)}`, body),
  deleteSample: (id: string) => api.delete<{ id: string }>(`${B}/samples/${enc(id)}`),

  // Commercial assumptions behind every rupee figure.
  getSettings: () => api.get<RbSettings>(`${B}/settings`),
  putSettings: (body: Partial<Omit<RbSettings, "id">>) => api.patch<RbSettings>(`${B}/settings`, body),

  reseed: () => api.post<{ fams: number; legs: number; stops: number; version: number }>(`${B}/reseed`, {}),
};

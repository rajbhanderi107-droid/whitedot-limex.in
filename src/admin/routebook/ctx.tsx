/* Page-level plumbing shared by the Route Book components: the UI context
 * (filters, editing state, navigation helpers) and a tiny toast store with
 * an undo history. */

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Filters } from "./logic.js";

export interface UIApi {
  filters: Filters;
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void;
  density: "cozy" | "compact";
  editing: string | null;
  setEditing: (id: string | null) => void;
  jumpTo: (stopId: string) => void;
  startQueue: (ids: string[]) => void;
  openAdd: () => void;
  home: string;
}

export const UICtx = createContext<UIApi | null>(null);
export function useUI(): UIApi {
  const c = useContext(UICtx);
  if (!c) throw new Error("Route Book UI context missing");
  return c;
}

/* ─── toasts ─── */

export interface Toast { id: number; msg: string; undo?: () => void; tone?: "ok" | "err" }
export interface HistoryItem { id: number; label: string; fn: () => void; at: number }

let toasts: Toast[] = [];
let history: HistoryItem[] = [];
let nextId = 0;
const subs = new Set<() => void>();
const emit = () => { for (const s of subs) s(); };
const sub = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };

export function toast(msg: string, undo?: () => void, tone?: "ok" | "err"): void {
  const t: Toast = { id: ++nextId, msg, undo, tone };
  toasts = [...toasts.slice(-2), t];
  if (undo) history = [{ id: t.id, label: msg, fn: undo, at: Date.now() }, ...history].slice(0, 30);
  emit();
  window.setTimeout(() => dismissToast(t.id), undo ? 6500 : 2400);
}
export function dismissToast(id: number): void {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
export function runHistory(id: number): void {
  const h = history.find((x) => x.id === id);
  if (!h) return;
  history = history.filter((x) => x.id !== id);
  emit();
  h.fn();
}
export function clearHistory(): void { history = []; emit(); }
export const useToasts = () => useSyncExternalStore(sub, () => toasts, () => toasts);
export const useHistory = () => useSyncExternalStore(sub, () => history, () => history);

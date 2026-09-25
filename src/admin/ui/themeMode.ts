/* Light, dark, or follow the device — chosen in Settings, kept per person on
 * this device. Light is the default: the portal was designed pastel-white. */

import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "wd_theme";

export function getThemePref(): ThemePref {
  try { const v = localStorage.getItem(KEY); return v === "dark" || v === "system" ? v : "light"; } catch { return "light"; }
}

const media = () => window.matchMedia?.("(prefers-color-scheme: dark)");
function resolve(pref: ThemePref): "light" | "dark" {
  return pref === "system" ? (media()?.matches ? "dark" : "light") : pref;
}

export function applyTheme(pref = getThemePref()): void {
  document.documentElement.dataset.wdTheme = resolve(pref);
}

export function setThemePref(pref: ThemePref): void {
  try { localStorage.setItem(KEY, pref); } catch { /* keep for this session */ }
  applyTheme(pref);
  window.dispatchEvent(new CustomEvent<ThemePref>("wd:theme", { detail: pref }));
}

/** Apply once at start, and follow the device when set to "system". */
export function startTheme(): void {
  applyTheme();
  media()?.addEventListener?.("change", () => { if (getThemePref() === "system") applyTheme("system"); });
}

export function useThemePref(): [ThemePref, (p: ThemePref) => void] {
  const [pref, set] = useState<ThemePref>(getThemePref);
  useEffect(() => {
    const on = (e: Event) => set((e as CustomEvent<ThemePref>).detail);
    window.addEventListener("wd:theme", on);
    return () => window.removeEventListener("wd:theme", on);
  }, []);
  return [pref, setThemePref];
}

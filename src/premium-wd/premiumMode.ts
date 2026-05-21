/* ───────────────────────────────────────────────────────────────────────────
   PREMIUM-WD — MASTER ARCHITECTURE SWITCH
   ───────────────────────────────────────────────────────────────────────────
   One flag governs every cinematic layer on the site. Flip it and the whole
   experience reverts to a simpler, lighter mode while content and layout stay
   identical.

       const premiumMode = true;   // full cinematic flagship
       premiumMode = false;        // original simple, responsive site

   premiumMode = false MUST:
     • disable the WebGL hero, shaders and particle VFX
     • disable Lenis inertia scroll (native scroll instead)
     • collapse staggered motion to instant / simple states
     • strip premium glows, blur, parallax and heavy shadows (via CSS)
     • preserve responsiveness and the original content structure

   Resolution order (most explicit wins):
     1. ?premium=on|off  in the URL          (QA / demos, persists to storage)
     2. localStorage "wd_premium" = on|off    (sticky manual override)
     3. VITE_WD_PREMIUM_ENABLED = "false"      (build-time kill switch)
     4. device + accessibility capability gate (adaptive downgrade)
   ─────────────────────────────────────────────────────────────────────────── */

/** Headline master flag — the build-time intent. Set the env var to "false"
 *  (VITE_WD_PREMIUM_ENABLED=false) to ship the simple site. */
export const premiumMode: boolean =
  import.meta.env.VITE_WD_PREMIUM_ENABLED !== "false";

const STORAGE_KEY = "wd_premium";

type Flag = "on" | "off";

function readOverride(): Flag | null {
  if (typeof window === "undefined") return null;

  // URL param wins and is made sticky so reloads keep the chosen mode.
  try {
    const param = new URLSearchParams(window.location.search).get("premium");
    if (param === "on" || param === "off") {
      window.localStorage.setItem(STORAGE_KEY, param);
      return param;
    }
  } catch {
    /* URL/storage unavailable — fall through */
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "on" || stored === "off") return stored;
  } catch {
    /* storage blocked — ignore */
  }

  return null;
}

/** Adaptive gate: weak or motion-averse devices get the simple site even when
 *  premiumMode is built in. This keeps the flagship smooth where it can be and
 *  graceful where it cannot. */
function deviceCanRender(): boolean {
  if (typeof window === "undefined") return true;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return false;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory < 4) {
    return false;
  }
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency < 4) {
    return false;
  }

  return true;
}

/** Final resolved decision for this session — explicit override, then the
 *  build flag, then adaptive capability. */
export function resolvePremiumMode(): boolean {
  const override = readOverride();
  if (override) return override === "on";
  if (!premiumMode) return false;
  return deviceCanRender();
}

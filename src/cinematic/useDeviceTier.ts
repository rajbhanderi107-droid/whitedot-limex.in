/**
 * useDeviceTier — one-time GPU/CPU capability classification for the Born of
 * LIMEX cinematic scene.
 *
 * Returns "high" | "low". This sits UNDER the upstream `usePremium()` +
 * reduced-motion gate (which decides whether the WebGL scene mounts at all);
 * here we only choose how heavy to make the scene once it IS mounting.
 *
 *   "high" — full particle counts, all 5 post-FX, env reflections, every route.
 *   "low"  — ~half particle counts, drop DepthOfField + ChromaticAberration,
 *            skip env map, simpler shader branches.
 *
 * Heuristics (conservative — unknown desktop → high, unknown mobile → low):
 *   - navigator.hardwareConcurrency  (< 4 cores → low)
 *   - navigator.deviceMemory         (< 4 GB → low)
 *   - coarse pointer / mobile UA      → low
 *   - connection.saveData            → low
 *
 * SSR-safe (guards window/navigator) and computed exactly once in a useState
 * initializer, so it never causes re-render churn.
 */
import { useState } from "react";

export type DeviceTier = "high" | "low";

function detectTier(): DeviceTier {
  // SSR / no-DOM guard — assume high so the markup matches a capable client.
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "high";
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  // 1. Data-saver is an explicit "go light" request — honor it immediately.
  if (nav.connection?.saveData === true) return "low";

  // 2. Coarse-pointer / mobile UA → low (phones, most tablets).
  let coarse = false;
  try {
    coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  } catch {
    coarse = false;
  }
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(
    nav.userAgent || "",
  );
  const isMobile = coarse || mobileUA;

  // 3. Hard CPU / memory floors — true everywhere.
  const cores = nav.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores < 4) return "low";

  const mem = nav.deviceMemory;
  if (typeof mem === "number" && mem > 0 && mem < 4) return "low";

  // 4. Mobile that cleared the floors above is still treated as low — the GPU,
  //    not the CPU, is the binding constraint for a full post-FX stack on
  //    phones, and iOS Safari is the QA target.
  if (isMobile) return "low";

  // 5. Desktop / unknown pointer with adequate (or unreported) specs → high.
  return "high";
}

export function useDeviceTier(): DeviceTier {
  // Compute once; never re-evaluate. No effect, no state updates → no churn.
  const [tier] = useState<DeviceTier>(detectTier);
  return tier;
}

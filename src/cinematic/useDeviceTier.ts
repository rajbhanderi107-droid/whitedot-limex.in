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

function isWeakGPU(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return true; // WebGL not supported or failed -> treat as weak

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return false; // Can't query -> assume okay

    const renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "").toLowerCase();

    // Check for common integrated/weak GPU names
    const weakKeywords = [
      "intel",
      "uhd",
      "hd graphics",
      "iris",
      "amd radeon(tm) graphics", // Integrated AMD Radeon
      "radeon graphics",
      "amd radeon vega",
      "vega",
      "basic render driver",
      "swiftshader",
      "llvmpipe",
    ];

    const isDedicatedAMD = renderer.includes("radeon") && (renderer.includes("rx") || renderer.includes("pro"));

    if (weakKeywords.some(keyword => renderer.includes(keyword))) {
      if (renderer.includes("radeon") && isDedicatedAMD) {
        return false;
      }
      return true;
    }
  } catch (e) {
    // Fail-safe: assume okay
  }
  return false;
}

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

  // WebGL integrated/weak GPU detection
  if (isWeakGPU()) return "low";

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

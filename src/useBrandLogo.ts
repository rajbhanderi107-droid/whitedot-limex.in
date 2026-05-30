import { useSyncExternalStore } from "react";
import { getBrandLogo, subscribeBrandLogo } from "./brand";

/** Live brand logo source. Re-renders when the logo is changed at runtime. */
export function useBrandLogo(): string {
  return useSyncExternalStore(subscribeBrandLogo, getBrandLogo, getBrandLogo);
}

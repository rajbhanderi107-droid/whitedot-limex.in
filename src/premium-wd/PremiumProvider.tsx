import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resolvePremiumMode } from "./premiumMode";

const PremiumContext = createContext<boolean>(true);

/** Read the resolved premium decision anywhere in the tree.
 *  `true` = full cinematic systems, `false` = simple reverted site. */
export function usePremium(): boolean {
  return useContext(PremiumContext);
}

/** Resolves the master flag once on mount and reflects it onto
 *  document.documentElement[data-premium] so CSS layers can branch without JS. */
export function PremiumProvider({ children }: { children: ReactNode }) {
  // Server / first paint assumes the build intent; the real device-aware value
  // is resolved in the effect to avoid SSR/window mismatches.
  const [premium, setPremium] = useState<boolean>(true);

  useEffect(() => {
    const resolved = resolvePremiumMode();
    setPremium(resolved);
    document.documentElement.dataset.premium = resolved ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.premium;
    };
  }, []);

  return <PremiumContext.Provider value={premium}>{children}</PremiumContext.Provider>;
}

// White Dot LLP — Mineral Sound System: toggle hook.
// Removable via `npm run remove:sound:wd`.

import { useState, useCallback } from "react";
import { audioEngine } from "./audioEngine";

export function useSoundToggle() {
  const [enabled, setEnabled] = useState(() => audioEngine.isEnabled());

  const toggle = useCallback(() => {
    const next = audioEngine.toggle();
    setEnabled(next);
  }, []);

  return { enabled, toggle };
}

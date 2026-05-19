// White Dot LLP — Continuity Layer: integration shell.
// Owns the kill-switch check and wires the detector hook to the overlay.
// Form-state awareness arrives in Commit 1.3.
// Removable via `npm run remove:continuity:wd`.

import { useOfflineDetector } from "./useOfflineDetector";
import { ContinuityOverlay } from "./ContinuityOverlay";

const CONTINUITY_ENABLED =
  import.meta.env.VITE_WD_CONTINUITY_ENABLED !== "false";

export function ContinuityShell() {
  if (!CONTINUITY_ENABLED) return null;
  return <EnabledContinuityShell />;
}

function EnabledContinuityShell() {
  const { showOverlay, secondsOffline } = useOfflineDetector();
  return (
    <ContinuityOverlay
      open={showOverlay}
      secondsOffline={secondsOffline}
      hasPendingForm={false}
    />
  );
}

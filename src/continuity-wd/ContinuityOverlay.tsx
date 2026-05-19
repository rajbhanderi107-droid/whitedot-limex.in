// White Dot LLP — Continuity Layer: presentational overlay.
// Pure props in, JSX out. State management lives in ContinuityShell.
// Removable via `npm run remove:continuity:wd`.

import { useEffect, useState } from "react";

export interface ContinuityOverlayProps {
  open: boolean;
  secondsOffline: number;
  hasPendingForm: boolean;
}

const STATUS_MESSAGES = [
  "Reconnecting",
  "Holding your place",
  "Almost back",
] as const;

const FALLBACK_THRESHOLD_SECONDS = 30;

export function ContinuityOverlay({
  open,
  secondsOffline,
  hasPendingForm,
}: ContinuityOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return;
    }
    const id = window.setInterval(
      () => setMessageIndex((value) => (value + 1) % STATUS_MESSAGES.length),
      3000,
    );
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="continuity-wd-overlay"
      role="status"
      aria-live="polite"
      aria-label="Connection lost. White Dot is holding your place."
    >
      <div className="continuity-wd-stage">
        {hasPendingForm && (
          <p className="continuity-wd-form-note">
            Your trial request is saved. We will send it the moment you are back.
          </p>
        )}
        <div className="continuity-wd-orbit-stage" aria-hidden="true">
          <svg className="continuity-wd-orbit" viewBox="0 0 100 100">
            <circle
              className="continuity-wd-arc continuity-wd-arc-outer"
              cx="50"
              cy="50"
              r="38"
            />
            <circle
              className="continuity-wd-arc continuity-wd-arc-inner"
              cx="50"
              cy="50"
              r="28"
            />
          </svg>
          <span className="continuity-wd-dot" />
        </div>
        <p className="continuity-wd-message">{STATUS_MESSAGES[messageIndex]}</p>
      </div>
      <p className="continuity-wd-timer" aria-hidden="true">
        Last connected {secondsOffline}s ago
      </p>
      {secondsOffline >= FALLBACK_THRESHOLD_SECONDS && (
        <a className="continuity-wd-fallback" href="#material">
          Continue browsing offline
        </a>
      )}
    </div>
  );
}

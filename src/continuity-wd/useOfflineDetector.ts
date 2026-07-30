// White Dot — Continuity Layer: offline detection hook.
// Combines the browser's online/offline events with a HEAD-request fallback
// because navigator.onLine cannot be trusted alone on captive portals and
// transparent proxies.
// Removable via `npm run remove:continuity:wd`.

import { useEffect, useRef, useState } from "react";

interface DetectorState {
  isOnline: boolean;
  showOverlay: boolean;
  secondsOffline: number;
}

interface DetectorOptions {
  hasPendingForm?: boolean;
  pollUrl?: string;
  pollIntervalMs?: number;
  idleThresholdMs?: number;
  formThresholdMs?: number;
}

const DEFAULT_POLL_URL = "./assets/whitedot-symbol.svg";

export function useOfflineDetector(
  options: DetectorOptions = {},
): DetectorState {
  const {
    hasPendingForm = false,
    pollUrl = DEFAULT_POLL_URL,
    pollIntervalMs = 5000,
    idleThresholdMs = 3000,
    formThresholdMs = 1500,
  } = options;

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [showOverlay, setShowOverlay] = useState(false);
  const [secondsOffline, setSecondsOffline] = useState(0);

  const hasPendingFormRef = useRef(hasPendingForm);
  hasPendingFormRef.current = hasPendingForm;

  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // When the browser claims we are offline, periodically HEAD a known asset to
  // detect the genuine moment we are back. Done with a real network request
  // (cache: no-store) so the service worker cannot answer locally.
  useEffect(() => {
    if (isOnline) return;
    let cancelled = false;
    const id = window.setInterval(() => {
      fetch(pollUrl, { method: "HEAD", cache: "no-store" })
        .then((response) => {
          if (!cancelled && response.ok) setIsOnline(true);
        })
        .catch(() => undefined);
    }, pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isOnline, pollUrl, pollIntervalMs]);

  // Engage the overlay after the appropriate threshold; tear it down the
  // instant we come back online.
  useEffect(() => {
    if (isOnline) {
      setShowOverlay(false);
      setSecondsOffline(0);
      return;
    }
    const threshold = hasPendingFormRef.current
      ? formThresholdMs
      : idleThresholdMs;
    const id = window.setTimeout(() => setShowOverlay(true), threshold);
    return () => window.clearTimeout(id);
  }, [isOnline, idleThresholdMs, formThresholdMs]);

  useEffect(() => {
    if (!showOverlay) return;
    const id = window.setInterval(
      () => setSecondsOffline((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(id);
  }, [showOverlay]);

  return { isOnline, showOverlay, secondsOffline };
}

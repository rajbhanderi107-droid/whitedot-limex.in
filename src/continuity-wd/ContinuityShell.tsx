// White Dot LLP — Continuity Layer: integration shell.
// Owns the kill-switch check, wires detector + form persistence to the overlay.
// Removable via `npm run remove:continuity:wd`.

import { useCallback, useEffect, useRef } from "react";
import { useOfflineDetector } from "./useOfflineDetector";
import { ContinuityOverlay } from "./ContinuityOverlay";
import {
  saveFormFields,
  loadFormFields,
  clearFormFields,
  hasPendingFormData,
  buildWhatsAppUrl,
} from "./formPersistence";

const CONTINUITY_ENABLED =
  import.meta.env.VITE_WD_CONTINUITY_ENABLED !== "false";

const WA_NUMBER = "918849728938";
const WA_BASE_MESSAGE =
  "Hello White Dot LLP, I want to discuss LIMEX material supply, samples, and pricing for my business.";

export function ContinuityShell() {
  if (!CONTINUITY_ENABLED) return null;
  return <EnabledContinuityShell />;
}

function EnabledContinuityShell() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const hasPending = hasPendingFormData();

  const { isOnline, showOverlay, secondsOffline } = useOfflineDetector({
    hasPendingForm: hasPending,
  });

  const wasOffline = useRef(false);

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(".vfx-wd-quote-form");
    formRef.current = form;
  }, []);

  // Save form fields when going offline
  useEffect(() => {
    if (!isOnline && !wasOffline.current) {
      wasOffline.current = true;
      const form = formRef.current;
      if (!form) return;
      const select = form.querySelector<HTMLSelectElement>("select");
      const input = form.querySelector<HTMLInputElement>("input");
      const application = select?.value || "";
      const volume = input?.value || "";
      if (application || volume) {
        saveFormFields({ application, volume });
      }
    }
  }, [isOnline]);

  // On reconnect: restore form fields and open WhatsApp with prefilled data
  useEffect(() => {
    if (isOnline && wasOffline.current) {
      wasOffline.current = false;
      const saved = loadFormFields();
      if (!saved) return;

      // Restore form fields
      const form = formRef.current;
      if (form) {
        const select = form.querySelector<HTMLSelectElement>("select");
        const input = form.querySelector<HTMLInputElement>("input");
        if (select && saved.application) select.value = saved.application;
        if (input && saved.volume) input.value = saved.volume;
      }

      // Open WhatsApp with prefilled message
      const url = buildWhatsAppUrl(WA_NUMBER, WA_BASE_MESSAGE, saved);
      window.open(url, "_blank", "noreferrer");
      clearFormFields();
    }
  }, [isOnline]);

  const onRetry = useCallback(() => {
    const saved = loadFormFields();
    const url = buildWhatsAppUrl(WA_NUMBER, WA_BASE_MESSAGE, saved);
    window.open(url, "_blank", "noreferrer");
    clearFormFields();
  }, []);

  return (
    <ContinuityOverlay
      open={showOverlay}
      secondsOffline={secondsOffline}
      hasPendingForm={hasPending || hasPendingFormData()}
      onRetry={onRetry}
    />
  );
}

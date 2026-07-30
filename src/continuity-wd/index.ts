// White Dot — Continuity Layer module barrel.
// Removable via `npm run remove:continuity:wd`.

export { ContinuityShell } from "./ContinuityShell";
export { ContinuityOverlay } from "./ContinuityOverlay";
export { useOfflineDetector } from "./useOfflineDetector";
export { registerContinuityServiceWorker } from "./registerServiceWorker";
export {
  saveFormFields,
  loadFormFields,
  clearFormFields,
  hasPendingFormData,
  buildWhatsAppUrl,
} from "./formPersistence";
export type { FormFields } from "./formPersistence";

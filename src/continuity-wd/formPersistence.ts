// White Dot — Continuity Layer: form-state persistence.
// Saves quote-form fields to localStorage when offline, restores on reconnect,
// and opens WhatsApp with the user's application + volume prefilled.
// Removable via `npm run remove:continuity:wd`.

const STORAGE_KEY = "wd_pending_form";

export interface FormFields {
  application: string;
  volume: string;
  savedAt: number;
}

export function saveFormFields(fields: Omit<FormFields, "savedAt">): void {
  try {
    const entry: FormFields = { ...fields, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — silent fail, overlay still shows.
  }
}

export function loadFormFields(): FormFields | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FormFields;
  } catch {
    return null;
  }
}

export function clearFormFields(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silent fail.
  }
}

export function hasPendingFormData(): boolean {
  return loadFormFields() !== null;
}

export function buildWhatsAppUrl(
  phoneNumber: string,
  baseMessage: string,
  fields: FormFields | null,
): string {
  let message = baseMessage;
  if (fields && (fields.application || fields.volume)) {
    const parts: string[] = [];
    if (fields.application) parts.push(`Application: ${fields.application}`);
    if (fields.volume) parts.push(`Volume: ${fields.volume}`);
    message = `${baseMessage}\n\n${parts.join("\n")}`;
  }
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://whitedot-limex-backend.onrender.com");

export interface SiteSettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  whatsapp_number: string;
  company_address: string;
  gst_number: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  company_name: "White Dot LLP",
  company_email: "office@whitedotindia.in",
  company_phone: "+91 88497 28938",
  whatsapp_number: "918849728938",
  company_address: "Gujarat, India",
  gst_number: "",
};

let cachedSettings = DEFAULT_SITE_SETTINGS;
let settingsRequest: Promise<SiteSettings> | null = null;

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function normalizeWhatsapp(value: string) {
  return value.replace(/\D/g, "");
}

async function fetchSiteSettings() {
  const res = await fetch(`${API_BASE}/api/public/settings`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Could not load website settings");

  const next = { ...DEFAULT_SITE_SETTINGS } as SiteSettings;
  for (const item of json.data as Array<{ key: keyof SiteSettings; value: string }>) {
    if (item.key in next) next[item.key] = item.value || next[item.key];
  }
  cachedSettings = next;
  return next;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(cachedSettings);

  useEffect(() => {
    if (!settingsRequest) settingsRequest = fetchSiteSettings();
    let mounted = true;
    settingsRequest.then((next) => {
      if (mounted) setSettings(next);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return settings;
}

export function getPhoneHref(settings: SiteSettings) {
  return `tel:${normalizePhone(settings.company_phone)}`;
}

export function getWhatsappHref(settings: SiteSettings, message: string) {
  return `https://wa.me/${normalizeWhatsapp(settings.whatsapp_number)}?text=${encodeURIComponent(message)}`;
}

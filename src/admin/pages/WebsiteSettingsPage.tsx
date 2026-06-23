import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Save, Upload, RotateCcw } from "lucide-react";
import { api, ApiError } from "../lib/api.js";
import { BRAND_LOGO_SRC, setBrandLogo } from "../../brand";

// Raster logos are scaled down to this longest edge before saving, which keeps
// the inlined base64 small regardless of the source image size.
const MAX_LOGO_DIMENSION = 512;
// SVGs can't be canvas-resized without rasterizing, so they keep this hard cap.
const MAX_SVG_BYTES = 600 * 1024; // 600 KB
// Generous bound on the source raster before we shrink it.
const MAX_RASTER_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB
// Final safety bound vs the server's body limit.
const MAX_OUTPUT_CHARS = 1_400_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

/** Scale a raster image down to MAX_LOGO_DIMENSION and re-encode as PNG (keeps transparency). */
function resizeRasterDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas-unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("decode-failed"));
    img.src = dataUrl;
  });
}

interface WebsiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string | null;
  updatedAt: string;
  updatedBy?: { id: string; name: string } | null;
}

// Canonical settings the portal should always expose, even if the backend DB
// has no row yet. Keeps the Settings page complete after a fresh DB / migration.
const DEFAULT_SETTINGS: Array<{ key: string; value: string; type: string; description: string }> = [
  { key: "company_name", value: "White Dot LLP", type: "TEXT", description: "Company display name" },
  { key: "company_email", value: "office@whitedotindia.in", type: "EMAIL", description: "Primary contact email" },
  { key: "company_phone", value: "+918849728938", type: "TEXT", description: "Primary contact phone" },
  { key: "whatsapp_number", value: "918849728938", type: "TEXT", description: "WhatsApp number (digits only, with country code)" },
  { key: "company_address", value: "Gujarat, India", type: "TEXT", description: "Company address shown on the website" },
  { key: "gst_number", value: "", type: "TEXT", description: "GST registration number" },
  { key: "public_loading_enabled", value: "false", type: "BOOLEAN", description: "Show the Coming Soon / loading page to public visitors" },
];

/** Merge backend rows with the canonical defaults so every setting renders. */
function withDefaults(rows: WebsiteSetting[]): WebsiteSetting[] {
  const existing = new Set(rows.map((r) => r.key));
  const backfilled = DEFAULT_SETTINGS.filter((d) => !existing.has(d.key)).map((d) => ({
    id: d.key,
    key: d.key,
    value: d.value,
    type: d.type,
    description: d.description,
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
  }));
  return [...rows, ...backfilled].sort((a, b) => a.key.localeCompare(b.key));
}

function labelFromKey(key: string) {
  return key.replace(/_/g, " ");
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function isBooleanSetting(setting: WebsiteSetting) {
  return setting.type === "BOOLEAN";
}

function inputTypeFor(setting: WebsiteSetting) {
  if (setting.type === "EMAIL") return "email";
  if (setting.key.includes("phone") || setting.key.includes("whatsapp")) return "tel";
  if (setting.type === "URL") return "url";
  return "text";
}

function needsTextarea(setting: WebsiteSetting) {
  return setting.value.length > 80 || setting.key.includes("address") || setting.key.includes("description");
}

export function WebsiteSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<WebsiteSetting[]>("/api/website-settings");
      const merged = withDefaults(res.data);
      setSettings(merged);
      setDrafts(Object.fromEntries(merged.map((setting) => [setting.key, setting.value])));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // The logo has its own dedicated card, so keep it out of the generic list.
  const generalSettings = useMemo(
    () => settings.filter((setting) => setting.key !== "brand_logo"),
    [settings],
  );

  const dirtyCount = useMemo(
    () => generalSettings.filter((setting) => drafts[setting.key] !== setting.value).length,
    [drafts, generalSettings],
  );

  const savedLogo = settings.find((s) => s.key === "brand_logo")?.value || "";
  const logoPreview = pendingLogo ?? savedLogo ?? "";

  const handleLogoFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError("");
    setNotice("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, SVG, WEBP, JPG).");
      return;
    }
    const isSvg = file.type === "image/svg+xml";
    const maxInput = isSvg ? MAX_SVG_BYTES : MAX_RASTER_INPUT_BYTES;
    if (file.size > maxInput) {
      setError(
        isSvg
          ? `SVG is too large (${Math.round(file.size / 1024)} KB). Use one under 600 KB.`
          : `Image is too large (${Math.round(file.size / 1024 / 1024)} MB). Use one under 8 MB.`,
      );
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // SVGs stay vector; raster images get scaled down for a light payload.
      const result = isSvg ? dataUrl : await resizeRasterDataUrl(dataUrl);
      if (result.length > MAX_OUTPUT_CHARS) {
        setError("Logo is still too large after processing. Try a simpler image.");
        return;
      }
      setPendingLogo(result);
    } catch {
      setError("Could not process that image. Try another file.");
    }
  };

  const saveLogo = async () => {
    if (pendingLogo == null) return;
    setLogoSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await api.put<WebsiteSetting>("/api/website-settings/brand-logo", { value: pendingLogo });
      setSettings((current) => {
        const others = current.filter((s) => s.key !== "brand_logo");
        return [...others, res.data].sort((a, b) => a.key.localeCompare(b.key));
      });
      setBrandLogo(res.data.value); // live-update the logo across the open app
      setPendingLogo(null);
      setNotice("Website logo updated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLogoSaving(false);
    }
  };

  const resetLogo = async () => {
    if (!window.confirm("Reset the logo to the default White Dot mark?")) return;
    setLogoSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await api.put<WebsiteSetting>("/api/website-settings/brand-logo", { value: "" });
      setSettings((current) => {
        const others = current.filter((s) => s.key !== "brand_logo");
        return [...others, res.data].sort((a, b) => a.key.localeCompare(b.key));
      });
      setBrandLogo(""); // falls back to the bundled default
      setPendingLogo(null);
      setNotice("Logo reset to the default White Dot mark.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLogoSaving(false);
    }
  };

  const saveSetting = async (setting: WebsiteSetting, nextValue = drafts[setting.key] ?? "") => {
    setSavingKey(setting.key);
    setError("");
    setNotice("");
    try {
      const res = await api.patch<WebsiteSetting>(
        `/api/website-settings/${encodeURIComponent(setting.key)}`,
        { value: nextValue },
      );
      setSettings((current) =>
        current.map((item) => (item.key === setting.key ? { ...item, ...res.data } : item)),
      );
      setDrafts((current) => ({ ...current, [setting.key]: res.data.value }));
      setNotice(`${labelFromKey(setting.key)} saved.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <>
      <div className="adm-header">
        <h1>Website Settings</h1>
        <p>Edit contact and company settings used by the website.</p>
      </div>

      {(notice || error) && (
        <div className={`adm-alert ${error ? "adm-alert-error" : "adm-alert-success"}`}>
          {error || notice}
        </div>
      )}

      <div className="adm-card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 .25rem" }}>Website Logo</h3>
        <p style={{ color: "var(--adm-muted)", fontSize: ".82rem", margin: "0 0 1rem" }}>
          Upload a new logo to replace the White Dot mark everywhere it appears on the site. PNG or SVG
          with a transparent background works best. Under 600&nbsp;KB.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div
            style={{
              width: 72,
              height: 72,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              border: "1px solid var(--adm-border)",
              background: "rgba(255,255,255,.03)",
            }}
          >
            <img
              src={logoPreview || BRAND_LOGO_SRC}
              alt="Current logo preview"
              style={{ maxWidth: 56, maxHeight: 56, objectFit: "contain" }}
            />
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFile}
              style={{ display: "none" }}
            />
            <button
              className="adm-btn adm-btn-ghost"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoSaving}
            >
              <Upload size={15} />
              Choose image
            </button>
            <button
              className="adm-btn adm-btn-primary"
              type="button"
              onClick={saveLogo}
              disabled={pendingLogo == null || logoSaving}
            >
              <Save size={15} />
              {logoSaving ? "Saving..." : pendingLogo != null ? "Save logo" : "Saved"}
            </button>
            <button
              className="adm-btn adm-btn-ghost"
              type="button"
              onClick={resetLogo}
              disabled={logoSaving || (!savedLogo && pendingLogo == null)}
              title="Reset to the default White Dot logo"
            >
              <RotateCcw size={15} />
              Reset to default
            </button>
          </div>
        </div>
        {pendingLogo != null && (
          <p style={{ color: "var(--adm-muted)", fontSize: ".78rem", margin: ".75rem 0 0" }}>
            New logo selected — click <strong>Save logo</strong> to apply it across the site.
          </p>
        )}
      </div>

      <div className="adm-table-wrap">
        <div className="adm-toolbar">
          <span className="adm-toolbar-note">
            {dirtyCount > 0 ? `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}` : "All settings saved"}
          </span>
          <button className="adm-btn adm-btn-ghost" type="button" onClick={loadSettings}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "1rem" }}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="adm-skeleton adm-skeleton-row" />
            ))}
          </div>
        ) : generalSettings.length === 0 ? (
          <div className="adm-empty">No website settings found.</div>
        ) : (
          <div className="adm-settings-list">
            {generalSettings.map((setting) => {
              const value = drafts[setting.key] ?? "";
              const dirty = value !== setting.value;
              return (
                <section className="adm-setting-row" key={setting.key}>
                  <div className="adm-setting-meta">
                    <strong>{labelFromKey(setting.key)}</strong>
                    <span>{setting.description || setting.key}</span>
                    <small>{setting.type}</small>
                  </div>

                  <label className="adm-setting-control">
                    <span className="adm-sr-only">{labelFromKey(setting.key)}</span>
                    {isBooleanSetting(setting) ? (
                      <button
                        className={`adm-toggle ${value === "true" ? "is-on" : ""}`}
                        type="button"
                        role="switch"
                        aria-checked={value === "true"}
                        disabled={savingKey === setting.key}
                        onClick={() => {
                          const nextValue = value === "true" ? "false" : "true";
                          setDrafts((current) => ({ ...current, [setting.key]: nextValue }));
                          void saveSetting(setting, nextValue);
                        }}
                      >
                        <span className="adm-toggle-track" aria-hidden="true">
                          <span className="adm-toggle-thumb" />
                        </span>
                        <span className="adm-toggle-text">{value === "true" ? "Loading page on" : "Loading page off"}</span>
                      </button>
                    ) : needsTextarea(setting) ? (
                      <textarea
                        className="adm-input adm-textarea"
                        value={value}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))
                        }
                      />
                    ) : (
                      <input
                        className="adm-input"
                        type={inputTypeFor(setting)}
                        value={value}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))
                        }
                      />
                    )}
                  </label>

                  {isBooleanSetting(setting) ? (
                    <span className="adm-setting-state">{savingKey === setting.key ? "Saving..." : "Auto saved"}</span>
                  ) : (
                    <button
                      className="adm-btn adm-btn-primary"
                      type="button"
                      disabled={!dirty || savingKey === setting.key}
                      onClick={() => saveSetting(setting)}
                    >
                      <Save size={15} />
                      {savingKey === setting.key ? "Saving..." : "Save"}
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

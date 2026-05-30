import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Save, Upload, RotateCcw } from "lucide-react";
import { api, ApiError } from "../lib/api.js";
import { BRAND_LOGO_SRC, setBrandLogo } from "../../brand";

// Cap the uploaded logo so the base64 payload stays comfortably under the
// API body limit and every public page load stays light.
const MAX_LOGO_BYTES = 600 * 1024; // 600 KB

interface WebsiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string | null;
  updatedAt: string;
  updatedBy?: { id: string; name: string } | null;
}

function labelFromKey(key: string) {
  return key.replace(/_/g, " ");
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
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
      setSettings(res.data);
      setDrafts(Object.fromEntries(res.data.map((setting) => [setting.key, setting.value])));
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

  const handleLogoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError("");
    setNotice("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, SVG, WEBP, JPG).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(`Logo is too large (${Math.round(file.size / 1024)} KB). Use an image under 600 KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingLogo(String(reader.result));
    reader.onerror = () => setError("Could not read that file. Try another image.");
    reader.readAsDataURL(file);
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

  const saveSetting = async (setting: WebsiteSetting) => {
    setSavingKey(setting.key);
    setError("");
    setNotice("");
    try {
      const value = drafts[setting.key] ?? "";
      const res = await api.patch<WebsiteSetting>(
        `/api/website-settings/${encodeURIComponent(setting.key)}`,
        { value },
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
                    {needsTextarea(setting) ? (
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

                  <button
                    className="adm-btn adm-btn-primary"
                    type="button"
                    disabled={!dirty || savingKey === setting.key}
                    onClick={() => saveSetting(setting)}
                  >
                    <Save size={15} />
                    {savingKey === setting.key ? "Saving..." : "Save"}
                  </button>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

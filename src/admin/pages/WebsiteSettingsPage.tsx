import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { api, ApiError } from "../lib/api.js";

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

  const dirtyCount = useMemo(
    () => settings.filter((setting) => drafts[setting.key] !== setting.value).length,
    [drafts, settings],
  );

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
        ) : settings.length === 0 ? (
          <div className="adm-empty">No website settings found.</div>
        ) : (
          <div className="adm-settings-list">
            {settings.map((setting) => {
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

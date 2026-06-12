import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { api } from "../lib/api.js";
import { useBrandLogo } from "../../useBrandLogo";
import { PasswordInput } from "../components/PasswordInput.js";

/* ─── Google Identity Services type shim ─── */
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            callback: (resp: { code?: string; error?: string }) => void;
          }): { requestCode(): void };
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(options?: { prompt?: string }): void };
        };
      };
    };
  }
}

interface GoogleConfig {
  enabled: boolean;
  clientId?: string;
}

interface Props {
  onLogin: (email: string, password: string) => Promise<unknown>;
  onGoogleLogin: (accessToken: string) => Promise<unknown>;
}

/* ─── Load Google Identity Services script once ─── */
let gsiLoadPromise: Promise<void> | null = null;

function loadGSIScript(): Promise<void> {
  if (gsiLoadPromise) return gsiLoadPromise;
  gsiLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
  return gsiLoadPromise;
}

export function LoginPage({ onLogin, onGoogleLogin }: Props) {
  const brandLogo = useBrandLogo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig | null>(null);
  const navigate = useNavigate();

  /* ─── Fetch Google OAuth config from backend ─── */
  useEffect(() => {
    api.get<GoogleConfig>("/api/auth/google/config")
      .then((res) => {
        setGoogleConfig(res.data);
      })
      .catch(() => {
        // Backend unreachable — disable Google login silently
        setGoogleConfig({ enabled: false });
      });
  }, []);

  /* ─── Email + password login ─── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Google OAuth popup login ─── */
  const handleGoogleLogin = useCallback(async () => {
    if (!googleConfig?.enabled || !googleConfig.clientId) {
      setError("Google sign-in needs GOOGLE_CLIENT_ID in Render. The server secret is optional for this recovery flow.");
      return;
    }

    setError("");
    setGoogleLoading(true);

    // Load GSI script on-demand if it hasn't loaded yet
    if (!window.google?.accounts) {
      try {
        await loadGSIScript();
      } catch {
        setError("Failed to load Google Sign-In. Please try again.");
        setGoogleLoading(false);
        return;
      }
    }

    if (!window.google?.accounts) {
      setError("Google Sign-In is not available. Please try again.");
      setGoogleLoading(false);
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: googleConfig.clientId,
      scope: "email profile",
      callback: async (response) => {
        if (response.error || !response.access_token) {
          setGoogleLoading(false);
          if (response.error !== "access_denied") {
            setError("Google sign-in was cancelled or failed.");
          }
          return;
        }

        try {
          await onGoogleLogin(response.access_token);
          navigate("/admin/dashboard");
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Google login failed");
        } finally {
          setGoogleLoading(false);
        }
      },
    });

    client.requestAccessToken({ prompt: "select_account" });
  }, [googleConfig, onGoogleLogin, navigate]);


  const anyLoading = loading || googleLoading;

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img src={brandLogo} alt="" width={48} height={48} />
        </div>
        <h1>White Dot Admin</h1>
        <p>Sign in to manage leads, quotes, and operations.</p>

        {error && <div className="adm-login-error">{error}</div>}

        {/* ─── Email + Password Form ─── */}
        <form onSubmit={handleSubmit}>
          <div className="adm-form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="adm-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="adm-form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput id="password" value={password} onChange={setPassword} required />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary" style={{ width: "100%", marginTop: ".8rem", justifyContent: "center" }} disabled={anyLoading}>
            {loading ? (
              <><span className="adm-dot-pulse" style={{ display: "inline-flex" }}><span /><span /><span /></span> Signing in...</>
            ) : "Sign in with email"}
          </button>
          {anyLoading && (
            <p style={{ textAlign: "center", color: "var(--adm-muted)", fontSize: ".75rem", marginTop: ".6rem" }}>
              First request may take a few seconds while the server wakes up.
            </p>
          )}
        </form>

        <button
          type="button"
          onClick={() => navigate("/admin/forgot-password")}
          style={{
            display: "block",
            margin: ".9rem auto 0",
            background: "none",
            border: "none",
            color: "var(--adm-muted)",
            cursor: "pointer",
            fontSize: ".8rem",
            textDecoration: "underline",
          }}
        >
          Forgot password?
        </button>

        {/* ─── Google Sign-In — compact glass icon ─── */}
        <div className="adm-google-glass-wrap">
            <div className="adm-login-divider"><span>or continue with</span></div>
            <button
              type="button"
              className="adm-google-glass"
              onClick={handleGoogleLogin}
              disabled={anyLoading}
              aria-label="Sign in with Google"
              title="Sign in with Google"
            >
              {googleLoading ? (
                <span className="adm-dot-pulse"><span /><span /><span /></span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
            </button>
        </div>
      </div>
    </div>
  );
}

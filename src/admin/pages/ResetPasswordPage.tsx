import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { FormEvent } from "react";
import { api, ApiError } from "../lib/api.js";
import { useBrandLogo } from "../../useBrandLogo";

type TokenState = "checking" | "valid" | "invalid";

export function ResetPasswordPage() {
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setTokenState("invalid");
      return;
    }
    api
      .get<{ valid: boolean }>(`/api/auth/verify-reset-token/${encodeURIComponent(token)}`)
      .then((res) => {
        if (active) setTokenState(res.data.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (active) setTokenState("invalid");
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/admin/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img src={brandLogo} alt="" width={48} height={48} />
        </div>
        <h1>Set a new password</h1>

        {tokenState === "checking" && <p>Verifying your reset link…</p>}

        {tokenState === "invalid" && (
          <>
            <div className="adm-login-error">This reset link is invalid or has expired.</div>
            <button
              type="button"
              className="adm-login-btn"
              style={{ marginTop: "1rem" }}
              onClick={() => navigate("/admin/forgot-password")}
            >
              Request a new link
            </button>
          </>
        )}

        {tokenState === "valid" && done && (
          <p>Password updated. Redirecting you to sign in…</p>
        )}

        {tokenState === "valid" && !done && (
          <>
            <p>Choose a new password for your account.</p>

            {error && <div className="adm-login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="adm-login-form">
              <label>
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
              </label>
              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
              </label>
              <button type="submit" className="adm-login-btn" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

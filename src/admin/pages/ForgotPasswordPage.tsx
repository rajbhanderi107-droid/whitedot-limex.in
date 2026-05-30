import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { api, ApiError } from "../lib/api.js";
import { useBrandLogo } from "../../useBrandLogo";

export function ForgotPasswordPage() {
  const brandLogo = useBrandLogo();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
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
        <h1>Reset password</h1>

        {sent ? (
          <>
            <p>If that email is registered, a reset link is on its way. Check your inbox and spam folder.</p>
            <button
              type="button"
              className="adm-login-btn"
              style={{ marginTop: "1rem" }}
              onClick={() => navigate("/admin/login")}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <p>Enter your account email and we'll send you a link to set a new password.</p>

            {error && <div className="adm-login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="adm-login-form">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@whitedot.in"
                  autoComplete="email"
                  required
                />
              </label>
              <button type="submit" className="adm-login-btn" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate("/admin/login")}
              style={{
                marginTop: "1rem",
                background: "none",
                border: "none",
                color: "var(--adm-muted, #888)",
                cursor: "pointer",
                fontSize: ".85rem",
                textDecoration: "underline",
              }}
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

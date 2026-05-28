import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";

interface Props {
  onLogin: (email: string, password: string) => Promise<unknown>;
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const assetPath = (p: string) => `${import.meta.env.BASE_URL}${p}`.replace(/\/{2,}/g, "/");

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img src={assetPath("assets/whitedot-logo-enhanced.svg")} alt="" width={40} height={40} />
        </div>
        <h1>White Dot Admin</h1>
        <p>Sign in to manage leads, quotes, and operations.</p>

        {error && <div className="adm-login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="adm-form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="adm-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="adm-form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="adm-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary" style={{ width: "100%", marginTop: ".8rem", justifyContent: "center" }} disabled={loading}>
            {loading ? (
              <><span className="adm-dot-pulse" style={{ display: "inline-flex" }}><span /><span /><span /></span> Signing in...</>
            ) : "Sign in"}
          </button>
          {loading && (
            <p style={{ textAlign: "center", color: "var(--adm-muted)", fontSize: ".75rem", marginTop: ".6rem" }}>
              First request may take a few seconds while the server wakes up.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

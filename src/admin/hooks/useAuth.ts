import { useState, useEffect, useCallback } from "react";
import { api, ApiError, getToken, setToken, clearToken } from "../lib/api.js";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse extends User {
  token: string;
}

/* The signed-in user is remembered next to the token, so a phone with a weak
 * or failing connection opens straight onto its cached books instead of
 * sitting on "Connecting…" while /api/auth/me times out (30 s, three tries).
 * The session is still checked in the background, and it is only dropped when
 * the server actually rejects it (401/403) — never because the network was
 * slow. Dropping it on a timeout used to sign people out on every blip. */
const USER_KEY = "wd_admin_user";

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const u = raw ? JSON.parse(raw) : null;
    return u && typeof u.id === "string" && typeof u.role === "string" ? u : null;
  } catch { return null; }
}
function cacheUser(u: User | null) {
  try { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); } catch { /* private mode */ }
}

export function useAuth() {
  const [user, setUserState] = useState<User | null>(() => (getToken() ? readCachedUser() : null));
  const [loading, setLoading] = useState(() => !(getToken() && readCachedUser()));
  const setUser = useCallback((u: User | null) => { cacheUser(u); setUserState(u); }, []);

  const checkAuth = useCallback(async () => {
    // No token → skip the network call, go straight to login
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<User>("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      // Only a server that says the session is no good ends it. A timeout or
      // an unreachable server keeps the remembered user signed in.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.post<LoginResponse>("/api/auth/login", { email, password });
    // Store JWT in localStorage for cross-origin auth
    if (res.data.token) {
      setToken(res.data.token);
    }
    setUser({ id: res.data.id, name: res.data.name, email: res.data.email, role: res.data.role });
    return res;
  };

  /** Google OAuth: exchange a browser-issued Google access token for a session. */
  const googleLogin = async (accessToken: string) => {
    const res = await api.post<LoginResponse>("/api/auth/google", { accessToken });
    if (res.data.token) {
      setToken(res.data.token);
    }
    setUser({ id: res.data.id, name: res.data.name, email: res.data.email, role: res.data.role });
    return res;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch {
      // ignore — we clear locally regardless
    }
    clearToken();
    setUser(null);
  };

  return { user, loading, login, googleLogin, logout, isAuthenticated: !!user };
}

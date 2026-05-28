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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch {
      // Token expired or invalid — clear it
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch {
      // ignore — we clear locally regardless
    }
    clearToken();
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}

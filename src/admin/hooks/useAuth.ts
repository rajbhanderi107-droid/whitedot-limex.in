import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../lib/api.js";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get<User>("/api/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.post<User>("/api/auth/login", { email, password });
    setUser(res.data);
    return res;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch {
      // ignore
    }
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}

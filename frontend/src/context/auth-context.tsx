"use client";

import { getMe } from "@/lib/api";
import type { User } from "@/types/api";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const tok = typeof window !== "undefined" ? localStorage.getItem("fp_token") : null;
      if (!tok) {
        setUser(null);
        return;
      }
      // In mock mode, getMe reads from localStorage
      const u = await getMe();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    localStorage.removeItem("fp_token");
    localStorage.removeItem("fp_user");
    setUser(null);
    window.location.href = "/auth/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

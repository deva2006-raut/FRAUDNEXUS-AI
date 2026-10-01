"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface DemoUser {
  name: string;
  role: string;
  email: string;
}

interface AuthCtx {
  user: DemoUser | null;
  ready: boolean;
  login: (u?: Partial<DemoUser>) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, ready: false, login: () => {}, logout: () => {} });
const KEY = "fraudnexus.user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = useCallback((u?: Partial<DemoUser>) => {
    const full: DemoUser = {
      name: u?.name || "Demo Analyst",
      role: u?.role || "Fraud Investigation Lead",
      email: u?.email || "analyst@fraudnexus.demo",
    };
    setUser(full);
    try { localStorage.setItem(KEY, JSON.stringify(full)); } catch {}
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

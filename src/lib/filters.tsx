"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type TxFilter = "all" | "normal" | "suspicious" | "high_risk" | "critical" | "under_investigation" | "resolved";

interface FiltersCtx {
  txFilter: TxFilter;
  setTxFilter: (f: TxFilter) => void;
  txSearch: string;
  setTxSearch: (s: string) => void;
  goToTxn: (txnId: string) => void;
  lastGlobalResult: { type: string; id: string } | null;
  setLastGlobalResult: (r: { type: string; id: string } | null) => void;
}

const Ctx = createContext<FiltersCtx | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [txSearch, setTxSearch] = useState("");
  const [lastGlobalResult, setLastGlobalResult] = useState<FiltersCtx["lastGlobalResult"]>(null);
  const goToTxn = useCallback((txnId: string) => {
    setTxSearch(txnId);
    setTxFilter("all");
  }, []);

  const value = useMemo(
    () => ({ txFilter, setTxFilter, txSearch, setTxSearch, goToTxn, lastGlobalResult, setLastGlobalResult }),
    [txFilter, txSearch, goToTxn, lastGlobalResult]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters outside provider");
  return ctx;
}

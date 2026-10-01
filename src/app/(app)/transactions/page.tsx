"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getWorld } from "@/lib/data/store";
import { getInvestigation } from "@/lib/investigations";
import { fmtINR, fmtTime12 } from "@/lib/format";
import { Panel, RiskBadge, StatusBadge, EmptyState, LinkBtn } from "@/components/ui";
import { useFilters, type TxFilter } from "@/lib/filters";
import { IconSearch } from "@/components/Icons";

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "normal", label: "Normal" },
  { id: "suspicious", label: "Suspicious" },
  { id: "high_risk", label: "High Risk" },
  { id: "critical", label: "Critical" },
  { id: "under_investigation", label: "Under Investigation" },
  { id: "resolved", label: "Resolved" },
];

type SortKey = "date" | "amount" | "risk";

export default function TransactionsPage() {
  const world = getWorld();
  const sp = useSearchParams();
  const { txFilter, setTxFilter, txSearch, setTxSearch } = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [focusId, setFocusId] = useState<string | null>(sp.get("focus"));

  useEffect(() => {
    const f = sp.get("f");
    if (f && FILTERS.some((x) => x.id === f)) setTxFilter(f as TxFilter);
    const focus = sp.get("focus");
    if (focus) setFocusId(focus);
  }, [sp, setTxFilter]);

  const rows = useMemo(() => {
    let list = [...world.txns.values()];
    const s = txSearch.trim().toLowerCase();
    if (s) {
      list = list.filter((t) =>
        t.txnId.toLowerCase().includes(s) ||
        t.customerId.toLowerCase().includes(s) ||
        t.beneficiary.toLowerCase().includes(s) ||
        t.deviceLabel.toLowerCase().includes(s) ||
        t.location.toLowerCase().includes(s)
      );
    }
    const invTxnIds = new Set([...(world.investigations?.keys() ?? [])]);
    switch (txFilter) {
      case "normal": list = list.filter((t) => t.statusClass === "Normal"); break;
      case "suspicious": list = list.filter((t) => t.statusClass !== "Normal"); break;
      case "high_risk": list = list.filter((t) => t.riskLevel === "high"); break;
      case "critical": list = list.filter((t) => t.riskLevel === "critical"); break;
      case "under_investigation": list = list.filter((t) => invTxnIds.has(t.txnId)); break;
      case "resolved": list = list.filter((t) => getInvestigation(t.txnId)?.status === "safe"); break;
    }
    list.sort((a, b) => {
      let d = 0;
      if (sortKey === "date") d = (a.date + a.time).localeCompare(b.date + b.time);
      else if (sortKey === "amount") d = a.amount - b.amount;
      else d = a.riskScore - b.riskScore;
      return sortDir === "asc" ? d : -d;
    });
    return list.slice(0, 300);
  }, [world, txSearch, txFilter, sortKey, sortDir]);

  const focusTx = focusId ? world.txns.get(focusId) : undefined;

  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Transaction Monitor</h1>
          <p className="text-xs text-ink-400 mt-0.5">{rows.length} transactions · synthetic data · click a row to open details</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder="Filter by ID / customer / beneficiary / device…"
              className="input !pl-9 !py-1.5 !text-xs w-72"
            />
            {txSearch && (
              <button onClick={() => setTxSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-100 text-xs">✕</button>
            )}
          </div>
          <select value={`${sortKey}:${sortDir}`} onChange={(e) => { const [k, d] = e.target.value.split(":"); setSortKey(k as SortKey); setSortDir(d as "asc" | "desc"); }} className="input !w-auto !py-1.5 !text-xs">
            <option value="date:desc">Newest first</option>
            <option value="date:asc">Oldest first</option>
            <option value="amount:desc">Amount ↓</option>
            <option value="amount:asc">Amount ↑</option>
            <option value="risk:desc">Risk ↓</option>
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTxFilter(f.id)}
            className={`chip border transition-colors ${txFilter === f.id ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10 hover:border-white/20"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {focusTx && (
        <div className="glass-panel p-4 border-cyanx-500/30 animate-fadeUp">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-ink-400">Focused transaction</p>
              <p className="text-sm font-semibold mt-0.5">
                <span className="font-mono text-cyanx-300">{focusTx.txnId}</span> · {fmtINR(focusTx.amount)} · {focusTx.date} {fmtTime12(focusTx.time)} · {focusTx.location} · {focusTx.deviceLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RiskBadge level={focusTx.riskLevel} score={focusTx.riskScore} />
              {focusTx.suspicious || focusTx.statusClass !== "Normal" ? (
                <LinkBtn href={`/investigate/${focusTx.txnId}`} variant="solid" className="!py-1.5">Open Investigation View</LinkBtn>
              ) : (
                <LinkBtn href={`/customers/${focusTx.customerId}`} variant="ghost" className="!py-1.5">View Customer</LinkBtn>
              )}
              <button className="btn-ghost !py-1.5" onClick={() => setFocusId(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <Panel className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-navy-800/40">
                <th className="th">Transaction ID</th>
                <th className="th">Customer</th>
                <th className="th">Amount</th>
                <th className="th">Date/Time</th>
                <th className="th">Location</th>
                <th className="th">Device</th>
                <th className="th">Type</th>
                <th className="th">Beneficiary</th>
                <th className="th">Risk</th>
                <th className="th">Status</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((tx) => {
                const inv = getInvestigation(tx.txnId);
                return (
                  <tr key={tx.txnId} className={`hover:bg-white/[0.03] transition-colors ${focusId === tx.txnId ? "bg-cyanx-500/[0.06]" : ""}`}>
                    <td className="td font-mono text-xs text-cyanx-300">{tx.txnId}</td>
                    <td className="td">{world.customers.get(tx.customerId)?.seed.name ?? tx.customerId}</td>
                    <td className="td font-semibold">{fmtINR(tx.amount)}</td>
                    <td className="td text-xs">{tx.date} · {fmtTime12(tx.time)}</td>
                    <td className="td text-xs">{tx.location}</td>
                    <td className="td text-xs max-w-[150px] truncate" title={tx.deviceLabel}>{tx.deviceLabel}</td>
                    <td className="td text-xs">{tx.type}</td>
                    <td className="td text-xs max-w-[170px] truncate" title={tx.beneficiary}>{tx.beneficiary}</td>
                    <td className="td"><RiskBadge level={tx.riskLevel} score={tx.riskScore} /></td>
                    <td className="td"><StatusBadge status={tx.statusClass} /></td>
                    <td className="td">
                      {tx.suspicious || tx.statusClass !== "Normal" ? (
                        <LinkBtn href={`/investigate/${tx.txnId}`} variant="primary" className="!px-2.5 !py-1 !text-xs">Investigate</LinkBtn>
                      ) : (
                        <Link href={`/customers/${tx.customerId}`} className="text-xs text-ink-300 hover:text-cyanx-300">Details</Link>
                      )}
                      {inv?.status === "safe" && <span className="ml-1.5 text-[10px] text-safe-400">✓ resolved</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <EmptyState title="No transactions match the current filters." hint="Try clearing the search or choosing a different filter." />
        )}
      </Panel>
    </div>
  );
}

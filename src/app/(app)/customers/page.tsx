"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getWorld } from "@/lib/data/store";
import { Panel, RiskBadge, EmptyState, LinkBtn } from "@/components/ui";
import { IconSearch } from "@/components/Icons";
import type { RiskLevel } from "@/lib/risk";

export default function CustomersPage() {
  const world = getWorld();
  const [q, setQ] = useState("");
  const [profile, setProfile] = useState<"all" | RiskLevel | "flagged">("all");

  const rows = useMemo(() => {
    let recs = [...world.customers.values()];
    const s = q.trim().toLowerCase();
    if (s) {
      recs = recs.filter((r) =>
        r.seed.name.toLowerCase().includes(s) ||
        r.seed.customerId.toLowerCase().includes(s) ||
        r.seed.accountId.toLowerCase().includes(s) ||
        r.seed.city.toLowerCase().includes(s)
      );
    }
    if (profile === "flagged") recs = recs.filter((r) => r.flagged);
    else if (profile !== "all") recs = recs.filter((r) => r.seed.riskProfile === profile);
    return recs.sort((a, b) => (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0));
  }, [world, q, profile]);

  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-xs text-ink-400 mt-0.5">{rows.length} synthetic profiles · behaviour baselines power the agent analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / ID / account / city…" className="input !pl-9 !py-1.5 !text-xs w-72" />
          </div>
          <select value={profile} onChange={(e) => setProfile(e.target.value as typeof profile)} className="input !w-auto !py-1.5 !text-xs">
            <option value="all">All profiles</option>
            <option value="flagged">With suspicious activity</option>
            <option value="low">Low risk profile</option>
            <option value="medium">Medium risk profile</option>
            <option value="high">High risk profile</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <Panel><EmptyState icon="👥" title="No customers match your search." hint="Try a different name, ID or city." /></Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Link key={r.seed.customerId} href={`/customers/${r.seed.customerId}`} className="glass-panel p-4 hover:border-cyanx-500/30 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${r.flagged ? "bg-danger-500/15 text-danger-400 border border-danger-500/30" : "bg-cyanx-500/10 text-cyanx-300 border border-cyanx-500/25"}`}>
                    {r.seed.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-100 group-hover:text-cyanx-300 transition-colors">{r.seed.name}</p>
                    <p className="text-[10px] font-mono text-ink-400">{r.seed.customerId} · {r.seed.accountId}</p>
                  </div>
                </div>
                {r.flagged && <span className="chip bg-danger-500/15 text-danger-400 border border-danger-500/30 !py-0.5">flagged</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div><p className="text-ink-500 uppercase tracking-wider">Normal range</p><p className="text-ink-200 font-semibold mt-0.5">₹{(r.seed.normalAmountMin / 1000).toFixed(0)}K–₹{(r.seed.normalAmountMax / 1000).toFixed(0)}K</p></div>
                <div><p className="text-ink-500 uppercase tracking-wider">History</p><p className="text-ink-200 font-semibold mt-0.5">{r.history.length} txns</p></div>
                <div><p className="text-ink-500 uppercase tracking-wider">Prior alerts</p><p className="text-ink-200 font-semibold mt-0.5">{r.seed.previousAlerts.length}</p></div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <RiskBadge level={r.seed.riskProfile} />
                <span className="text-[10px] text-ink-500 truncate">{r.seed.city} · {r.seed.accountType}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

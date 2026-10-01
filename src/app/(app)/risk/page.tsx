"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { listInvestigations } from "@/lib/investigations";
import { getWorld } from "@/lib/data/store";
import { Panel, RiskGauge, RiskBadge, EmptyState, LinkBtn } from "@/components/ui";

const FACTOR_COLORS: Record<string, string> = {
  unusual_amount: "#F04A4A", new_device: "#F58A2E", new_location: "#FFA94D",
  unusual_time: "#FF6B6B", new_beneficiary: "#F58A2E", rapid_transfers: "#38E1F5",
  historical_alerts: "#94A5C4",
};

export default function RiskPage() {
  const world = getWorld();
  const investigations = listInvestigations();

  const factorTotals = useMemo(() => {
    const totals: Record<string, { label: string; points: number; cases: number }> = {};
    for (const inv of investigations) {
      for (const f of inv.riskAssessment?.factors ?? []) {
        if (!totals[f.key]) totals[f.key] = { label: f.label, points: 0, cases: 0 };
        totals[f.key].points += f.points;
        totals[f.key].cases += 1;
      }
    }
    return Object.entries(totals)
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.points - a.points);
  }, [investigations]);

  const levelCounts = useMemo(() => {
    const c = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const tx of world.txns.values()) c[tx.riskLevel.toUpperCase() as keyof typeof c]++;
    return Object.entries(c).map(([level, count]) => ({ level, count }));
  }, [world]);

  return (
    <div className="space-y-5 animate-fadeUp">
      <div>
        <h1 className="text-xl font-bold">Risk Analysis</h1>
        <p className="text-xs text-ink-400 mt-0.5">Explainable factor weighting across all AI investigations · deterministic scoring model</p>
      </div>

      {investigations.length === 0 ? (
        <Panel>
          <EmptyState
            icon="📊"
            title="No risk assessments yet."
            hint="Risk factors appear after the Risk Agent runs on an investigation."
            action={<LinkBtn href="/lab" variant="solid">Run Full Demo</LinkBtn>}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Risk Factor Contribution" subtitle="Aggregate points contributed by each factor across cases">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={factorTotals} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 30 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#5F729A", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="label" width={110} tick={{ fill: "#94A5C4", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0A111F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="points" name="Risk points" radius={[0, 4, 4, 0]}>
                      {factorTotals.map((f) => (
                        <Cell key={f.key} fill={FACTOR_COLORS[f.key] ?? "#38E1F5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1">
                {factorTotals.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 h-2 rounded-sm" style={{ background: FACTOR_COLORS[f.key] ?? "#38E1F5" }} />
                    <span className="text-ink-200">{f.label}</span>
                    <span className="text-ink-500">— {f.cases} case(s) · {f.points} total pts · max +{f.points > 25 ? Math.round(f.points / f.cases) : f.points}/case</span>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="space-y-5">
              <Panel title="Portfolio Risk Levels" subtitle="All monitored transactions by level">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelCounts} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="level" tick={{ fill: "#5F729A", fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#5F729A", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#0A111F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" name="Transactions" radius={[4, 4, 0, 0]}>
                        {levelCounts.map((l) => (
                          <Cell key={l.level} fill={l.level === "LOW" ? "#22C58A" : l.level === "MEDIUM" ? "#F58A2E" : l.level === "HIGH" ? "#F04A4A" : "#FF3B3B"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Scoring Model" subtitle="How the Risk Agent computes 0–100">
                <div className="space-y-1.5 text-[11px] text-ink-300">
                  {[
                    ["Unusual Amount", "+12…+25 (scales with multiplier)"],
                    ["New Device", "+20"],
                    ["New Location", "+15"],
                    ["Unusual Time", "+15 (night hours weigh more in anomaly severity)"],
                    ["New Beneficiary", "+10"],
                    ["Rapid Transfers", "+6"],
                    ["Historical Alerts", "+5 (if significant)"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
                      <span>{k}</span><span className="font-mono text-ink-200">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-ink-500 mt-3">
                  ≥85 Critical · ≥60 High (human review) · ≥25 Medium (monitor) · else Low. Scores are investigative leads, never fraud determinations.
                </p>
              </Panel>
            </div>
          </div>

          <Panel title="Case Risk Cards" subtitle="Every assessed case with its factor breakdown">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {investigations.map((inv) => (
                <Link key={inv.txnId} href={`/investigate/${inv.txnId}`} className="glass-panel p-4 hover:border-cyanx-500/30 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <RiskGauge score={inv.riskScore} level={inv.riskLevel} size={84} />
                    <div className="text-right">
                      <p className="font-mono text-xs text-cyanx-300">{inv.investigationId}</p>
                      <p className="text-xs text-ink-200 mt-0.5">{inv.customerName}</p>
                      <p className="text-[10px] font-mono text-ink-500">{inv.txnId}</p>
                      <div className="mt-1.5"><RiskBadge level={inv.riskLevel} /></div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1">
                    {inv.riskAssessment?.factors.map((f) => (
                      <span key={f.key} className="chip bg-danger-500/10 text-danger-400 border border-danger-500/20 !py-0.5 !text-[9px]">{f.label} +{f.points}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

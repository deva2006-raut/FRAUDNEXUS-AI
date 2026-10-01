"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { getWorld } from "@/lib/data/store";
import { listInvestigations } from "@/lib/investigations";
import { fmtINR, fmtTime12 } from "@/lib/format";
import { Panel, RiskBadge, StatusBadge, EmptyState, LinkBtn } from "@/components/ui";
import { AgentFlowStatic } from "@/components/AgentFlow";

const COLORS: Record<string, string> = {
  Low: "#22C58A", Medium: "#F58A2E", High: "#F04A4A", Critical: "#FF3B3B",
};

export default function DashboardPage() {
  const world = getWorld();
  const investigations = listInvestigations();

  const kpis = useMemo(() => {
    const txns = [...world.txns.values()];
    const suspicious = world.suspiciousTxns;
    const highRisk = suspicious.filter((t) => t.riskLevel === "high" || t.riskLevel === "critical").length;
    const reviewRequired = investigations.filter((i) => i.status === "open" || i.status === "escalated" || i.status === "more_evidence").length;
    const resolved = investigations.filter((i) => i.status === "safe").length;
    return { total: txns.length, suspicious: suspicious.length, active: investigations.filter((i) => i.status !== "safe").length, highRisk, reviewRequired, resolved };
  }, [world, investigations]);

  // Risk trend: risk-relevant activity per day over the last 30 days
  const trend = useMemo(() => {
    const days: { date: string; alerts: number; risk: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(2026, 8, 30);
      d.setDate(d.getDate() - i);
      days.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, alerts: 0, risk: 0 });
    }
    for (const tx of world.suspiciousTxns) {
      const idx = days.findIndex((x) => x.date === tx.date.slice(8) + "/" + parseInt(tx.date.slice(5, 7), 10));
      if (idx >= 0) { days[idx].alerts += 1; days[idx].risk = Math.max(days[idx].risk, tx.riskScore); }
    }
    days[27].alerts = Math.max(days[27].alerts, 1); days[27].risk = Math.max(days[27].risk, 41);
    days[26].alerts = 1; days[26].risk = 58;
    days[20].alerts = 2; days[20].risk = 63;
    days[12].alerts = 1; days[12].risk = 47;
    days[5].alerts = 1; days[5].risk = 72;
    return days;
  }, [world]);

  const distribution = useMemo(() => {
    const dist = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    for (const tx of world.txns.values()) {
      dist[tx.riskLevel === "low" ? "Low" : tx.riskLevel === "medium" ? "Medium" : tx.riskLevel === "high" ? "High" : "Critical"]++;
    }
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [world]);

  const recent = useMemo(
    () => [...world.suspiciousTxns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [world]
  );

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Investigation Command Dashboard</h1>
          <p className="text-xs text-ink-400 mt-0.5">Live view of suspicious activity, agent operations and case pipeline · <span className="text-warn-400">Synthetic Demo Data</span></p>
        </div>
        <div className="flex gap-2">
          <LinkBtn href="/lab" variant="solid" className="!py-1.5">Run Full Investigation Demo</LinkBtn>
          <LinkBtn href="/transactions" variant="ghost" className="!py-1.5">Transaction Monitor</LinkBtn>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Transactions Monitored", value: kpis.total, accent: "text-cyanx-300", href: "/transactions" },
          { label: "Suspicious Transactions", value: kpis.suspicious, accent: "text-warn-400", href: "/transactions" },
          { label: "Active Investigations", value: kpis.active, accent: "text-cyanx-300", href: "/investigations" },
          { label: "High-Risk Cases", value: kpis.highRisk, accent: "text-danger-400", href: "/transactions" },
          { label: "Human Review Required", value: kpis.reviewRequired, accent: "text-danger-400", href: "/investigations" },
          { label: "Investigations Resolved", value: kpis.resolved, accent: "text-safe-400", href: "/investigations" },
        ].map((k) => (
          <Link key={k.label} href={k.href} className="glass-panel p-4 hover:border-cyanx-500/25 transition-colors group">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">{k.label}</p>
            <p className={`kpi-value mt-1.5 ${k.accent}`}>{k.value}</p>
            <p className="text-[10px] text-ink-500 group-hover:text-cyanx-300 transition-colors mt-1">View →</p>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Risk Trend — Last 30 Days" subtitle="Flagged events and peak daily risk score" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38E1F5" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#38E1F5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#5F729A", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: "#5F729A", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0A111F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="risk" name="Peak risk" stroke="#38E1F5" strokeWidth={2} fill="url(#gRisk)" />
                <Area type="monotone" dataKey="alerts" name="Flagged events" stroke="#F58A2E" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Transaction Risk Distribution" subtitle="All monitored transactions by risk level">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                  {distribution.map((e) => (
                    <Cell key={e.name} fill={COLORS[e.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0A111F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Recent suspicious activity + agent flow */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Recent Suspicious Activity"
          subtitle="Flagged transactions awaiting investigation"
          className="lg:col-span-2"
          action={<LinkBtn href="/transactions" variant="ghost" className="!py-1 !px-3 !text-xs">View all</LinkBtn>}
        >
          {recent.length === 0 ? (
            <EmptyState title="No suspicious transactions found." hint="Run a scenario in the Simulation Lab to generate one." />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="th">Transaction</th><th className="th">Customer</th><th className="th">Amount</th>
                    <th className="th">Time</th><th className="th">Location</th><th className="th">Device</th>
                    <th className="th">Risk</th><th className="th">Status</th><th className="th">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recent.map((tx) => (
                    <tr key={tx.txnId} className="hover:bg-white/[0.03] transition-colors">
                      <td className="td font-mono text-xs text-cyanx-300">{tx.txnId}</td>
                      <td className="td">{world.customers.get(tx.customerId)?.seed.name ?? tx.customerId}</td>
                      <td className="td font-semibold">{fmtINR(tx.amount)}</td>
                      <td className="td text-xs">{tx.date} · {fmtTime12(tx.time)}</td>
                      <td className="td text-xs">{tx.location}</td>
                      <td className="td text-xs max-w-[160px] truncate" title={tx.deviceLabel}>{tx.deviceLabel}</td>
                      <td className="td"><RiskBadge level={tx.riskLevel} score={tx.riskScore} /></td>
                      <td className="td"><StatusBadge status={tx.statusClass} /></td>
                      <td className="td">
                        <LinkBtn href={`/investigate/${tx.txnId}`} variant="primary" className="!px-2.5 !py-1 !text-xs">Investigate</LinkBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Live AI Agent Activity" subtitle="Seven-agent investigation pipeline">
          <AgentFlowStatic />
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
            {[
              { l: "Analyzing", c: "bg-cyanx-400" },
              { l: "Evidence Found", c: "bg-warn-400" },
              { l: "Completed", c: "bg-safe-400" },
              { l: "Waiting", c: "bg-ink-500" },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-2 text-[11px] text-ink-400">
                <span className={`w-1.5 h-1.5 rounded-full ${s.c} ${s.l === "Analyzing" ? "animate-pulse-dot" : ""}`} />
                {s.l}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

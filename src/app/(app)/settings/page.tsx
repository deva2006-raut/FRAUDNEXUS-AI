"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getWorld } from "@/lib/data/store";
import { AGENT_DEFS } from "@/lib/agents/pipeline";
import { Panel, KV, LinkBtn, DemoBadge } from "@/components/ui";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const world = getWorld();
  const [msg, setMsg] = useState<string | null>(null);

  const stats = {
    customers: world.customers.size,
    transactions: world.txns.size,
    suspicious: world.suspiciousTxns.length,
    alerts: world.alerts.length,
    investigations: world.investigations?.size ?? 0,
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 4000); };

  const resetWorld = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-5 animate-fadeUp">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-xs text-ink-400 mt-0.5">Demo identity, dataset statistics and platform configuration</p>
      </div>

      {msg && <div className="glass-panel border-cyanx-500/30 p-3.5 text-xs text-cyanx-300">{msg}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Demo Identity" subtitle="One-click demo mode — no real credentials">
          <KV k="Analyst" v={user?.name ?? "—"} />
          <KV k="Role" v={user?.role ?? "—"} />
          <KV k="Session" v={<span className="font-mono text-[11px]">demo · synthetic data</span>} />
          <div className="flex gap-2 mt-4">
            <button onClick={() => { logout(); router.push("/"); }} className="btn-danger !py-1.5 !text-xs">Sign out</button>
            <button onClick={resetWorld} className="btn-ghost !py-1.5 !text-xs">↺ Reset Demo Data</button>
          </div>
          <p className="text-[10px] text-ink-500 mt-2">Reset reloads the app and rebuilds the synthetic dataset from seed — undoes all injected scenarios.</p>
        </Panel>

        <Panel title="Synthetic Dataset" subtitle="Current in-memory world">
          <KV k="Customers" v={stats.customers} />
          <KV k="Transactions" v={stats.transactions} />
          <KV k="Suspicious transactions" v={stats.suspicious} />
          <KV k="Alerts" v={stats.alerts} />
          <KV k="Investigations" v={stats.investigations} />
          <div className="mt-3"><DemoBadge /></div>
        </Panel>

        <Panel title="Agent Pipeline" subtitle="Deterministic local simulation — no external AI APIs required">
          {AGENT_DEFS.map((d, i) => (
            <KV key={d.id} k={`${i + 1}. ${d.name}`} v={<span className="text-[11px] text-ink-300">{d.role} · ~{d.durationMs}ms</span>} />
          ))}
          <p className="text-[10px] text-ink-500 mt-3">
            The engine is fully deterministic: identical inputs always produce identical findings, evidence and scores — safe for repeatable live demos.
          </p>
        </Panel>

        <Panel title="Risk Model Weights" subtitle="Explainable scoring factors">
          {[
            ["Unusual Amount", "+12…+25"], ["New Device", "+20"], ["New Location", "+15"],
            ["Unusual Time", "+15"], ["New Beneficiary", "+10"], ["Rapid Transfers", "+6"], ["Historical Alerts", "+5"],
          ].map(([k, v]) => <KV key={k} k={k} v={<span className="font-mono text-[11px]">{v}</span>} />)}
          <p className="text-[10px] text-ink-500 mt-3">Thresholds: ≥85 Critical · ≥60 High · ≥25 Medium · else Low. Human review is recommended at ≥60.</p>
        </Panel>
      </div>

      <Panel title="About FRAUDNEXUS AI" subtitle="Hackathon prototype">
        <p className="text-xs text-ink-300 leading-relaxed max-w-3xl">
          <span className="font-semibold text-ink-100">FRAUDNEXUS AI</span> — From Suspicious Transaction to Explainable Investigation.
          An agentic AI platform prototype that investigates suspicious financial activity by correlating transaction history,
          customer behaviour, device signals, location and transaction patterns, producing evidence-backed investigation reports
          and human review recommendations. Core message: <span className="text-cyanx-300 italic">“Don’t just detect the alert. Investigate the story behind it.”</span>
        </p>
        <p className="text-[10px] text-ink-500 mt-3 leading-relaxed">
          FRAUDNEXUS AI is a hackathon prototype using synthetic/demo financial data. It does not make definitive fraud
          determinations and is designed to support human investigation. All customers, accounts, devices, beneficiaries and
          transactions are fictional.
        </p>
        <div className="flex gap-2 mt-4">
          <LinkBtn href="/lab" variant="solid" className="!py-1.5 !text-xs">Simulation Lab</LinkBtn>
          <LinkBtn href="/agents" variant="ghost" className="!py-1.5 !text-xs">AI Agents</LinkBtn>
        </div>
      </Panel>
    </div>
  );
}

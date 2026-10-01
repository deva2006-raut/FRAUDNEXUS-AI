"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SCENARIOS, runScenario, type ScenarioId } from "@/lib/simulation";
import { fmtINR, fmtTime12 } from "@/lib/format";
import { Panel, RiskBadge, LinkBtn, DemoBadge } from "@/components/ui";
import { IconZap } from "@/components/Icons";

const SEV_BORDER: Record<string, string> = {
  low: "border-l-safe-500/60",
  medium: "border-l-cyanx-500/60",
  high: "border-l-warn-500/60",
  critical: "border-l-danger-500/70",
};

export default function SimulationLabPage() {
  const router = useRouter();
  const [running, setRunning] = useState<ScenarioId | null>(null);
  const [result, setResult] = useState<{
    scenario: ScenarioId; customer: string; customerId: string; txnId: string; amount: number; time: string;
    location: string; device: string; beneficiary: string; riskScore: number; riskLevel: "low" | "medium" | "high" | "critical";
    investigationId: string; supporting: number;
  } | null>(null);

  const run = (id: ScenarioId) => {
    setRunning(id);
    // small delay so the button state is visible for the demo
    setTimeout(() => {
      const res = runScenario(id);
      setRunning(null);
      if (!res || !res.investigation) return;
      setResult({
        scenario: id,
        customer: res.customer.name,
        customerId: res.customer.customerId,
        txnId: res.txn.txnId,
        amount: res.txn.amount,
        time: res.txn.time,
        location: res.txn.location,
        device: res.txn.deviceLabel,
        beneficiary: res.txn.beneficiary,
        riskScore: res.investigation.riskScore,
        riskLevel: res.investigation.riskLevel,
        investigationId: res.investigation.investigationId,
        supporting: res.supporting.length,
      });
    }, 350);
  };

  const runFullDemo = () => {
    setRunning("full_demo");
    setTimeout(() => {
      const res = runScenario("full_demo");
      setRunning(null);
      if (res?.investigation) router.push(`/investigate/${res.txn.txnId}`);
    }, 350);
  };

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="glass-panel border-cyanx-500/25 p-5 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyanx-400 animate-pulse-dot" />
              <p className="text-[11px] font-bold tracking-[0.18em] text-cyanx-300">FRAUD SIMULATION LAB</p>
            </div>
            <h1 className="text-xl font-bold mt-2">Generate. Inject. Investigate.</h1>
            <p className="text-xs text-ink-400 mt-1 max-w-2xl">
              Inject synthetic fraud scenarios into the live dataset and watch the seven-agent pipeline investigate them end-to-end.
              Perfect for demonstrating the investigation trail — <span className="text-warn-400">all data is simulated</span>.
            </p>
          </div>
          <button onClick={runFullDemo} disabled={running !== null} className="btn-danger-solid !px-6 !py-3 text-sm shrink-0">
            <IconZap size={16} /> {running === "full_demo" ? "RUNNING FULL DEMO…" : "RUN FULL INVESTIGATION DEMO"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {SCENARIOS.filter((s) => s.id !== "full_demo").map((s) => (
          <div key={s.id} className={`glass-panel p-4 border-l-4 ${SEV_BORDER[s.severity]} flex flex-col`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink-100">{s.title}</p>
              <span className={`chip !py-0.5 !text-[9px] ${s.severity === "critical" ? "bg-danger-500/20 text-danger-400" : s.severity === "high" ? "bg-danger-500/12 text-danger-400" : s.severity === "medium" ? "bg-cyanx-500/12 text-cyanx-300" : "bg-safe-500/12 text-safe-400"}`}>
                {s.severity}
              </span>
            </div>
            <p className="text-[11px] text-ink-400 mt-1.5 flex-1">{s.description}</p>
            <p className="text-[10px] text-cyanx-300/80 mt-2">Expected: {s.expected}</p>
            <button onClick={() => run(s.id)} disabled={running !== null} className="btn-primary !py-1.5 !text-xs mt-3">
              {running === s.id ? "Running…" : "▶ Run Scenario"}
            </button>
          </div>
        ))}
      </div>

      {running && running !== "full_demo" && (
        <Panel><p className="text-xs text-cyanx-300 animate-pulse-dot text-center py-4">Injecting synthetic transaction · running seven-agent investigation · computing explainable risk…</p></Panel>
      )}

      {result && (
        <Panel
          title={`Scenario Result — ${result.scenario.replace(/_/g, " ").toUpperCase()}`}
          subtitle="Investigation completed; open the case to see the full agent pipeline, evidence, graph and report"
          action={<LinkBtn href={`/investigate/${result.txnId}`} variant="solid" className="!py-1.5 !text-xs">Open Investigation →</LinkBtn>}
        >
          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-500">Injected Transaction</p>
              <p className="font-mono text-cyanx-300">{result.txnId}</p>
              <p><span className="text-ink-400">Customer:</span> {result.customer} <span className="font-mono text-ink-500">({result.customerId})</span></p>
              <p><span className="text-ink-400">Amount:</span> <span className="font-semibold">{fmtINR(result.amount)}</span></p>
              <p><span className="text-ink-400">Time:</span> {fmtTime12(result.time)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-500">Signals</p>
              <p><span className="text-ink-400">Location:</span> {result.location}</p>
              <p className="truncate"><span className="text-ink-400">Device:</span> {result.device}</p>
              <p className="truncate"><span className="text-ink-400">Beneficiary:</span> {result.beneficiary}</p>
              {result.supporting > 0 && <p className="text-warn-400">{result.supporting} supporting rapid-transfer transactions injected</p>}
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-500">Outcome</p>
              <div className="flex items-center gap-2">
                <RiskBadge level={result.riskLevel} score={result.riskScore} />
                <span className="font-mono text-[11px] text-ink-400">{result.investigationId}</span>
              </div>
              <p className="text-ink-400">
                {result.riskScore >= 60 ? "Human review recommended — escalate, request evidence or mark safe from the case view." : result.riskScore >= 25 ? "Monitoring advised." : "Consistent with customer profile."}
              </p>
              <Link href={`/customers/${result.customerId}`} className="text-cyanx-300 hover:underline text-[11px]">View customer profile →</Link>
            </div>
          </div>
        </Panel>
      )}

      <Panel title="How the Full Demo Works" subtitle="One click, end to end — suitable for a live hackathon presentation">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-[11px] text-ink-300">
          {[
            "Selects the demo customer (Rahul Sharma, CUST-1001) with his Nagpur / Device A / ₹3K–₹10K daytime baseline",
            "Ensures 20–50 behaviour-faithful historical transactions exist",
            "Injects the flagship suspicious transaction: ₹2,85,000 · 03:12 AM · Mumbai · New Device B · new beneficiary",
            "Runs all seven agents: Transaction → Anomaly → Behaviour → Pattern → Investigation → Risk → Report",
            "Computes the explainable risk score with clickable weighted factors",
            "Builds the evidence board, investigation timeline and interactive entity graph",
            "Generates the structured investigation report with the full evidence trail",
            "Recommends HUMAN REVIEW — the analyst escalates, requests evidence, or resolves as safe",
            "Every alert, notification and KPI updates live during the run",
          ].map((s, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="w-5 h-5 rounded-md bg-cyanx-500/12 border border-cyanx-500/25 text-cyanx-300 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
          <DemoBadge />
          <span className="text-[10px] text-ink-500">The demo never claims confirmed fraud — it recommends human review, always.</span>
        </div>
      </Panel>
    </div>
  );
}

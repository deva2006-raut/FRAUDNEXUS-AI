"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { listInvestigations } from "@/lib/investigations";
import { AGENT_DEFS } from "@/lib/agents/pipeline";
import { Panel, LinkBtn, EmptyState } from "@/components/ui";
import { AgentFlowRunner } from "@/components/AgentFlow";

const AGENT_DETAIL: Record<string, { analyzes: string[]; example: string }> = {
  transaction: {
    analyzes: ["Transaction metadata", "Amount & timestamp", "Location", "Device", "Beneficiary", "Transaction type"],
    example: "Transaction metadata verified.",
  },
  anomaly: {
    analyzes: ["Unusual amount", "Unusual time", "Unusual frequency", "Unusual location", "New device", "New transaction type"],
    example: "Transaction amount is 28× higher than customer's typical transaction range.",
  },
  behaviour: {
    analyzes: ["Historical spending", "Typical transaction times", "Typical locations", "Known devices", "Common beneficiaries", "Previous alerts"],
    example: "Customer normally transacts from Nagpur using Device A during daytime. Current transaction originated from Mumbai using new Device B at 03:12 AM.",
  },
  pattern: {
    analyzes: ["Rapid transfers", "Multiple beneficiaries", "Spending escalation", "New beneficiary followed by large transfer", "Related account activity", "Transaction chains"],
    example: "Multiple high-value transfers routed to a single first-time beneficiary within 90 minutes.",
  },
  investigation: {
    analyzes: ["Investigation timeline", "Evidence trail", "Related transactions", "Related accounts", "Related devices", "Beneficiary relationships"],
    example: "Multiple independent signals correlate with the suspicious transaction.",
  },
  risk: {
    analyzes: ["Weighted risk factors", "Explainable score", "Severity classification", "Review recommendation"],
    example: "91/100 HIGH RISK — Unusual Amount +25, New Device +20, New Location +15, Unusual Time +15, New Beneficiary +10, Rapid Transfers +6.",
  },
  report: {
    analyzes: ["Executive summary", "All agent findings", "Evidence trail", "Timeline", "Human review recommendation"],
    example: "Structured investigation report generated with the full evidence trail.",
  },
};

export default function AgentsPage() {
  const investigations = listInvestigations();
  const [selectedTxn, setSelectedTxn] = useState<string | null>(investigations[0]?.txnId ?? null);
  const selected = investigations.find((i) => i.txnId === selectedTxn) ?? null;

  const stats = useMemo(() => {
    const runs = investigations.length;
    const evidence = investigations.reduce((s, i) => s + i.evidence.length, 0);
    const anomalies = investigations.reduce((s, i) => s + i.anomalies.length, 0);
    return { runs, evidence, anomalies };
  }, [investigations]);

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">AI Agents</h1>
          <p className="text-xs text-ink-400 mt-0.5">Seven specialized agents · deterministic local simulation · {stats.runs} pipeline runs · {stats.evidence} evidence items</p>
        </div>
        <LinkBtn href="/lab" variant="solid" className="!py-1.5">Run Full Demo</LinkBtn>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {AGENT_DEFS.map((d, i) => (
          <div key={d.id} className="glass-panel p-4 hover:border-cyanx-500/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-cyanx-500/12 text-cyanx-300 text-[11px] font-bold flex items-center justify-center border border-cyanx-500/25">{i + 1}</span>
              <p className="text-sm font-semibold text-ink-100">{d.name}</p>
            </div>
            <p className="text-[11px] text-ink-400 mt-1.5">{d.role}</p>
            <div className="mt-2.5 pt-2.5 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">Analyzes</p>
              <div className="flex flex-wrap gap-1">
                {AGENT_DETAIL[d.id]?.analyzes.map((a) => (
                  <span key={a} className="chip bg-white/[0.04] text-ink-300 border border-white/10 !py-0.5 !text-[9px] !normal-case">{a}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Panel title="Watch a Pipeline Run" subtitle="Select an investigation to replay its agent animation with real findings">
        {investigations.length === 0 ? (
          <EmptyState icon="🤖" title="No pipeline runs yet." hint="Start an investigation to watch the agents collaborate." action={<LinkBtn href="/lab" variant="solid">Run Full Demo</LinkBtn>} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {investigations.slice(0, 8).map((inv) => (
                <button
                  key={inv.txnId}
                  onClick={() => setSelectedTxn(inv.txnId)}
                  className={`chip border font-mono ${selectedTxn === inv.txnId ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10"}`}
                >
                  {inv.investigationId} · {inv.txnId}
                </button>
              ))}
            </div>
            {selected && <AgentFlowRunner key={selected.txnId} investigation={selected} />}
          </div>
        )}
      </Panel>

      <Panel title="Pipeline Architecture" subtitle="How findings flow through the agent chain">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 font-mono text-[11px]">
          {AGENT_DEFS.map((d, i) => (
            <span key={d.id} className="flex items-center gap-1.5">
              <span className="px-2.5 py-1.5 rounded-lg bg-navy-800 border border-white/10 text-ink-200">{d.name}</span>
              {i < AGENT_DEFS.length - 1 && <span className="text-cyanx-400/70">→</span>}
            </span>
          ))}
          <span className="ml-3 px-2.5 py-1.5 rounded-lg bg-danger-500/12 border border-danger-500/30 text-danger-400">Human Review</span>
        </div>
        <p className="text-[11px] text-ink-400 mt-3">
          Each agent consumes upstream findings and emits concise, explainable outputs. No hidden chain-of-thought is displayed — only evidence, findings and conclusions.
        </p>
      </Panel>
    </div>
  );
}

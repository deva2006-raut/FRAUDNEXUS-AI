"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorld } from "@/lib/data/store";
import { getInvestigation, startInvestigation, applyHumanAction } from "@/lib/investigations";
import { fmtINR, fmtTime12 } from "@/lib/format";
import { Panel, RiskBadge, RiskGauge, StatusBadge, KV, EmptyState, LinkBtn } from "@/components/ui";
import { AgentFlowRunner } from "@/components/AgentFlow";
import { EvidenceBoard } from "@/components/EvidenceBoard";
import ReportView from "@/components/ReportView";
import InvestigationGraphView from "@/components/InvestigationGraph";

type Tab = "pipeline" | "evidence" | "timeline" | "graph" | "report";

export default function InvestigatePage({ params }: { params: { txnId: string } }) {
  const { txnId } = params;
  const router = useRouter();
  const world = getWorld();
  const tx = world.txns.get(txnId);
  const record = tx ? world.customers.get(tx.customerId) : undefined;
  const [inv, setInv] = useState(() => (tx ? getInvestigation(txnId) ?? null : null));
  const [tab, setTab] = useState<Tab>("pipeline");
  const [factorsOpen, setFactorsOpen] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [tick, setTick] = useState(0);

  const bump = () => setTick((t) => t + 1);

  if (!tx || !record) {
    return (
      <EmptyState
        icon="🔍"
        title="Transaction not found."
        hint={`${txnId} is not in the synthetic dataset.`}
        action={<LinkBtn href="/transactions" variant="ghost">Back to Transaction Monitor</LinkBtn>}
      />
    );
  }

  const seed = record.seed;

  const start = () => {
    const created = startInvestigation(txnId);
    if (created) { setInv(created); setTab("pipeline"); }
  };

  const doAction = (action: "escalate" | "more_evidence" | "safe") => {
    const updated = applyHumanAction(txnId, action, reviewNote || undefined);
    if (updated) { setInv({ ...updated }); bump(); }
  };

  const flagReasons = useMemo(() => {
    const r: string[] = [];
    const maxM = seed.normalAmountMax;
    if (tx.amount > maxM * 2) r.push(`Unusual transaction amount (${fmtINR(tx.amount)} vs max ${fmtINR(maxM)})`);
    if (tx.hour < seed.normalTimeWindow[0] || tx.hour > seed.normalTimeWindow[1]) r.push(`Unusual transaction time (${fmtTime12(tx.time)})`);
    if (!seed.normalLocations.includes(tx.location)) r.push(`New location (${tx.location})`);
    if (!seed.knownDevices.some((d) => d.id === tx.deviceId)) r.push(`New device (${tx.deviceLabel})`);
    if (!seed.commonBeneficiaries.includes(tx.beneficiary)) r.push(`New beneficiary (${tx.beneficiary})`);
    const sameDay = record.history.filter((t) => t.date === tx.date && t.txnId !== tx.txnId);
    if (sameDay.length >= 3) r.push(`Rapid transaction pattern (${sameDay.length + 1} transactions that day)`);
    return r;
  }, [tx, seed, record]);

  const flagTime = useMemo(() => new Date(2026, 8, 30, tx.hour, parseInt(tx.time.split(":")[1], 10)).getTime(), [tx]);

  return (
    <div className="space-y-5 animate-fadeUp" data-tick={tick}>
      {/* Alert header */}
      <div className="glass-panel border-danger-500/30 p-5 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse-dot" />
                <p className="text-[11px] font-bold tracking-[0.18em] text-danger-400">HIGH-RISK TRANSACTION DETECTED</p>
              </div>
              <h1 className="text-2xl font-bold mt-2 tracking-tight">
                <span className="font-mono text-cyanx-300">{tx.txnId}</span> · {fmtINR(tx.amount)}
              </h1>
              <p className="text-xs text-ink-300 mt-1">
                {seed.name} ({seed.accountId}) · {tx.type} · {tx.date} at {fmtTime12(tx.time)} · {tx.location} · {tx.deviceLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!inv ? (
                <button onClick={start} className="btn-danger-solid !px-5 !py-2.5 text-sm">
                  ⚡ START AI INVESTIGATION
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={inv.statusLabel} />
                  <span className="text-[10px] font-mono text-ink-400">{inv.investigationId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs font-semibold text-ink-200 mb-2">Why was this flagged?</p>
            <div className="flex flex-wrap gap-2">
              {flagReasons.map((r) => (
                <span key={r} className="chip bg-danger-500/12 text-danger-400 border border-danger-500/25">⚠ {r}</span>
              ))}
              {flagReasons.length === 0 && <span className="text-xs text-ink-400">No strong deviation signals on this transaction.</span>}
            </div>
          </div>
        </div>
      </div>

      {!inv ? (
        <Panel title="AI Investigation" subtitle="Run the seven-agent pipeline to build the evidence trail">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="text-xs text-ink-300 max-w-xl space-y-1.5">
              <p>Seven specialized agents will analyze this transaction:</p>
              <p className="font-mono text-[11px] text-ink-400">Transaction → Anomaly → Behaviour → Pattern → Investigation → Risk → Report</p>
              <p className="text-ink-400">The pipeline produces an explainable risk score, an evidence board, an investigation graph and a structured report with a human review recommendation.</p>
            </div>
            <button onClick={start} className="btn-danger-solid !px-6 !py-3 shrink-0">⚡ START AI INVESTIGATION</button>
          </div>
        </Panel>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
            {([
              ["pipeline", "Agent Pipeline"],
              ["evidence", `Evidence (${inv.evidence.length})`],
              ["timeline", "Investigation Timeline"],
              ["graph", "Investigation Graph"],
              ["report", "Investigation Report"],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`chip border transition-colors ${tab === id ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10 hover:border-white/20"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "pipeline" && (
            <div className="space-y-5">
              <Panel title="Live Agent Pipeline" subtitle="Deterministic multi-agent simulation — each agent reports concise findings">
                <AgentFlowRunner investigation={inv} onComplete={bump} />
              </Panel>

              {/* Explainable risk */}
              {inv.riskAssessment && (
                <Panel title="Why was this transaction flagged? — Explainable Risk" subtitle="Each factor is clickable and shows its supporting evidence">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <RiskGauge score={inv.riskScore} level={inv.riskLevel} size={148} />
                      <RiskBadge level={inv.riskLevel} className="!text-xs" />
                      <p className="text-[10px] text-ink-400 text-center max-w-[180px]">{inv.riskAssessment.recommendationText}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {inv.riskAssessment.factors.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setFactorsOpen(factorsOpen === f.key ? null : f.key)}
                          className={`w-full text-left rounded-lg border transition-all px-3.5 py-2.5 ${factorsOpen === f.key ? "border-cyanx-500/40 bg-cyanx-500/[0.06]" : "border-white/8 bg-navy-800/50 hover:border-white/20"}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-ink-100">{f.label}</span>
                            <span className="text-[10px] text-ink-400">+{f.points} pts</span>
                            <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden min-w-[60px]">
                              <div className="h-full rounded-full bg-gradient-to-r from-warn-500 to-danger-500 transition-all duration-700" style={{ width: `${Math.min(100, f.points * 4)}%` }} />
                            </div>
                            <span className={`text-[10px] ${factorsOpen === f.key ? "text-cyanx-300" : "text-ink-500"}`}>{factorsOpen === f.key ? "▲ hide evidence" : "▼ show evidence"}</span>
                          </div>
                          {factorsOpen === f.key && (
                            <p className="text-[11px] text-ink-300 mt-2 leading-relaxed animate-fadeUp">{f.detail}</p>
                          )}
                        </button>
                      ))}
                      <p className="text-[10px] text-ink-500 pt-1">Weighted, explainable scoring — this is an investigative lead, not a fraud determination. A human analyst decides the outcome.</p>
                    </div>
                  </div>
                </Panel>
              )}

              {/* Anomalies + patterns summary */}
              <div className="grid gap-5 lg:grid-cols-2">
                <Panel title={`Detected Anomalies (${inv.anomalies.length})`}>
                  {inv.anomalies.length === 0 ? <p className="text-xs text-ink-400">No material anomalies detected.</p> : (
                    <div className="space-y-2">
                      {inv.anomalies.map((a) => (
                        <div key={a.key} className="rounded-lg border border-white/8 bg-navy-800/50 p-3">
                          <div className="flex items-center gap-2">
                            <span className={`chip !py-0.5 ${a.severity === "critical" ? "bg-danger-500/20 text-danger-400" : a.severity === "high" ? "bg-danger-500/12 text-danger-400" : "bg-warn-500/12 text-warn-400"}`}>{a.label}</span>
                            <span className="text-[10px] uppercase text-ink-500">{a.severity}</span>
                          </div>
                          <p className="text-xs text-ink-200 mt-1.5">{a.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
                <Panel title={`Suspicious Patterns (${inv.patterns.length})`}>
                  {inv.patterns.length === 0 ? <p className="text-xs text-ink-400">No cross-transaction patterns detected.</p> : (
                    <div className="space-y-2">
                      {inv.patterns.map((p) => (
                        <div key={p.key} className="rounded-lg border border-white/8 bg-navy-800/50 p-3">
                          <p className="text-xs font-semibold text-warn-400">🔗 {p.title}</p>
                          <p className="text-xs text-ink-200 mt-1.5">{p.detail}</p>
                          <p className="text-[10px] font-mono text-ink-500 mt-1.5">{p.relatedTxnIds.join(" · ")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              {/* Human review panel */}
              <Panel title="Human-in-the-Loop Review" subtitle={inv.humanReview?.aiRecommendation ?? "AI recommendation pending"}>
                <div className={`rounded-lg border p-4 mb-4 ${inv.status === "safe" ? "bg-safe-500/8 border-safe-500/25" : "bg-danger-500/8 border-danger-500/30"}`}>
                  <p className="text-sm font-semibold text-ink-100">{inv.humanReview?.aiRecommendation}</p>
                  <p className="text-[11px] text-ink-400 mt-1">
                    The AI does not declare this transaction to be fraud. Reviewing analyst decides: escalate, request more evidence, or mark safe.
                  </p>
                </div>
                {inv.humanReview?.action ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={inv.statusLabel} />
                      <span className="text-[11px] text-ink-400">Action taken: <span className="text-ink-200 font-semibold">{inv.humanReview.action.replace("_", " ").toUpperCase()}</span> at {inv.humanReview.actionAt}</span>
                    </div>
                    {inv.humanReview.reviewerNote && <p className="text-xs text-ink-300 bg-navy-800/60 border border-white/8 rounded-lg p-3">📝 {inv.humanReview.reviewerNote}</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Reviewer note (optional) — e.g. called customer on registered number, beneficiary unverified…"
                      className="input !text-xs min-h-[64px]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => doAction("escalate")} className="btn-danger-solid !py-2">🚩 Escalate Case</button>
                      <button onClick={() => doAction("more_evidence")} className="btn-primary !py-2">📄 Request More Evidence</button>
                      <button onClick={() => doAction("safe")} className="btn-safe !py-2">✔ Mark as Safe</button>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          )}

          {tab === "evidence" && <EvidenceBoard items={inv.evidence} />}

          {tab === "timeline" && (
            <Panel title="Investigation Timeline" subtitle="Reconstructed event sequence around the flagged transaction">
              <div className="space-y-0">
                {inv.timeline.map((e, i) => (
                  <div key={e.id} className="group flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${e.kind === "transaction" ? "bg-danger-400" : e.kind === "review" ? "bg-warn-400" : "bg-cyanx-400/80"} group-hover:scale-125 transition-transform`} />
                      {i < inv.timeline.length - 1 && <span className="w-px flex-1 bg-white/10 min-h-[24px]" />}
                    </div>
                    <div className="pb-4 group-hover:translate-x-0.5 transition-transform">
                      <p className="text-[11px] font-mono text-cyanx-300">{e.time}</p>
                      <p className="text-xs font-semibold text-ink-100">{e.title}</p>
                      <p className="text-[11px] text-ink-400 max-w-2xl">{e.detail}</p>
                    </div>
                    <span className="ml-auto chip bg-white/[0.04] text-ink-400 !py-0.5 self-start">{e.kind}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {tab === "graph" && <InvestigationGraphView investigation={inv} />}

          {tab === "report" && inv.report && <ReportView report={inv.report} />}
        </>
      )}
    </div>
  );
}

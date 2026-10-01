"use client";

import { useState } from "react";
import Link from "next/link";
import { listInvestigations, applyHumanAction } from "@/lib/investigations";
import { Panel, RiskBadge, StatusBadge, EmptyState, LinkBtn } from "@/components/ui";

export default function InvestigationsPage() {
  const [tick, setTick] = useState(0);
  void tick;
  const investigations = listInvestigations();

  const groups = [
    { label: "Awaiting Human Review", items: investigations.filter((i) => i.status === "open") },
    { label: "Escalated / Evidence Requested", items: investigations.filter((i) => i.status === "escalated" || i.status === "more_evidence") },
    { label: "Resolved", items: investigations.filter((i) => i.status === "safe") },
  ];

  return (
    <div className="space-y-4 animate-fadeUp">
      <div>
        <h1 className="text-xl font-bold">Investigations</h1>
        <p className="text-xs text-ink-400 mt-0.5">{investigations.length} AI investigations · human-in-the-loop decisions update case status</p>
      </div>

      {investigations.length === 0 ? (
        <Panel>
          <EmptyState
            icon="🧠"
            title="No active investigations."
            hint="Start one from the Transaction Monitor or run the Full Investigation Demo in the Simulation Lab."
            action={<LinkBtn href="/lab" variant="solid">Open Simulation Lab</LinkBtn>}
          />
        </Panel>
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <p className="section-title mb-2">{g.label} <span className="text-ink-500">({g.items.length})</span></p>
            {g.items.length === 0 ? (
              <p className="text-xs text-ink-500 px-1 pb-2">None in this state.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((inv) => (
                  <div key={inv.txnId} className="glass-panel p-4 hover:border-cyanx-500/25 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/investigate/${inv.txnId}`} className="font-mono text-sm text-cyanx-300 hover:underline">{inv.investigationId}</Link>
                      <RiskBadge level={inv.riskLevel} score={inv.riskScore} />
                    </div>
                    <p className="text-xs text-ink-200 mt-1.5">{inv.customerName} · <span className="font-mono text-ink-400">{inv.txnId}</span></p>
                    <div className="mt-2"><StatusBadge status={inv.statusLabel} /></div>
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-ink-500">{inv.evidence.length} evidence · {inv.createdAt}</span>
                      <div className="flex gap-1.5">
                        <LinkBtn href={`/investigate/${inv.txnId}`} variant="primary" className="!px-2.5 !py-1 !text-[11px]">Open case</LinkBtn>
                        {inv.status === "open" && (
                          <button onClick={() => { applyHumanAction(inv.txnId, "safe"); setTick((t) => t + 1); }} className="btn-safe !px-2.5 !py-1 !text-[11px]">Mark safe</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

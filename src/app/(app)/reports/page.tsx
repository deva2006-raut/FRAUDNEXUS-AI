"use client";

import { useState } from "react";
import Link from "next/link";
import { listInvestigations } from "@/lib/investigations";
import { Panel, EmptyState, LinkBtn, RiskBadge } from "@/components/ui";
import ReportView from "@/components/ReportView";

export default function ReportsPage() {
  const investigations = listInvestigations();
  const [sel, setSel] = useState<string | null>(investigations[0]?.investigationId ?? null);
  const selected = investigations.find((i) => i.investigationId === sel) ?? null;

  return (
    <div className="space-y-4 animate-fadeUp">
      <div>
        <h1 className="text-xl font-bold">Investigation Reports</h1>
        <p className="text-xs text-ink-400 mt-0.5">
          Structured, evidence-backed reports generated automatically by the Report Agent · print / download / share supported
        </p>
      </div>

      {investigations.length === 0 ? (
        <Panel>
          <EmptyState
            icon="📄"
            title="No investigation reports yet."
            hint="Reports are generated automatically when the seven-agent pipeline completes."
            action={<LinkBtn href="/lab" variant="solid">Run Full Demo</LinkBtn>}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {investigations.map((inv) => (
              <button
                key={inv.investigationId}
                onClick={() => setSel(inv.investigationId)}
                className={`glass-panel p-4 text-left transition-colors ${sel === inv.investigationId ? "border-cyanx-500/40" : "hover:border-white/15"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-cyanx-300">{inv.investigationId}</span>
                  <RiskBadge level={inv.riskLevel} score={inv.riskScore} />
                </div>
                <p className="text-xs text-ink-200 mt-1.5">{inv.customerName}</p>
                <p className="text-[10px] font-mono text-ink-500 mt-0.5">{inv.txnId} · {inv.evidence.length} evidence items</p>
                <p className="text-[10px] text-ink-500 mt-1">{inv.createdAt}</p>
              </button>
            ))}
          </div>

          {selected?.report && <ReportView report={selected.report} />}
        </>
      )}
    </div>
  );
}

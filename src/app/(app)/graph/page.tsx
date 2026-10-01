"use client";

import { useState } from "react";
import { listInvestigations } from "@/lib/investigations";
import { Panel, EmptyState, LinkBtn } from "@/components/ui";
import InvestigationGraphView from "@/components/InvestigationGraph";

export default function GraphPage() {
  const investigations = listInvestigations();
  const [invId, setInvId] = useState<string | null>(investigations[0]?.investigationId ?? null);
  const selected = investigations.find((i) => i.investigationId === invId) ?? null;

  return (
    <div className="space-y-4 animate-fadeUp">
      <div>
        <h1 className="text-xl font-bold">Investigation Graph</h1>
        <p className="text-xs text-ink-400 mt-0.5">Interactive entity relationships built by the agent pipeline · click nodes for details</p>
      </div>

      {investigations.length === 0 ? (
        <Panel>
          <EmptyState
            icon="🕸"
            title="No investigation graph available."
            hint="The graph is constructed from evidence once an investigation runs."
            action={<LinkBtn href="/lab" variant="solid">Run Full Demo</LinkBtn>}
          />
        </Panel>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {investigations.map((inv) => (
              <button
                key={inv.investigationId}
                onClick={() => setInvId(inv.investigationId)}
                className={`chip border font-mono transition-colors ${invId === inv.investigationId ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10 hover:border-white/20"}`}
              >
                {inv.investigationId} · {inv.txnId}
              </button>
            ))}
          </div>
          {selected && <InvestigationGraphView investigation={selected} />}
        </>
      )}
    </div>
  );
}

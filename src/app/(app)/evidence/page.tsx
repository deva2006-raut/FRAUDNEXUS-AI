"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { listInvestigations } from "@/lib/investigations";
import { Panel, EmptyState, LinkBtn } from "@/components/ui";
import { EvidenceCard } from "@/components/EvidenceBoard";

export default function EvidenceCenterPage() {
  const investigations = listInvestigations();
  const [invId, setInvId] = useState<string | null>(investigations[0]?.investigationId ?? null);

  const selected = investigations.find((i) => i.investigationId === invId) ?? null;
  const items = selected?.evidence ?? [];

  const totalByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    for (const inv of investigations) for (const e of inv.evidence) m[e.category] = (m[e.category] ?? 0) + 1;
    return m;
  }, [investigations]);

  return (
    <div className="space-y-4 animate-fadeUp">
      <div>
        <h1 className="text-xl font-bold">Evidence Center</h1>
        <p className="text-xs text-ink-400 mt-0.5">
          {items.length} evidence items in view · {investigations.reduce((s, i) => s + i.evidence.length, 0)} across all cases · every item shows observation + supporting data + risk impact
        </p>
      </div>

      {investigations.length === 0 ? (
        <Panel>
          <EmptyState
            icon="🗂"
            title="No evidence available."
            hint="Run an AI investigation to generate the evidence trail."
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
                {inv.investigationId} · {inv.txnId} ({inv.evidence.length})
              </button>
            ))}
          </div>

          {selected && (
            <Panel
              title={`Evidence — ${selected.investigationId}`}
              subtitle={`${selected.customerName} · ${selected.txnId} · risk ${selected.riskScore}/100`}
              action={<LinkBtn href={`/investigate/${selected.txnId}`} variant="ghost" className="!py-1 !px-3 !text-xs">Open case</LinkBtn>}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((e) => <EvidenceCard key={e.id} item={e} />)}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

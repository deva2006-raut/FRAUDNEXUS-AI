"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/lib/agents/types";
import { EmptyState } from "@/components/ui";

const CATEGORIES: EvidenceItem["category"][] = [
  "Transaction Evidence",
  "Behaviour Evidence",
  "Device Evidence",
  "Location Evidence",
  "Pattern Evidence",
  "Historical Alerts",
];

const CAT_ICON: Record<EvidenceItem["category"], string> = {
  "Transaction Evidence": "💳",
  "Behaviour Evidence": "📈",
  "Device Evidence": "📱",
  "Location Evidence": "📍",
  "Pattern Evidence": "🔗",
  "Historical Alerts": "🔔",
};

const IMPACT_COLOR = (impact: string): string => {
  if (impact.startsWith("+")) return "text-danger-400 border-danger-500/30 bg-danger-500/10";
  return "text-ink-300 border-white/10 bg-white/[0.04]";
};

export function EvidenceCategoryChips({ counts, active, onSelect }: {
  counts: Record<string, number>;
  active: string | null;
  onSelect: (c: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`chip border transition-colors ${active === null ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10 hover:border-white/20"}`}
      >
        All Evidence
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={`chip border transition-colors ${active === c ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10 hover:border-white/20"}`}
        >
          <span>{CAT_ICON[c]}</span> {c}
          {counts[c] ? <span className="ml-1 text-[10px] opacity-70">({counts[c]})</span> : null}
        </button>
      ))}
    </div>
  );
}

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className={`w-full text-left glass-panel p-4 transition-all hover:border-cyanx-500/30 ${open ? "border-cyanx-500/40" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{CAT_ICON[item.category]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-ink-400">{item.id}</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-400">{item.category}</span>
            <span className={`ml-auto chip !px-2 !py-0.5 ${IMPACT_COLOR(item.riskImpact)}`}>{item.riskImpact}</span>
          </div>
          <p className="text-[13px] font-medium text-ink-100 mt-1.5">{item.observation}</p>
          {open && (
            <div className="mt-2.5 pt-2.5 border-t border-white/5 animate-fadeUp space-y-1.5">
              <p className="text-xs text-ink-300"><span className="text-ink-500 font-semibold">Supporting data: </span>{item.supportingData}</p>
              <p className="text-[11px] text-ink-400"><span className="text-ink-500 font-semibold">Source agent: </span>
                <span className="text-cyanx-300 capitalize">{item.sourceAgent} agent</span>
              </p>
              {item.relatedTxnIds && <p className="text-[11px] text-ink-400"><span className="text-ink-500 font-semibold">Related txns: </span><span className="font-mono">{item.relatedTxnIds.join(", ")}</span></p>}
              {item.relatedDeviceIds && <p className="text-[11px] text-ink-400"><span className="text-ink-500 font-semibold">Related devices: </span><span className="font-mono">{item.relatedDeviceIds.join(", ")}</span></p>}
              {item.relatedLocations && <p className="text-[11px] text-ink-400"><span className="text-ink-500 font-semibold">Related locations: </span>{item.relatedLocations.join(", ")}</p>}
              {item.relatedBeneficiaries && <p className="text-[11px] text-ink-400"><span className="text-ink-500 font-semibold">Related beneficiaries: </span>{item.relatedBeneficiaries.join(", ")}</p>}
            </div>
          )}
          {!open && <p className="text-[11px] text-cyanx-300/70 mt-1.5">Click to reveal supporting data →</p>}
        </div>
      </div>
    </button>
  );
}

export function EvidenceBoard({ items }: { items: EvidenceItem[] }) {
  const [cat, setCat] = useState<string | null>(null);
  const counts: Record<string, number> = {};
  for (const e of items) counts[e.category] = (counts[e.category] ?? 0) + 1;
  const filtered = cat ? items.filter((e) => e.category === cat) : items;

  if (items.length === 0) {
    return <EmptyState icon="🗂" title="No evidence available." hint="Evidence is generated when the agent pipeline runs on a suspicious transaction." />;
  }
  return (
    <div className="space-y-3">
      <EvidenceCategoryChips counts={counts} active={cat} onSelect={setCat} />
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((e) => <EvidenceCard key={e.id} item={e} />)}
      </div>
      {filtered.length === 0 && <EmptyState icon="🗂" title={`No ${cat} items in this investigation.`} />}
    </div>
  );
}

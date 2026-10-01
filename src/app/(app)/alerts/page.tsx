"use client";

import { useState } from "react";
import Link from "next/link";
import { getWorld } from "@/lib/data/store";
import { Panel, EmptyState, LinkBtn } from "@/components/ui";

const SEV_STYLE = {
  critical: "bg-danger-500/20 text-danger-400 border-danger-500/50",
  high: "bg-danger-500/12 text-danger-400 border-danger-500/30",
  medium: "bg-warn-500/12 text-warn-400 border-warn-500/30",
  low: "bg-safe-500/12 text-safe-400 border-safe-500/30",
} as const;

export default function AlertsPage() {
  const world = getWorld();
  const [tick, setTick] = useState(0);
  const [sev, setSev] = useState<"all" | keyof typeof SEV_STYLE>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  void tick;

  const alerts = world.alerts;
  const filtered = sev === "all" ? alerts : alerts.filter((a) => a.severity === sev);
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Alert Center</h1>
          <p className="text-xs text-ink-400 mt-0.5">{alerts.length} alerts · {unread} unread · live during investigations · synthetic data</p>
        </div>
        <div className="flex gap-2">
          {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
            <button key={s} onClick={() => setSev(s)} className={`chip border capitalize ${sev === s ? "bg-cyanx-500/15 text-cyanx-300 border-cyanx-500/40" : "bg-white/[0.03] text-ink-300 border-white/10"}`}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel><EmptyState icon="🔔" title="No alerts in this view." hint="New alerts appear here the moment the agents detect something." /></Panel>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => {
            const open = openId === a.alertId;
            const href = a.txnId ? `/investigate/${a.txnId}` : a.customerId ? `/customers/${a.customerId}` : "/dashboard";
            return (
              <div key={a.alertId} className={`glass-panel p-4 border-l-4 transition-all ${SEV_STYLE[a.severity]} ${a.read ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    className="text-left flex-1 min-w-0"
                    onClick={() => { setOpenId(open ? null : a.alertId); if (!a.read) { a.read = true; setTick((t) => t + 1); } }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-ink-200">{a.type}</span>
                      {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse-dot" />}
                      <span className="text-[10px] font-mono text-ink-500">{a.timestamp}</span>
                      <span className="font-mono text-[10px] text-ink-500">{a.alertId}</span>
                    </div>
                    <p className="text-sm font-semibold text-ink-100 mt-1">{a.title}</p>
                    <p className="text-xs text-ink-300 mt-0.5">{open ? a.message : a.message.length > 120 ? a.message.slice(0, 120) + "…" : a.message}</p>
                    {open && (
                      <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-ink-400 space-y-0.5">
                        {a.txnId && <p>Transaction: <span className="font-mono text-cyanx-300">{a.txnId}</span></p>}
                        {a.customerId && <p>Customer: <span className="font-mono text-cyanx-300">{a.customerId}</span></p>}
                        {a.investigationId && <p>Investigation: <span className="font-mono text-cyanx-300">{a.investigationId}</span></p>}
                        <p className="text-cyanx-300/80">Click the action buttons on the right to navigate →</p>
                      </div>
                    )}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <LinkBtn href={href} variant="primary" className="!px-3 !py-1 !text-xs">Open</LinkBtn>
                    {!a.read && (
                      <button onClick={() => { a.read = true; setTick((t) => t + 1); }} className="btn-ghost !px-3 !py-1 !text-xs">Mark read</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

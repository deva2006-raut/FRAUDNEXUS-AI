"use client";

import { useState } from "react";
import { getWorld } from "@/lib/data/store";
import { Panel, EmptyState, LinkBtn } from "@/components/ui";

const SEV_STYLE = {
  critical: "bg-danger-500/18 text-danger-400 border-danger-500/40",
  high: "bg-danger-500/10 text-danger-400 border-danger-500/25",
  medium: "bg-cyanx-500/10 text-cyanx-300 border-cyanx-500/25",
  low: "bg-safe-500/10 text-safe-400 border-safe-500/25",
} as const;

export default function NotificationsPage() {
  const world = getWorld();
  const [tick, setTick] = useState(0);
  void tick;
  const alerts = world.alerts;
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-xs text-ink-400 mt-0.5">{alerts.length} notifications · {unread} unread · agent events stream here live during investigations</p>
        </div>
        {unread > 0 && (
          <button onClick={() => { alerts.forEach((a) => (a.read = true)); setTick((t) => t + 1); }} className="btn-ghost !py-1.5 !text-xs">Mark all as read</button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Panel><EmptyState icon="🔔" title="No notifications yet." hint="Run an investigation and agent events will appear here instantly." action={<LinkBtn href="/lab" variant="solid">Run Full Demo</LinkBtn>} /></Panel>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const href = a.txnId ? `/investigate/${a.txnId}` : a.customerId ? `/customers/${a.customerId}` : "/dashboard";
            return (
              <div key={a.alertId} className={`glass-panel p-4 flex flex-wrap items-center gap-3 ${a.read ? "opacity-55" : ""}`}>
                <span className={`chip border !py-0.5 !text-[9px] ${SEV_STYLE[a.severity]}`}>{a.severity}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink-100">{a.title}</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">{a.message}</p>
                </div>
                <span className="text-[10px] font-mono text-ink-500">{a.timestamp}</span>
                <LinkBtn href={href} variant="ghost" className="!px-3 !py-1 !text-xs">Open</LinkBtn>
                {!a.read && <button onClick={() => { a.read = true; setTick((t) => t + 1); }} className="btn-ghost !px-3 !py-1 !text-xs">Mark read</button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

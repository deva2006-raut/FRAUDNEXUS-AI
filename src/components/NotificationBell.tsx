"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getWorld, type AlertItem } from "@/lib/data/store";
import { IconBell, IconCheck } from "@/components/Icons";

const SEV_STYLE: Record<AlertItem["severity"], string> = {
  low: "border-safe-500/40",
  medium: "border-cyanx-500/40",
  high: "border-warn-500/50",
  critical: "border-danger-500/60",
};
const SEV_DOT: Record<AlertItem["severity"], string> = {
  low: "bg-safe-400",
  medium: "bg-cyanx-400",
  high: "bg-warn-400",
  critical: "bg-danger-500",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000); // poll world for live updates
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const alerts: AlertItem[] = getWorld().alerts;
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="relative" ref={ref} data-tick={tick}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-ink-300 hover:text-ink-100 hover:bg-white/5 border border-white/5"
        aria-label="Notifications"
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] overflow-y-auto glass-panel z-50 animate-fadeUp">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 bg-navy-850/95 backdrop-blur rounded-t-xl">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-[11px] text-ink-400">{unread} unread · updates live during investigations</p>
            </div>
            <button
              onClick={() => {
                alerts.forEach((a) => (a.read = true));
                setTick((x) => x + 1);
              }}
              className="btn-ghost !px-2.5 !py-1 text-xs"
            >
              <IconCheck size={13} /> Mark all read
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-8">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {alerts.slice(0, 30).map((a) => (
                <NotificationRow key={a.alertId} alert={a} onOpen={() => setOpen(false)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ alert, onOpen }: { alert: AlertItem; onOpen: () => void }) {
  const href = alert.txnId
    ? `/investigate/${alert.txnId}`
    : alert.customerId
    ? `/customers/${alert.customerId}`
    : "/alerts";
  return (
    <Link
      href={href}
      onClick={onOpen}
      className={`block px-4 py-3 hover:bg-white/[0.04] border-l-2 ${SEV_STYLE[alert.severity]} ${alert.read ? "opacity-55" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[alert.severity]} ${!alert.read ? "animate-pulse-dot" : ""}`} />
        <span className="text-[10px] font-bold tracking-wider text-ink-300 uppercase">{alert.type}</span>
        <span className="ml-auto text-[10px] text-ink-500 font-mono">{alert.timestamp}</span>
      </div>
      <p className="text-xs text-ink-200 mt-1 font-medium">{alert.title}</p>
      <p className="text-[11px] text-ink-400 mt-0.5 line-clamp-2">{alert.message}</p>
    </Link>
  );
}

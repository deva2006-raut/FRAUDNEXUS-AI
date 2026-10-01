"use client";

import Link from "next/link";
import { fmtCompactINR } from "@/lib/format";
import type { RiskLevel } from "@/lib/risk";

/* ------------------------------- Badges ------------------------------- */

const LEVEL_STYLES: Record<RiskLevel, string> = {
  low: "bg-safe-500/15 text-safe-400 border border-safe-500/30",
  medium: "bg-warn-500/15 text-warn-400 border border-warn-500/30",
  high: "bg-danger-500/15 text-danger-400 border border-danger-500/30",
  critical: "bg-danger-500/25 text-danger-400 border border-danger-500/50",
};

const STATUS_STYLES: Record<string, string> = {
  Normal: "bg-safe-500/12 text-safe-400 border border-safe-500/25",
  Suspicious: "bg-warn-500/15 text-warn-400 border border-warn-500/30",
  "High Risk": "bg-danger-500/15 text-danger-400 border border-danger-500/30",
  Critical: "bg-danger-500/25 text-danger-400 border border-danger-500/50",
  "OPEN — HUMAN REVIEW RECOMMENDED": "bg-danger-500/15 text-danger-400 border border-danger-500/30",
  "ESCALATED TO HUMAN FRAUD TEAM": "bg-danger-500/25 text-danger-400 border border-danger-500/50",
  "RESOLVED — MARKED SAFE BY ANALYST": "bg-safe-500/15 text-safe-400 border border-safe-500/30",
  "MORE EVIDENCE REQUESTED BY ANALYST": "bg-warn-500/15 text-warn-400 border border-warn-500/30",
  "INVESTIGATION RUNNING": "bg-cyanx-500/15 text-cyanx-300 border border-cyanx-500/30",
};

export function RiskBadge({ level, score, className = "" }: { level: RiskLevel; score?: number; className?: string }) {
  const label = level.toUpperCase();
  return (
    <span className={`chip ${LEVEL_STYLES[level]} ${className}`}>
      {score !== undefined && <span className="font-bold tabular-nums">{score}</span>} {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-white/5 text-ink-300 border border-white/10";
  return <span className={`chip ${style}`}>{status}</span>;
}

/* ------------------------------- Panels ------------------------------- */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-panel p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-400 mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`chip bg-warn-500/10 text-warn-400 border border-warn-500/25 ${className}`}>
      ⚠ Synthetic Demo Data — Not Real Financial Data
    </span>
  );
}

export function EmptyState({ icon = "◎", title, hint, action }: { icon?: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-navy-800 border border-white/5 flex items-center justify-center text-xl text-ink-400 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-ink-200">{title}</p>
      {hint && <p className="text-xs text-ink-400 mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------------------- Risk gauge ------------------------------ */

export function RiskGauge({ score, level, size = 128 }: { score: number; level: RiskLevel; size?: number }) {
  const colors: Record<RiskLevel, string> = {
    low: "#22C58A",
    medium: "#F58A2E",
    high: "#F04A4A",
    critical: "#FF3B3B",
  };
  const color = colors[level];
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, score / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#16223A" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[10px] text-ink-400 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

/* --------------------------- Detail rows ------------------------------ */

export function KV({ k, v, mono = false }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-ink-400 shrink-0">{k}</span>
      <span className={`text-sm text-ink-100 text-right ${mono ? "font-mono text-xs" : ""}`}>{v}</span>
    </div>
  );
}

/* --------------------------- Client nav ------------------------------- */

export function LinkBtn({ href, children, variant = "primary", className = "" }: {
  href: string; children: React.ReactNode; variant?: "primary" | "solid" | "ghost" | "danger" | "safe"; className?: string;
}) {
  const cls = variant === "solid" ? "btn-solid" : variant === "ghost" ? "btn-ghost" : variant === "danger" ? "btn-danger" : variant === "safe" ? "btn-safe" : "btn-primary";
  return <Link href={href} className={`${cls} ${className}`}>{children}</Link>;
}

export { fmtCompactINR };

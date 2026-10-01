"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import { DemoBadge } from "@/components/ui";
import {
  IconDashboard, IconTx, IconAlert, IconInvestigation, IconAgents, IconCustomers, IconEvidence,
  IconGraph, IconRisk, IconReports, IconLab, IconSettings, IconShield,
} from "@/components/Icons";

const NAV = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/transactions", label: "Transactions", icon: IconTx },
  { href: "/alerts", label: "Alerts", icon: IconAlert },
  { href: "/investigations", label: "Investigations", icon: IconInvestigation },
  { href: "/agents", label: "AI Agents", icon: IconAgents },
  { href: "/customers", label: "Customers", icon: IconCustomers },
  { href: "/evidence", label: "Evidence Center", icon: IconEvidence },
  { href: "/graph", label: "Investigation Graph", icon: IconGraph },
  { href: "/risk", label: "Risk Analysis", icon: IconRisk },
  { href: "/reports", label: "Reports", icon: IconReports },
  { href: "/lab", label: "Simulation Lab", icon: IconLab },
  { href: "/notifications", page: true, label: "Notifications", icon: IconAlert },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);

  const active = useMemo(
    () =>
      NAV.slice()
        .sort((a, b) => b.href.length - a.href.length)
        .find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)))?.href ?? "/",
    [pathname]
  );

  if (!user) {
    // Should not happen (layout guards), but keep a safe fallback.
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-navy-900/95 border-r border-white/5 flex flex-col transition-transform lg:translate-x-0 lg:static lg:shrink-0 ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/5">
          <span className="w-8 h-8 rounded-lg bg-cyanx-500/15 border border-cyanx-500/40 flex items-center justify-center text-cyanx-300">
            <IconShield size={16} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">FRAUDNEXUS <span className="text-cyanx-300">AI</span></p>
            <p className="text-[9px] text-ink-400 tracking-wider uppercase">Explainable Investigation</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setSideOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive ? "bg-cyanx-500/12 text-cyanx-300 border border-cyanx-500/25" : "text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon size={16} className={isActive ? "text-cyanx-300" : "text-ink-400"} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="glass rounded-lg p-3">
            <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-xs font-semibold text-ink-100">{user.name}</p>
            <p className="text-[10px] text-ink-400">{user.role}</p>
            <button onClick={logout} className="mt-2 text-[11px] text-danger-400 hover:text-danger-500 font-medium">Sign out</button>
          </div>
        </div>
      </aside>

      {sideOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sticky top-0 z-30 bg-navy-950/85 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 lg:px-6">
          <button className="lg:hidden btn-ghost !px-2 !py-1" onClick={() => setSideOpen(true)} aria-label="Menu">☰</button>
          <div className="flex-1 max-w-xl"><GlobalSearch /></div>
          <div className="ml-auto flex items-center gap-2">
            <DemoBadge className="hidden md:inline-flex" />
            <NotificationBell />
            <span className="w-8 h-8 rounded-full bg-cyanx-500/15 border border-cyanx-500/30 text-cyanx-300 text-xs font-bold flex items-center justify-center">
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <footer className="border-t border-white/5 px-6 py-3">
          <p className="text-[10px] text-ink-400 leading-relaxed">
            FRAUDNEXUS AI is a hackathon prototype using synthetic/demo financial data. It does not make definitive fraud determinations and is designed to support human investigation.
          </p>
        </footer>
      </div>
    </div>
  );
}

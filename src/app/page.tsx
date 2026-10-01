"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getWorld } from "@/lib/data/store";
import { DemoBadge } from "@/components/ui";
import { IconShield, IconArrowRight, IconPlay, IconZap } from "@/components/Icons";

export default function Landing() {
  const { user, ready, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const world = getWorld(); // preload synthetic world client-side
  const flagged = world.suspiciousTxns[0];

  const demoLogin = () => {
    login();
    router.push("/dashboard");
  };
  const explore = () => {
    login();
    router.push("/transactions");
  };
  const startInvestigation = () => {
    login();
    if (flagged) router.push(`/investigate/${flagged.txnId}`);
    else router.push("/lab");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-cyanx-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-cyanx-500/15 border border-cyanx-500/40 flex items-center justify-center text-cyanx-300">
              <IconShield size={20} />
            </span>
            <div className="leading-tight">
              <p className="font-bold tracking-wide text-lg">FRAUDNEXUS <span className="text-cyanx-300">AI</span></p>
              <p className="text-[10px] text-ink-400 tracking-wider uppercase">From Suspicious Transaction to Explainable Investigation</p>
            </div>
          </div>
          <DemoBadge />
        </div>

        <div className="text-center max-w-3xl mx-auto animate-fadeUp">
          <span className="chip bg-cyanx-500/10 text-cyanx-300 border border-cyanx-500/25 mb-6">Agentic AI · Financial Crime Investigation</span>
          <h1 className="text-4xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
            Don’t just detect the alert.<br />
            <span className="text-cyanx-300">Investigate the story behind it.</span>
          </h1>
          <p className="mt-6 text-ink-300 text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
            An agentic AI platform that investigates suspicious financial activity by correlating transaction history,
            customer behaviour, device signals, location and transaction patterns — producing an evidence-backed
            investigation report and a human review recommendation.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={demoLogin} className="btn-solid !px-6 !py-3">
              <IconShield size={16} /> Demo Login
            </button>
            <button onClick={explore} className="btn-primary !px-6 !py-3">
              <IconPlay size={14} /> Explore Demo
            </button>
            <button onClick={startInvestigation} className="btn-danger !px-6 !py-3">
              <IconZap size={15} /> Start Investigation
            </button>
          </div>
          <p className="mt-4 text-[11px] text-ink-400">
            One-click demo mode · no credentials required · 30 synthetic customers preloaded
          </p>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            { t: "Seven Specialized Agents", d: "Transaction → Anomaly → Behaviour → Pattern → Investigation → Risk → Report. Each agent contributes concise, explainable findings to the trail.", i: "🤖" },
            { t: "Evidence-Backed Findings", d: "Every risk point is tied to observable evidence — amounts, devices, locations, beneficiaries and correlated transaction chains.", i: "🧾" },
            { t: "Human Stays in the Loop", d: "The AI recommends; a human analyst decides. Escalate, request more evidence, or resolve as safe — the case status updates live.", i: "🧑‍⚖️" },
          ].map((c) => (
            <div key={c.t} className="glass-panel p-5 hover:border-cyanx-500/25 transition-colors">
              <div className="text-2xl mb-3">{c.i}</div>
              <p className="text-sm font-semibold text-ink-100">{c.t}</p>
              <p className="text-xs text-ink-400 mt-1.5 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 glass-panel p-6">
          <p className="section-title mb-4">The Investigation Trail</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-xs font-mono">
            {["Suspicious Transaction", "Evidence Collection", "Behaviour Analysis", "Pattern Correlation", "Risk Assessment", "Explainable Findings", "Human Review", "Investigation Report"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className={`px-2.5 py-1.5 rounded-lg border ${i === 0 ? "bg-danger-500/15 border-danger-500/40 text-danger-400" : i === arr.length - 1 ? "bg-safe-500/10 border-safe-500/30 text-safe-400" : "bg-navy-800 border-white/10 text-ink-200"}`}>
                  {s}
                </span>
                {i < arr.length - 1 && <IconArrowRight size={13} className="text-cyanx-400/70" />}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-[10px] text-ink-500 max-w-2xl mx-auto leading-relaxed">
          FRAUDNEXUS AI is a hackathon prototype using synthetic/demo financial data. It does not make definitive fraud
          determinations and is designed to support human investigation. All customers, accounts, devices and transactions
          shown are fictional.
        </p>
      </div>
    </div>
  );
}

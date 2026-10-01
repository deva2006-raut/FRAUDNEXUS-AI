"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getWorld } from "@/lib/data/store";
import { getInvestigation, startInvestigation } from "@/lib/investigations";
import { generateHistory, injectSuspicious, fmtINR as fmtINRTx } from "@/lib/data/transactions";
import { fmtINR, fmtTime12 } from "@/lib/format";
import { Panel, RiskBadge, StatusBadge, KV, EmptyState, LinkBtn, DemoBadge } from "@/components/ui";
import type { Tx } from "@/lib/data/transactions";

export default function CustomerPage({ params }: { params: { customerId: string } }) {
  const { customerId } = params;
  const router = useRouter();
  const world = getWorld();
  const record = world.customers.get(customerId);
  const [tick, setTick] = useState(0);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  if (!record) {
    return <EmptyState icon="👤" title="Customer not found." hint={`${customerId} is not in the synthetic dataset.`} action={<LinkBtn href="/customers" variant="ghost">Back to Customers</LinkBtn>} />;
  }

  const seed = record.seed;
  const history = record.history;
  const bump = () => setTick((t) => t + 1);

  const amountBuckets = useMemo(() => {
    const buckets = [
      { range: "0–5K", count: 0 }, { range: "5–10K", count: 0 }, { range: "10–25K", count: 0 },
      { range: "25–50K", count: 0 }, { range: "50K–1L", count: 0 }, { range: "1L+", count: 0 },
    ];
    for (const t of history) {
      const a = t.amount;
      if (a <= 5000) buckets[0].count++;
      else if (a <= 10000) buckets[1].count++;
      else if (a <= 25000) buckets[2].count++;
      else if (a <= 50000) buckets[3].count++;
      else if (a <= 100000) buckets[4].count++;
      else buckets[5].count++;
    }
    return buckets;
  }, [history, tick]);

  const regenerate = () => {
    const fresh = generateHistory(seed);
    record.history.length = 0;
    record.history.push(...fresh);
    // re-register txn ids
    for (const t of fresh) world.txns.set(t.txnId, t);
    setGenMsg(`Generated ${fresh.length} synthetic transactions consistent with the customer's behaviour profile.`);
    bump();
    setTimeout(() => setGenMsg(null), 6000);
  };

  const inject = () => {
    const suspicious = injectSuspicious(
      seed, history,
      {
        amount: 285000, hour: 3, minute: 12, location: seed.normalLocations[0] === "Mumbai, MH" ? "Nagpur, MH" : "Mumbai, MH",
        deviceId: "DEV-NEW-C", deviceLabel: "New Device C (Unrecognized)",
        beneficiary: "V.K. Enterprises (New Beneficiary)", type: "IMPS", date: "2026-09-30",
        note: "Injected from customer page demo action",
      },
      `TXN-${1000 + world.txns.size}`
    );
    history.unshift(suspicious);
    world.txns.set(suspicious.txnId, suspicious);
    world.suspiciousTxns.push(suspicious);
    setGenMsg(`Injected suspicious transaction ${suspicious.txnId} — ₹2,85,000 at 03:12 AM on an unrecognized device. Open it to start an AI investigation.`);
    bump();
  };

  const investigateCustomer = () => {
    const flagged = history.find((t) => t.suspicious);
    if (flagged) {
      router.push(`/investigate/${flagged.txnId}`);
    } else {
      inject();
      const flaggedNow = history.find((t) => t.suspicious);
      if (flaggedNow) router.push(`/investigate/${flaggedNow.txnId}`);
    }
  };

  const priorInv = history.map((t) => getInvestigation(t.txnId)).filter(Boolean);

  return (
    <div className="space-y-5 animate-fadeUp" data-tick={tick}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${record.flagged ? "bg-danger-500/15 text-danger-400 border border-danger-500/30" : "bg-cyanx-500/10 text-cyanx-300 border border-cyanx-500/25"}`}>
            {seed.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <div>
            <h1 className="text-xl font-bold">{seed.name}</h1>
            <p className="text-xs text-ink-400 font-mono mt-0.5">{seed.customerId} · {seed.accountId} · {seed.accountType}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <RiskBadge level={seed.riskProfile} />
              <DemoBadge className="!py-0.5 !text-[9px]" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={regenerate} className="btn-primary !py-2">🔄 GENERATE TRANSFER HISTORY</button>
          <button onClick={investigateCustomer} className="btn-danger-solid !py-2">⚡ INVESTIGATE CUSTOMER</button>
        </div>
      </div>

      {genMsg && (
        <div className="glass-panel border-cyanx-500/30 p-3.5 text-xs text-cyanx-300 animate-fadeUp">{genMsg}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Customer Information">
          <KV k="Customer ID" v={seed.customerId} mono />
          <KV k="Name" v={seed.name} />
          <KV k="City" v={seed.city} />
          <KV k="Home location" v={seed.homeLocation} />
          <KV k="Risk profile" v={<RiskBadge level={seed.riskProfile} />} />
          <KV k="Profile note" v={<span className="text-[11px]">{seed.riskProfileNote}</span>} />
        </Panel>
        <Panel title="Account Information">
          <KV k="Account ID" v={seed.accountId} mono />
          <KV k="Type" v={seed.accountType} />
          <KV k="Normal txn range" v={`${fmtINR(seed.normalAmountMin)} – ${fmtINR(seed.normalAmountMax)}`} />
          <KV k="Normal hours" v={`${String(seed.normalTimeWindow[0]).padStart(2, "0")}:00–${String(seed.normalTimeWindow[1]).padStart(2, "0")}:00`} />
          <KV k="Normal locations" v={seed.normalLocations.join(", ")} />
          <KV k="Open alerts" v={seed.openAlerts} />
        </Panel>
        <Panel title="Known Devices & Beneficiaries">
          <p className="text-[10px] uppercase tracking-wider text-ink-500 mb-1.5">Devices</p>
          {seed.knownDevices.map((d) => (
            <KV key={d.id} k={d.label} v={<span className="font-mono text-[11px]">{d.id}</span>} />
          ))}
          <p className="text-[10px] uppercase tracking-wider text-ink-500 mt-3 mb-1.5">Common beneficiaries</p>
          <div className="flex flex-wrap gap-1.5">
            {seed.commonBeneficiaries.map((b) => (
              <span key={b} className="chip bg-white/[0.04] text-ink-300 border border-white/10 !py-0.5 !normal-case">{b}</span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Historical Transaction Amounts" subtitle="Behaviour baseline visible to the agents" className="lg:col-span-1">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountBuckets} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "#5F729A", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#5F729A", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0A111F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Transactions" fill="#38E1F5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Previous Alerts" subtitle="Context available to the Risk Agent">
          {seed.previousAlerts.length === 0 ? (
            <EmptyState icon="🔔" title="No previous alerts." hint="Clean historical record for this customer." />
          ) : (
            <div className="space-y-2">
              {seed.previousAlerts.map((a, i) => (
                <div key={i} className="rounded-lg border border-white/8 bg-navy-800/50 p-3 flex items-center gap-3">
                  <span className={`chip !py-0.5 ${a.severity === "high" ? "bg-danger-500/15 text-danger-400" : a.severity === "medium" ? "bg-warn-500/15 text-warn-400" : "bg-safe-500/12 text-safe-400"}`}>{a.severity}</span>
                  <div>
                    <p className="text-xs text-ink-200">{a.type}</p>
                    <p className="text-[10px] text-ink-500 font-mono">{a.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Current Investigations" subtitle="AI cases involving this customer">
          {priorInv.length === 0 ? (
            <EmptyState icon="🧠" title="No active investigations." hint="Use Investigate Customer to start one." />
          ) : (
            <div className="space-y-2">
              {priorInv.map((inv) => inv && (
                <Link key={inv.txnId} href={`/investigate/${inv.txnId}`} className="block rounded-lg border border-white/8 bg-navy-800/50 p-3 hover:border-cyanx-500/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-cyanx-300">{inv.investigationId}</span>
                    <RiskBadge level={inv.riskLevel} score={inv.riskScore} />
                  </div>
                  <p className="text-[11px] text-ink-400 mt-1">{inv.txnId} · {inv.statusLabel}</p>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Transfer History"
        subtitle={`${history.length} synthetic transactions · behaviour-faithful generation`}
        action={<button onClick={regenerate} className="btn-ghost !py-1 !px-3 !text-xs">🔄 Regenerate</button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5 bg-navy-800/40">
              <th className="th">Txn ID</th><th className="th">Date</th><th className="th">Time</th><th className="th">Amount</th>
              <th className="th">Type</th><th className="th">Location</th><th className="th">Device</th>
              <th className="th">Beneficiary</th><th className="th">Status</th><th className="th">Risk</th><th className="th"></th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {history.slice(0, 60).map((tx) => (
                <tr key={tx.txnId} className={`hover:bg-white/[0.03] transition-colors ${tx.suspicious ? "bg-danger-500/[0.05]" : ""}`}>
                  <td className="td font-mono text-xs text-cyanx-300">{tx.txnId}</td>
                  <td className="td text-xs">{tx.date}</td>
                  <td className="td text-xs">{fmtTime12(tx.time)}</td>
                  <td className="td font-semibold">{fmtINR(tx.amount)}</td>
                  <td className="td text-xs">{tx.type}</td>
                  <td className="td text-xs">{tx.location}</td>
                  <td className="td text-xs max-w-[140px] truncate" title={tx.deviceLabel}>{tx.deviceLabel}</td>
                  <td className="td text-xs max-w-[160px] truncate" title={tx.beneficiary}>{tx.beneficiary}</td>
                  <td className="td text-xs">{tx.status}</td>
                  <td className="td"><RiskBadge level={tx.riskLevel} score={tx.riskScore} /></td>
                  <td className="td">
                    {tx.suspicious && <LinkBtn href={`/investigate/${tx.txnId}`} variant="primary" className="!px-2 !py-0.5 !text-[10px]">Investigate</LinkBtn>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

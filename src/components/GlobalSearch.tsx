"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorld } from "@/lib/data/store";
import { IconSearch } from "@/components/Icons";
import { fmtCompactINR } from "@/lib/format";

interface Hit {
  type: "Transaction" | "Customer" | "Account" | "Investigation" | "Device" | "Beneficiary";
  id: string;
  label: string;
  sub: string;
  href: string;
}

function searchWorld(q: string): Hit[] {
  const world = getWorld();
  const s = q.trim().toLowerCase();
  if (s.length < 2) return [];
  const hits: Hit[] = [];
  const seen = new Set<string>();
  const push = (h: Hit) => {
    const k = `${h.type}:${h.id}`;
    if (!seen.has(k)) { seen.add(k); hits.push(h); }
  };

  // Transactions
  for (const tx of world.txns.values()) {
    if (tx.txnId.toLowerCase().includes(s)) {
      push({
        type: "Transaction", id: tx.txnId,
        label: `${tx.txnId} — ${fmtCompactINR(tx.amount)}`,
        sub: `${tx.customerId} · ${tx.date} ${tx.time} · ${tx.location}`,
        href: tx.suspicious ? `/investigate/${tx.txnId}` : `/transactions?focus=${tx.txnId}`,
      });
      if (hits.length > 12) break;
    }
  }
  // Investigations
  for (const inv of world.investigations?.values() ?? []) {
    if (inv.investigationId.toLowerCase().includes(s) || inv.txnId.toLowerCase().includes(s)) {
      push({
        type: "Investigation", id: inv.investigationId,
        label: `${inv.investigationId} — ${inv.customerName}`,
        sub: `Risk ${inv.riskScore}/100 · ${inv.statusLabel}`,
        href: `/investigate/${inv.txnId}`,
      });
    }
  }
  // Customers / Accounts
  for (const rec of world.customers.values()) {
    if (rec.seed.name.toLowerCase().includes(s) || rec.seed.customerId.toLowerCase().includes(s)) {
      push({ type: "Customer", id: rec.seed.customerId, label: rec.seed.name, sub: `${rec.seed.customerId} · ${rec.seed.city} · ${rec.seed.riskProfile.toUpperCase()} risk profile`, href: `/customers/${rec.seed.customerId}` });
    }
    if (rec.seed.accountId.toLowerCase().includes(s)) {
      push({ type: "Account", id: rec.seed.accountId, label: rec.seed.accountId, sub: `${rec.seed.name} · ${rec.seed.accountType}`, href: `/customers/${rec.seed.customerId}` });
    }
    // Devices
    for (const d of rec.seed.knownDevices) {
      if (d.label.toLowerCase().includes(s) || d.id.toLowerCase().includes(s)) {
        push({ type: "Device", id: d.id, label: d.label, sub: `${rec.seed.name} · ${rec.seed.customerId}`, href: `/customers/${rec.seed.customerId}` });
      }
    }
    // Beneficiaries
    for (const b of rec.seed.commonBeneficiaries) {
      if (b.toLowerCase().includes(s)) {
        push({ type: "Beneficiary", id: b, label: b, sub: `${rec.seed.name} · frequent payee`, href: `/customers/${rec.seed.customerId}` });
      }
    }
  }
  return hits.slice(0, 14);
}

const TYPE_COLOR: Record<Hit["type"], string> = {
  Transaction: "bg-cyanx-500/15 text-cyanx-300",
  Customer: "bg-safe-500/15 text-safe-400",
  Account: "bg-cyanx-500/10 text-cyanx-300",
  Investigation: "bg-danger-500/15 text-danger-400",
  Device: "bg-warn-500/15 text-warn-400",
  Beneficiary: "bg-white/10 text-ink-200",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => searchWorld(q), [q, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    router.push(h.href);
  };

  return (
    <div className="relative w-full max-w-xl" ref={ref}>
      <div className="relative">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits[0]) go(hits[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search TXN-1087, Rahul Sharma, ACC-2041, INV-2026-001, Device…"
          className="input !pl-9 !py-1.5 !text-xs bg-navy-800/60"
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 glass-panel overflow-hidden z-50 animate-fadeUp">
          {hits.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-5">No matches for “{q}”.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
              {hits.map((h) => (
                <button key={`${h.type}:${h.id}`} onClick={() => go(h)} className="w-full text-left px-4 py-2.5 hover:bg-white/[0.05] flex items-center gap-3">
                  <span className={`chip !px-1.5 !py-0.5 !text-[9px] ${TYPE_COLOR[h.type]}`}>{h.type}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-ink-100 truncate">{h.label}</span>
                    <span className="block text-[10px] text-ink-400 truncate">{h.sub}</span>
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-ink-500">{h.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

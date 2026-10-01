"use client";

import { useMemo, useState } from "react";
import { getWorld } from "@/lib/data/store";
import type { Investigation } from "@/lib/agents/types";
import { fmtINR, fmtTime12 } from "@/lib/format";
import { Panel, RiskBadge, EmptyState } from "@/components/ui";

interface GNode {
  id: string;
  label: string;
  sub?: string;
  kind: "customer" | "account" | "txn" | "device" | "location" | "beneficiary" | "alert" | "investigation" | "risk";
  x: number;
  y: number;
  danger?: boolean;
  href?: string;
}
interface GEdge { from: string; to: string; label?: string; danger?: boolean }

const KIND_META: Record<GNode["kind"], { color: string; icon: string; title: string }> = {
  customer: { color: "#38E1F5", icon: "👤", title: "Customer" },
  account: { color: "#7DF3FF", icon: "🏦", title: "Account" },
  txn: { color: "#F04A4A", icon: "💳", title: "Transaction" },
  device: { color: "#F58A2E", icon: "📱", title: "Device" },
  location: { color: "#FFA94D", icon: "📍", title: "Location" },
  beneficiary: { color: "#FF6B6B", icon: "🎯", title: "Beneficiary" },
  alert: { color: "#FFA94D", icon: "🔔", title: "Alert" },
  investigation: { color: "#38E1F5", icon: "🧠", title: "Investigation" },
  risk: { color: "#F04A4A", icon: "⚠", title: "Risk" },
};

function buildGraph(inv: Investigation): { nodes: GNode[]; edges: GEdge[] } {
  const { relatedEntities: re, txnId, customerId, accountId } = inv;
  const world = getWorld();
  const seed = world.customers.get(customerId)?.seed;
  const tx = world.txns.get(txnId);

  const nodes: GNode[] = [];
  const edges: GEdge[] = [];

  nodes.push({ id: customerId, label: seed?.name ?? customerId, sub: "Customer", kind: "customer", x: 50, y: 8, href: `/customers/${customerId}` });
  nodes.push({ id: accountId, label: accountId, sub: `${seed?.accountType ?? ""} Account`, kind: "account", x: 50, y: 24, href: `/customers/${customerId}` });
  edges.push({ from: customerId, to: accountId, label: "holds" });

  nodes.push({ id: `txn:${txnId}`, label: txnId, sub: tx ? `${fmtINR(tx.amount)} · ${fmtTime12(tx.time)}` : "Flagged transaction", kind: "txn", x: 50, y: 42, danger: true });
  edges.push({ from: accountId, to: `txn:${txnId}`, label: "debited by", danger: true });

  // Device / location / beneficiary of the flagged txn
  if (tx) {
    const devId = `dev:${tx.deviceId}`;
    nodes.push({ id: devId, label: tx.deviceLabel, sub: "Device used", kind: "device", x: 20, y: 58, danger: !seed?.knownDevices.some((d) => d.id === tx.deviceId) });
    edges.push({ from: `txn:${txnId}`, to: devId, label: "from device", danger: true });

    const locId = `loc:${tx.location}`;
    nodes.push({ id: locId, label: tx.location, sub: "Origin location", kind: "location", x: 50, y: 58, danger: !seed?.normalLocations.includes(tx.location) });
    edges.push({ from: `txn:${txnId}`, to: locId, label: "originated at", danger: true });

    const benId = `ben:${tx.beneficiary}`;
    nodes.push({ id: benId, label: tx.beneficiary, sub: "Funds received by", kind: "beneficiary", x: 80, y: 58, danger: !seed?.commonBeneficiaries.includes(tx.beneficiary) });
    edges.push({ from: `txn:${txnId}`, to: benId, label: "transferred to", danger: true });
  }

  // Related transactions (pattern correlations)
  const related = re.txnIds.filter((t) => t !== txnId).slice(0, 2);
  related.forEach((rtx, i) => {
    const t = world.txns.get(rtx);
    const id = `txn:${rtx}`;
    nodes.push({ id, label: rtx, sub: t ? `${fmtINR(t.amount)} · ${t.beneficiary}` : "Related transaction", kind: "txn", x: 12 + i * 16, y: 80, danger: true });
    edges.push({ from: `txn:${txnId}`, to: id, label: "correlated", danger: true });
  });

  // Related account / investigation / risk nodes
  nodes.push({ id: `alert:${inv.investigationId}`, label: "High-risk alert", sub: `Alert → ${inv.investigationId}`, kind: "alert", x: 88, y: 80 });
  edges.push({ from: `txn:${txnId}`, to: `alert:${inv.investigationId}`, label: "triggered" });

  nodes.push({ id: `inv:${inv.investigationId}`, label: inv.investigationId, sub: "Investigation record", kind: "investigation", x: 88, y: 8 });
  edges.push({ from: `alert:${inv.investigationId}`, to: `inv:${inv.investigationId}`, label: "opened" });

  nodes.push({ id: `risk:${inv.investigationId}`, label: `${inv.riskScore}/100`, sub: "Explainable risk", kind: "risk", x: 88, y: 30, danger: inv.riskScore >= 60 });
  edges.push({ from: `inv:${inv.investigationId}`, to: `risk:${inv.investigationId}`, label: "assessed" });

  return { nodes, edges };
}

const NODE_W = 128;
const NODE_H = 46;

export function GraphCanvas({ investigation, selectable = true }: { investigation: Investigation; selectable?: boolean }) {
  const { nodes, edges } = useMemo(() => buildGraph(investigation), [investigation]);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const detail = (n: GNode): { title: string; rows: [string, string][] } => {
    const world = getWorld();
    const seed = world.customers.get(investigation.customerId)?.seed;
    switch (n.kind) {
      case "customer":
        return { title: seed?.name ?? n.id, rows: [["Customer ID", seed?.customerId ?? n.id], ["City", seed?.city ?? "—"], ["Risk profile", (seed?.riskProfile ?? "—").toUpperCase()], ["Account type", seed?.accountType ?? "—"]] };
      case "account":
        return { title: n.id, rows: [["Account", seed?.accountId ?? n.id], ["Type", seed?.accountType ?? "—"], ["Normal range", seed ? `₹${seed.normalAmountMin.toLocaleString("en-IN")}–₹${seed.normalAmountMax.toLocaleString("en-IN")}` : "—"], ["Home location", seed?.homeLocation ?? "—"]] };
      case "txn": {
        const tx = world.txns.get(n.id.replace("txn:", ""));
        return tx
          ? { title: tx.txnId, rows: [["Amount", fmtINR(tx.amount)], ["Date/Time", `${tx.date} ${fmtTime12(tx.time)}`], ["Type", tx.type], ["Location", tx.location], ["Device", tx.deviceLabel], ["Beneficiary", tx.beneficiary], ["Risk", `${tx.riskScore}/100 ${tx.riskLevel.toUpperCase()}`]] }
          : { title: n.id, rows: [] };
      }
      case "device":
        return { title: n.label, rows: [["Device ID", n.id.replace("dev:", "")], ["Status", seed?.knownDevices.some((d) => d.id === n.id.replace("dev:", "")) ? "Registered to customer" : "⚠ Unrecognized — never seen before"], ["Used in", investigation.txnId]] };
      case "location":
        return { title: n.label, rows: [["Location", n.label.replace("loc:", "")], ["Status", seed?.normalLocations.includes(n.label.replace("loc:", "")) ? "Within customer profile" : "⚠ Outside customer's location profile"], ["Used in", investigation.txnId]] };
      case "beneficiary":
        return { title: n.label, rows: [["Beneficiary", n.label.replace("ben:", "")], ["Status", seed?.commonBeneficiaries.includes(n.label.replace("ben:", "")) ? "Frequent payee" : "⚠ First-time beneficiary"], ["Received", investigation.txnId]] };
      case "alert":
        return { title: n.label, rows: [["Type", "HIGH-RISK TRANSACTION DETECTED"], ["Linked case", investigation.investigationId], ["Status", investigation.statusLabel]] };
      case "investigation":
        return { title: n.id, rows: [["Investigation", investigation.investigationId], ["Opened", investigation.createdAt], ["Status", investigation.statusLabel], ["Evidence items", String(investigation.evidence.length)]] };
      case "risk":
        return { title: `Risk ${investigation.riskScore}/100`, rows: [["Level", investigation.riskLevel.toUpperCase()], ["Recommendation", investigation.riskAssessment?.recommendationText ?? "—"], ["Factors", investigation.riskAssessment ? `${investigation.riskAssessment.factors.length} weighted factors` : "—"]] };
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="glass-panel p-4 overflow-x-auto cyber-grid rounded-xl">
        <svg viewBox="0 0 100 96" className="w-full min-w-[560px]" style={{ aspectRatio: "100/96" }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10" fill="rgba(148,165,196,0.6)" />
            </marker>
            <marker id="arrowRed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10" fill="rgba(240,74,74,0.7)" />
            </marker>
          </defs>
          {edges.map((e, i) => {
            const a = nodes.find((n) => n.id === e.from);
            const b = nodes.find((n) => n.id === e.to);
            if (!a || !b) return null;
            const x1 = a.x, y1 = (a.y + NODE_H / 2) / 96 * 100 * (96 / 100);
            const y1v = a.y + 2.2;
            const y2v = b.y - 2.4;
            const x2 = b.x;
            void y1; void x1;
            const mx = (a.x + b.x) / 2;
            const active = hover === e.from || hover === e.to || selected?.id === e.from || selected?.id === e.to;
            return (
              <g key={i}>
                <path
                  d={`M ${a.x} ${y1v} C ${mx} ${y1v}, ${mx} ${y2v}, ${b.x} ${y2v}`}
                  fill="none"
                  stroke={e.danger ? "rgba(240,74,74,0.45)" : "rgba(148,165,196,0.3)"}
                  strokeWidth={active ? 0.5 : 0.3}
                  markerEnd={e.danger ? "url(#arrowRed)" : "url(#arrow)"}
                  style={{ transition: "stroke-width 150ms" }}
                />
                {e.label && (
                  <text x={mx} y={(y1v + y2v) / 2 + 1} textAnchor="middle" fill="rgba(148,165,196,0.75)" fontSize={2}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((n) => {
            const meta = KIND_META[n.kind];
            const w = 15, h = 6.4;
            const isSel = selected?.id === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x - w / 2}, ${n.y})`}
                onClick={() => selectable && setSelected(n)}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: selectable ? "pointer" : "default" }}
              >
                <rect
                  width={w} height={h} rx={1.6}
                  fill={n.danger ? "rgba(240,74,74,0.12)" : "rgba(14,22,40,0.92)"}
                  stroke={isSel ? "#38E1F5" : n.danger ? "rgba(240,74,74,0.55)" : "rgba(148,165,196,0.3)"}
                  strokeWidth={isSel ? 0.45 : 0.3}
                />
                <text x={1.4} y={3} fontSize={2.6}>{meta.icon}</text>
                <text x={4.4} y={2.9} fontSize={2.7} fill={n.danger ? "#FF8B8B" : "#E9F0FB"} fontWeight={600}>
                  {n.label.length > 20 ? n.label.slice(0, 19) + "…" : n.label}
                </text>
                <text x={4.4} y={5.2} fontSize={2.1} fill="#5F729A">{(n.sub ?? meta.title).slice(0, 32)}</text>
              </g>
            );
          })}
        </svg>
        <p className="text-[10px] text-ink-500 mt-2 text-center">Click any node to inspect its details · red nodes are part of the suspicious trail</p>
      </div>

      <div>
        <Panel title={selected ? "Node Details" : "Investigation Graph"} subtitle={selected ? selected.sub : "How the AI connected the entities"}>
          {selected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{KIND_META[selected.kind].icon}</span>
                <div>
                  <p className="text-sm font-semibold text-ink-100 break-all">{detail(selected).title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400">{KIND_META[selected.kind].title}</p>
                </div>
              </div>
              <div className="pt-2 space-y-0">
                {detail(selected).rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[11px] text-ink-400 shrink-0">{k}</span>
                    <span className="text-xs text-ink-100 text-right break-all">{v}</span>
                  </div>
                ))}
              </div>
              {selected.href && (
                <a href={selected.href} className="btn-primary !py-1.5 !text-xs w-full mt-2">Open linked page →</a>
              )}
              <button onClick={() => setSelected(null)} className="btn-ghost !py-1 !text-xs w-full">Close details</button>
            </div>
          ) : (
            <div className="text-xs text-ink-400 space-y-2">
              <p>This graph shows how the agent pipeline linked the flagged transaction to the customer, account, device, location, beneficiary and correlated transactions.</p>
              <p>Select a node on the left to see its full details.</p>
              <div className="pt-2 space-y-1.5">
                {Object.entries(KIND_META).map(([k, m]) => (
                  <div key={k} className="flex items-center gap-2 text-[11px]">
                    <span>{m.icon}</span><span className="text-ink-300 capitalize">{k}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function InvestigationGraphView({ investigation }: { investigation: Investigation | null }) {
  if (!investigation) {
    return <EmptyState icon="🕸" title="No investigation graph available." hint="Start an AI investigation to see how entities connect." />;
  }
  return <GraphCanvas investigation={investigation} />;
}

/**
 * FRAUDNEXUS AI — Simulation Lab engine: scenario-based suspicious transaction injection
 * and the one-click "Run Full Investigation Demo" used for live presentations.
 * ⚠️ DEMO SIMULATION — synthetic data only.
 */
import { getWorld, nextAlert } from "./data/store";
import { injectSuspicious, type SuspiciousSpec, type Tx } from "./data/transactions";
import { startInvestigation } from "./investigations";
import type { InvestigationRecord } from "./investigations";
import type { CustomerSeed } from "./data/customers";

export type ScenarioId =
  | "normal"
  | "large"
  | "new_device"
  | "unusual_location"
  | "suspicious_beneficiary"
  | "rapid_pattern"
  | "multi_txn"
  | "full_demo";

export interface ScenarioMeta {
  id: ScenarioId;
  title: string;
  description: string;
  expected: string;
  severity: "low" | "medium" | "high" | "critical";
}

export const SCENARIOS: ScenarioMeta[] = [
  { id: "normal", title: "Normal Transaction", description: "In-profile UPI payment within normal amount, device and hours.", expected: "Low risk score — no action required.", severity: "low" },
  { id: "large", title: "Unusual Large Transaction", description: "High-value transfer far above the customer's normal range.", expected: "Unusual-amount anomaly triggers with a high score.", severity: "high" },
  { id: "new_device", title: "New Device Attack", description: "Transfer initiated from an unrecognized device fingerprint.", expected: "New-device evidence with strong risk weighting.", severity: "high" },
  { id: "unusual_location", title: "Unusual Location", description: "Transaction originates from a city the customer never uses.", expected: "Location deviation flagged by the Behaviour Agent.", severity: "medium" },
  { id: "suspicious_beneficiary", title: "Suspicious Beneficiary", description: "First-time beneficiary immediately receiving a large transfer.", expected: "New-beneficiary + amount anomalies combine.", severity: "high" },
  { id: "rapid_pattern", title: "Rapid Transfer Pattern", description: "Several clustered transfers in a short time window.", expected: "Pattern Agent correlates a rapid-transfer chain.", severity: "high" },
  { id: "multi_txn", title: "Multiple Transaction Attack", description: "High daily velocity — many transactions in one day.", expected: "Frequency anomaly plus pattern correlation.", severity: "medium" },
  { id: "full_demo", title: "Full Fraud Investigation Demo", description: "End-to-end: generate history, inject the flagship ₹2,85,000 case, run all seven agents, build evidence, graph, report and human review.", expected: "91/100-style high risk with full investigation trail.", severity: "critical" },
];

function specFor(scenario: ScenarioId, customer: CustomerSeed): SuspiciousSpec {
  const altCity = customer.normalLocations[0] === "Mumbai, MH" ? "Surat, GJ" : "Mumbai, MH";
  const base: SuspiciousSpec = {
    amount: Math.max(150000, Math.round((customer.normalAmountMax * 25) / 1000) * 1000),
    hour: 3,
    minute: 12,
    location: altCity,
    deviceId: `DEV-NEW-${customer.customerId.slice(-2)}`,
    deviceLabel: "New Device (Unrecognized)",
    beneficiary: "V.K. Enterprises (New Beneficiary)",
    type: "IMPS",
    date: "2026-09-30",
    note: `Simulation Lab scenario: ${scenario}`,
  };
  switch (scenario) {
    case "normal":
      return {
        amount: customer.normalAmountMin + 1500,
        hour: Math.min(20, Math.max(10, customer.normalTimeWindow[0] + 2)),
        minute: 25,
        location: customer.normalLocations[0],
        deviceId: customer.knownDevices[0].id,
        deviceLabel: customer.knownDevices[0].label,
        beneficiary: customer.commonBeneficiaries[0] ?? "Household Vendor",
        type: "UPI",
        date: "2026-09-30",
        note: "Simulation Lab scenario: normal",
      };
    case "large":
      return {
        ...base,
        amount: Math.max(150000, customer.normalAmountMax * 20),
        hour: 21,
        minute: 5,
        location: customer.normalLocations[0],
        deviceId: customer.knownDevices[0].id,
        deviceLabel: customer.knownDevices[0].label,
        beneficiary: customer.commonBeneficiaries[0] ?? "Known Vendor",
        note: "Simulation Lab scenario: large amount",
      };
    case "new_device":
      return {
        ...base,
        amount: Math.max(45000, customer.normalAmountMax * 6),
        hour: 22,
        minute: 41,
        beneficiary: customer.commonBeneficiaries[0] ?? "Known Vendor",
      };
    case "unusual_location":
      return {
        ...base,
        amount: Math.max(30000, customer.normalAmountMax * 4),
        hour: 13,
        minute: 8,
        deviceId: customer.knownDevices[0].id,
        deviceLabel: customer.knownDevices[0].label,
        beneficiary: customer.commonBeneficiaries[0] ?? "Known Vendor",
      };
    case "suspicious_beneficiary":
      return {
        ...base,
        amount: Math.max(80000, customer.normalAmountMax * 12),
        hour: 4,
        minute: 3,
        location: customer.normalLocations[0],
        deviceId: customer.knownDevices[0].id,
        deviceLabel: customer.knownDevices[0].label,
        beneficiary: "Global Trade Links (First-time Beneficiary)",
      };
    case "rapid_pattern":
      return {
        ...base,
        amount: Math.max(25000, customer.normalAmountMax * 3),
        hour: 2,
        minute: 55,
        beneficiary: "QuickCash Wallet (First-time Beneficiary)",
      };
    case "multi_txn":
      return {
        ...base,
        amount: Math.max(20000, customer.normalAmountMax * 2),
        hour: 1,
        minute: 37,
        beneficiary: "Rapid Retail (First-time Beneficiary)",
      };
    case "full_demo":
    default:
      // The flagship spec case exactly as presented: ₹2,85,000 · 03:12 AM · Mumbai · New Device B
      return {
        ...base,
        amount: 285000,
        deviceId: "DEV-NEW-B",
        deviceLabel: "New Device B (Unrecognized)",
        beneficiary: "V.K. Enterprises (New Beneficiary)",
      };
  }
}

/** Extra supporting transactions for rapid/multi scenarios. */
function injectSupporting(scenario: ScenarioId, customer: CustomerSeed, spec: SuspiciousSpec): Tx[] {
  const world = getWorld();
  if (scenario !== "rapid_pattern" && scenario !== "multi_txn") return [];
  const added: Tx[] = [];
  const count = scenario === "rapid_pattern" ? 2 : 5;
  for (let i = 0; i < count; i++) {
    const support = injectSuspicious(
      customer,
      [],
      {
        ...spec,
        amount: Math.round(spec.amount * (scenario === "rapid_pattern" ? 0.06 + i * 0.02 : 0.35)),
        hour: (spec.hour + i) % 24,
        minute: (17 + i * 9) % 60,
        beneficiary: scenario === "rapid_pattern" ? spec.beneficiary : `${spec.beneficiary.split(" (")[0]} #${i + 1}`,
      },
      `TXN-S${String(world.txns.size + i + 1).padStart(4, "0")}`
    );
    world.txns.set(support.txnId, support);
    world.suspiciousTxns.push(support);
    const rec = world.customers.get(customer.customerId);
    if (rec) rec.history.unshift(support);
    added.push(support);
  }
  return added;
}

export interface SimulationResult {
  scenario: ScenarioId;
  customer: CustomerSeed;
  txn: Tx;
  supporting: Tx[];
  investigation: InvestigationRecord | null;
}

/** Run a lab scenario: inject the synthetic transaction and start the AI investigation. */
export function runScenario(scenario: ScenarioId): SimulationResult | null {
  const world = getWorld();
  const demo = world.customers.get("CUST-1001");
  if (!demo) return null;
  let seed: CustomerSeed = demo.seed;
  if (scenario !== "full_demo" && scenario !== "normal") {
    const alt = [...world.customers.values()].find((r) => r.seed.customerId === "CUST-1004");
    if (alt) seed = alt.seed;
  }

  const record = world.customers.get(seed.customerId);
  if (!record) return null;
  const spec = specFor(scenario, seed);
  const txnId = `TXN-${9000 + world.suspiciousTxns.length + 1}`;
  const supporting = injectSupporting(scenario, seed, spec);
  const tx = injectSuspicious(seed, record.history, spec, txnId);
  record.history.unshift(tx);
  world.txns.set(tx.txnId, tx);
  world.suspiciousTxns.push(tx);

  nextAlert(world, {
    type: "SIMULATION SCENARIO INJECTED",
    title: `Scenario "${scenario.replace(/_/g, " ")}" injected`,
    message: `${seed.name}: synthetic transaction ${tx.txnId} of ₹${tx.amount.toLocaleString("en-IN")} at ${tx.time} from ${tx.location}.`,
    severity: "medium",
    timestamp: `${tx.date} ${tx.time}`,
    txnId: tx.txnId,
    customerId: seed.customerId,
  });

  // "normal" is investigated too, so judges can see the low-risk contrast
  const investigation = startInvestigation(tx.txnId);
  return { scenario, customer: seed, txn: tx, supporting, investigation };
}

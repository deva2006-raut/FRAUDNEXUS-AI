/**
 * FRAUDNEXUS AI — Synthetic transaction generation engine.
 * Generates 20–50 behaviour-faithful historical transactions per customer using a
 * deterministic seeded RNG, and can inject a deliberately suspicious transaction
 * that deviates on amount / time / location / device / beneficiary.
 * ⚠️ SYNTHETIC DEMO DATA — NOT REAL FINANCIAL DATA.
 */
import type { CustomerSeed } from "./customers";
import { hashString, levelForScore, mulberry32, txStatusFor, type RiskLevel } from "../risk";

export type TxType = "NEFT" | "UPI" | "IMPS" | "RTGS" | "Card" | "Bill Pay";

export interface Tx {
  txnId: string;
  customerId: string;
  accountId: string;
  amount: number; // INR
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  hour: number;
  type: TxType;
  location: string;
  deviceId: string;
  deviceLabel: string;
  beneficiary: string;
  status: "Success" | "Pending" | "Failed";
  riskScore: number;
  riskLevel: RiskLevel;
  statusClass: "Normal" | "Suspicious" | "High Risk" | "Critical";
  suspicious: boolean;
  note?: string;
}

const TYPES: TxType[] = ["UPI", "UPI", "UPI", "NEFT", "IMPS", "Card", "Bill Pay"];

const pad = (n: number) => String(n).padStart(2, "0");
const fmtINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

/** Amount distribution that clusters near the low end of a customer's normal band. */
function normalAmount(rng: () => number, c: CustomerSeed): number {
  const roll = rng();
  let amt: number;
  if (roll < 0.62) amt = c.normalAmountMin + rng() * (c.normalAmountMax - c.normalAmountMin) * 0.25;
  else if (roll < 0.9) amt = c.normalAmountMin + rng() * (c.normalAmountMax - c.normalAmountMin) * 0.55;
  else amt = c.normalAmountMax * (0.75 + rng() * 0.25);
  return Math.max(120, Math.round(amt / 10) * 10);
}

/** Build a new transaction object with zeroed risk fields (filled in by finishTx). */
function baseTx(c: CustomerSeed, txnId: string): Tx {
  return {
    txnId,
    customerId: c.customerId,
    accountId: c.accountId,
    amount: 0,
    date: "",
    time: "",
    hour: 0,
    type: "UPI",
    location: c.homeLocation,
    deviceId: c.knownDevices[0].id,
    deviceLabel: c.knownDevices[0].label,
    beneficiary: "",
    status: "Success",
    riskScore: 0,
    riskLevel: "low",
    statusClass: "Normal",
    suspicious: false,
  };
}

export function makeTxnId(rng: () => number, used: Set<string>): string {
  let id = "";
  do {
    id = "TXN-" + (1000 + Math.floor(rng() * 9000));
  } while (used.has(id));
  used.add(id);
  return id;
}

/** Generate 20–50 historical transactions that respect the customer's behaviour profile. */
export function generateHistory(c: CustomerSeed, count?: number): Tx[] {
  const rng = mulberry32(hashString(c.customerId));
  const n = count ?? intBetween(rng, 20, 50);
  const used = new Set<string>();
  const txs: Tx[] = [];
  const benPool = [...c.commonBeneficiaries];

  for (let i = 0; i < n; i++) {
    const tx = baseTx(c, makeTxnId(rng, used));
    // dates spread over the last ~7 months, newest first later
    const daysAgo = intBetween(rng, 1, 210);
    const d = new Date(2026, 8, 30); // Sep 30 2026 anchor (demo "today")
    d.setDate(d.getDate() - daysAgo);
    tx.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    // hour inside the customer's normal window
    const [hMin, hMax] = c.normalTimeWindow;
    tx.hour = Math.min(23, intBetween(rng, hMin, hMax));
    tx.time = `${pad(tx.hour)}:${pad(intBetween(rng, 0, 59))}`;
    tx.amount = normalAmount(rng, c);
    tx.type = c.accountType === "Current" ? pick(rng, ["NEFT", "RTGS", "IMPS", "UPI"] as TxType[]) : pick(rng, TYPES);
    tx.location = pick(rng, c.normalLocations);
    const dev = pick(rng, c.knownDevices);
    tx.deviceId = dev.id;
    tx.deviceLabel = dev.label;
    // beneficiaries: mostly known; occasionally a utility-style new one (still normal)
    if (benPool.length > 0 && rng() < 0.85) {
      tx.beneficiary = pick(rng, benPool);
    } else {
      tx.beneficiary = pick(rng, [
        "Municipal Water Board", "Electricity Bill Counter", "DTH Recharge",
        "Mobile Recharge", "Insurance Premium", "Grocery Mart",
      ]);
    }
    tx.status = rng() < 0.97 ? "Success" : rng() < 0.6 ? "Failed" : "Pending";
    txs.push(tx);
  }

  // attach risk metadata (normal transactions stay in the low band)
  for (const tx of txs) finishTx(tx, /*suspicious*/ false, /*scoreOverride*/ undefined);
  txs.sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));
  return txs;
}

function finishTx(tx: Tx, suspicious: boolean, scoreOverride?: number) {
  tx.suspicious = suspicious;
  const score =
    scoreOverride ??
    (tx.status === "Failed" ? 6 + Math.floor(Math.random() * 8) : Math.floor(Math.random() * 22));
  tx.riskScore = score;
  const { level } = levelForScore(score);
  tx.riskLevel = level;
  tx.statusClass = txStatusFor(score);
}

export interface SuspiciousSpec {
  amount: number;
  hour: number;
  minute?: number;
  location: string;
  deviceId: string;
  deviceLabel: string;
  beneficiary: string;
  type?: TxType;
  date?: string;
  note?: string;
}

/** The canonical demo suspicious transaction (₹2,85,000 · 03:12 AM · Mumbai · New Device B). */
export const DEMO_SUSPICIOUS_SPEC: SuspiciousSpec = {
  amount: 285000,
  hour: 3,
  minute: 12,
  location: "Mumbai, MH",
  deviceId: "DEV-NEW-B",
  deviceLabel: "New Device B (Unrecognized)",
  beneficiary: "V.K. Enterprises (New Beneficiary)",
  type: "IMPS",
  date: "2026-09-30",
  note: "Injected demo suspicious transaction",
};

/** Inject a suspicious transaction into a generated history list. */
export function injectSuspicious(c: CustomerSeed, history: Tx[], spec: SuspiciousSpec, txnId: string): Tx {
  const tx = baseTx(c, txnId);
  tx.amount = spec.amount;
  tx.date = spec.date ?? "2026-09-30";
  tx.hour = spec.hour;
  tx.time = `${pad(spec.hour)}:${pad(spec.minute ?? 0)}`;
  tx.type = spec.type ?? "IMPS";
  tx.location = spec.location;
  tx.deviceId = spec.deviceId;
  tx.deviceLabel = spec.deviceLabel;
  tx.beneficiary = spec.beneficiary;
  tx.status = "Success";
  tx.note = spec.note;
  finishTx(tx, true, quickFlagScore(c, tx));
  return tx;
}

/**
 * Small pre-flag "verification" transfer that supports the flagship case narrative.
 * Individually it stays below alert thresholds (looks benign solo) — but the Pattern
 * Agent correlates it with the large transfer that follows (test-then-large chain).
 */
export function makeTestTx(
  c: CustomerSeed,
  spec: SuspiciousSpec,
  txnId: string,
  opts: { amount: number; hour: number; minute: number }
): Tx {
  const tx = baseTx(c, txnId);
  tx.amount = opts.amount;
  tx.date = spec.date ?? "2026-09-30";
  tx.hour = opts.hour;
  tx.time = `${pad(opts.hour)}:${pad(opts.minute)}`;
  tx.type = spec.type ?? "IMPS";
  tx.location = spec.location;
  tx.deviceId = spec.deviceId;
  tx.deviceLabel = spec.deviceLabel;
  tx.beneficiary = spec.beneficiary;
  tx.status = "Success";
  tx.note = "Small verification transfer — not individually alerted; correlated by the Pattern Agent.";
  finishTx(tx, /*suspicious*/ false, /*scoreOverride*/ 14);
  return tx;
}

/** Compute an immediate heuristic flag score for a transaction vs its customer baseline (pre-investigation). */
export function quickFlagScore(c: CustomerSeed, tx: Tx): number {
  let s = 0;
  if (tx.amount > c.normalAmountMax * 2) s += 28;
  if (tx.amount > c.normalAmountMax * 8) s += 14;
  if (!c.normalLocations.includes(tx.location)) s += 16;
  if (!c.knownDevices.some((d) => d.id === tx.deviceId)) s += 18;
  if (tx.hour < c.normalTimeWindow[0] || tx.hour > c.normalTimeWindow[1]) s += 15;
  if (!c.commonBeneficiaries.includes(tx.beneficiary)) s += 12;
  return Math.min(95, s);
}

export { fmtINR };

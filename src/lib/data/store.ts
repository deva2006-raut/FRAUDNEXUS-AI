/**
 * FRAUDNEXUS AI — Entity store wiring customers → accounts → transactions → devices →
 * locations → beneficiaries → alerts → investigations. Preloads the canonical demo case.
 * ⚠️ DEMO SIMULATION — all entities and investigations are synthetic.
 */
import { CUSTOMERS, type CustomerSeed } from "./customers";
import { DEMO_SUSPICIOUS_SPEC, generateHistory, injectSuspicious, quickFlagScore, type Tx } from "./transactions";
import type { InvestigationRecord } from "../investigations";

export interface AlertItem {
  alertId: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  txnId?: string;
  customerId?: string;
  investigationId?: string;
  read: boolean;
}

export interface CustomerRecord {
  seed: CustomerSeed;
  history: Tx[];
  flagged: boolean; // has a suspicious injected transaction
}

export interface World {
  customers: Map<string, CustomerRecord>;
  txns: Map<string, Tx>;
  suspiciousTxns: Tx[];
  alerts: AlertItem[];
  alertSeq: number;
  investigations: Map<string, InvestigationRecord>;
  version: number;
}

function build(): World {
  const customers = new Map<string, CustomerRecord>();
  const txns = new Map<string, Tx>();
  const suspiciousTxns: Tx[] = [];
  let alertSeq = 1;
  const alerts: AlertItem[] = [];

  for (const seed of CUSTOMERS) {
    const history = generateHistory(seed);
    // Preload the canonical demo case for the storyline customer.
    if (seed.customerId === "CUST-1001") {
      const suspicious = injectSuspicious(seed, history, DEMO_SUSPICIOUS_SPEC, "TXN-1087");
      history.unshift(suspicious);
      suspiciousTxns.push(suspicious);
      txns.set(suspicious.txnId, suspicious);
      alerts.push({
        alertId: `ALRT-${String(alertSeq++).padStart(4, "0")}`,
        type: "HIGH-RISK TRANSACTION DETECTED",
        title: "High-risk transaction TXN-1087",
        message:
          "₹2,85,000 IMPS at 03:12 AM from Mumbai, MH via New Device B to V.K. Enterprises (New Beneficiary) — 28× above typical range for Rahul Sharma.",
        severity: "critical",
        timestamp: "2026-09-30 03:12",
        txnId: "TXN-1087",
        customerId: "CUST-1001",
        read: false,
      });
    }
    // A few other customers get a lighter suspicious injection for realism.
    if (seed.customerId === "CUST-1003" || seed.customerId === "CUST-1019") {
      const isGeo = seed.customerId === "CUST-1019";
      const spec = isGeo
        ? { ...DEMO_SUSPICIOUS_SPEC, amount: 62000, hour: 1, minute: 47, location: "Goa, GA", beneficiary: "Sunrise Tours (New Beneficiary)", type: "IMPS" as const, date: "2026-09-27", deviceId: "DEV-NEW-X", deviceLabel: "Unrecognized Device X" }
        : { ...DEMO_SUSPICIOUS_SPEC, amount: 310000, hour: 23, minute: 41, location: "Surat, GJ", beneficiary: "Shree Textiles Impex (New Beneficiary)", type: "RTGS" as const, date: "2026-09-28", deviceId: "DEV-NEW-Y", deviceLabel: "Unrecognized Device Y" };
      const suspicious = injectSuspicious(seed, history, spec, isGeo ? "TXN-1103" : "TXN-1095");
      history.unshift(suspicious);
      suspiciousTxns.push(suspicious);
      txns.set(suspicious.txnId, suspicious);
      alerts.push({
        alertId: `ALRT-${String(alertSeq++).padStart(4, "0")}`,
        type: isGeo ? "BEHAVIOUR DEVIATION DETECTED" : "UNUSUAL AMOUNT DETECTED",
        title: `${isGeo ? "Behaviour deviation" : "Unusual amount"} on ${suspicious.txnId}`,
        message: `${seed.name}: ${fmtQuick(suspicious.amount)} at ${suspicious.time} from ${suspicious.location} on ${suspicious.deviceLabel}.`,
        severity: isGeo ? "high" : "high",
        timestamp: `${suspicious.date} ${suspicious.time}`,
        txnId: suspicious.txnId,
        customerId: seed.customerId,
        read: false,
      });
    }
    for (const tx of history) txns.set(tx.txnId, tx);
    customers.set(seed.customerId, { seed, history, flagged: history.some((t) => t.suspicious) });
  }

  return { customers, txns, suspiciousTxns, alerts, alertSeq: alertSeq + 10, investigations: new Map(), version: 1 };
}

function fmtQuick(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/** Singleton world (module scope — one instance per browser session). */
let WORLD: World | null = null;
export function getWorld(): World {
  if (!WORLD) WORLD = build();
  return WORLD;
}

export function findCustomerRecord(accountIdOrCustomerId: string): CustomerRecord | undefined {
  const w = getWorld();
  return (
    w.customers.get(accountIdOrCustomerId) ??
    [...w.customers.values()].find((r) => r.seed.accountId === accountIdOrCustomerId)
  );
}

export function nextAlert(w: World, a: Omit<AlertItem, "alertId" | "read">): AlertItem {
  const alert: AlertItem = { ...a, alertId: `ALRT-${String(w.alertSeq++).padStart(4, "0")}`, read: false };
  w.alerts.unshift(alert);
  w.version++;
  return alert;
}

export function txFlagScore(seed: CustomerSeed, tx: Tx): number {
  return quickFlagScore(seed, tx);
}

/**
 * FRAUDNEXUS AI — Multi-agent investigation engine (deterministic local simulation).
 * Transaction → Anomaly → Behaviour → Pattern → Investigation → Risk → Report.
 * Rule-based agentic simulation on synthetic data; no external AI calls.
 * ⚠️ DEMO SIMULATION — outputs are investigative leads, never fraud determinations.
 */
import type {
  AgentStep, Anomaly, EvidenceItem, InvestigationReport, PatternFinding,
  PipelineInput, PipelineOutput, TimelineEvent,
} from "./types";
import type { Tx } from "../data/transactions";
import { fmtINR } from "../data/transactions";
import { levelForScore, type RiskFactor } from "../risk";

export interface AgentDef {
  id: AgentStep["id"];
  name: string;
  role: string;
  durationMs: number;
}

export const AGENT_DEFS: AgentDef[] = [
  { id: "transaction", name: "Transaction Agent", role: "Parses & verifies transaction metadata", durationMs: 900 },
  { id: "anomaly", name: "Anomaly Agent", role: "Compares transaction vs historical baseline", durationMs: 1400 },
  { id: "behaviour", name: "Behaviour Agent", role: "Profiles habits, devices & beneficiaries", durationMs: 1300 },
  { id: "pattern", name: "Pattern Agent", role: "Correlates chains across transactions", durationMs: 1600 },
  { id: "investigation", name: "Investigation Agent", role: "Correlates evidence & builds the trail", durationMs: 1500 },
  { id: "risk", name: "Risk Agent", role: "Calculates explainable risk score", durationMs: 1100 },
  { id: "report", name: "Report Agent", role: "Generates the investigation report", durationMs: 1200 },
];

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (h: number, m: number) => `${pad(h)}:${pad(m)}`;
const fmt12 = (h: number, m: number) => {
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(m)} ${suffix}`;
};
function addMinutes(h: number, m: number, delta: number): string {
  const total = ((h * 60 + m + delta) % 1440 + 1440) % 1440;
  return hhmm(Math.floor(total / 60), total % 60);
}
function inWindow(h: number, w: [number, number]): boolean {
  return h >= w[0] && h <= w[1];
}
const nightHour = (h: number) => h >= 0 && h <= 5;

/* ------------------------------- Agents ------------------------------- */

function agentTransaction(input: PipelineInput): { findings: string[] } {
  const { txn } = input;
  return {
    findings: [
      `Transaction ${txn.txnId} · ${txn.type} · ${fmtINR(txn.amount)} · ${txn.date} at ${fmt12(txn.hour, parseInt(txn.time.split(":")[1], 10))}`,
      `Origin location: ${txn.location}`,
      `Device: ${txn.deviceLabel} (${txn.deviceId})`,
      `Beneficiary: ${txn.beneficiary}`,
      `Settlement status: ${txn.status}`,
      "Transaction metadata verified.",
    ],
  };
}

function agentAnomaly(input: PipelineInput): { findings: string[]; anomalies: Anomaly[] } {
  const { customer, txn, history } = input;
  const anomalies: Anomaly[] = [];
  const findings: string[] = [];
  const maxM = customer.normalAmountMax;
  const ratio = txn.amount / maxM;
  const minute = parseInt(txn.time.split(":")[1], 10);

  if (ratio >= 2.5) {
    const mult = ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1);
    anomalies.push({
      key: "unusual_amount",
      label: "Unusual Amount",
      detail: `Transaction amount is ${mult}× higher than customer's typical transaction range (max ${fmtINR(maxM)}).`,
      severity: ratio >= 10 ? "critical" : "high",
    });
  }
  if (!inWindow(txn.hour, customer.normalTimeWindow)) {
    anomalies.push({
      key: "unusual_time",
      label: "Unusual Time",
      detail: `Initiated at ${fmt12(txn.hour, minute)} — outside the customer's usual ${fmt12(customer.normalTimeWindow[0], 0)}–${fmt12(customer.normalTimeWindow[1], 0)} activity window.${nightHour(txn.hour) ? " Night-hour activity is highly atypical for this profile." : ""}`,
      severity: nightHour(txn.hour) ? "high" : "medium",
    });
  }
  if (!customer.normalLocations.includes(txn.location)) {
    anomalies.push({
      key: "new_location",
      label: "New Location",
      detail: `Origin ${txn.location} has never been observed for this customer (known: ${customer.normalLocations.join(", ")}).`,
      severity: "high",
    });
  }
  if (!customer.knownDevices.some((d) => d.id === txn.deviceId)) {
    anomalies.push({
      key: "new_device",
      label: "New Device",
      detail: `Device "${txn.deviceLabel}" is not among the customer's ${customer.knownDevices.length} registered device(s).`,
      severity: "high",
    });
  }
  if (!customer.commonBeneficiaries.includes(txn.beneficiary)) {
    anomalies.push({
      key: "new_beneficiary",
      label: "New Beneficiary",
      detail: `"${txn.beneficiary}" is a first-time beneficiary combined with a high-value transfer.`,
      severity: "medium",
    });
  }
  const sameDay = history.filter((t) => t.date === txn.date && t.txnId !== txn.txnId);
  if (sameDay.length >= 3) {
    anomalies.push({
      key: "unusual_frequency",
      label: "Unusual Frequency",
      detail: `${sameDay.length} other transactions initiated on the same day — above the customer's normal daily velocity.`,
      severity: "medium",
    });
  }
  const typeUsed = history.some((t) => t.type === txn.type);
  if (!typeUsed && history.length >= 5) {
    anomalies.push({
      key: "unusual_type",
      label: "Unusual Transaction Type",
      detail: `${txn.type} channel has not been used historically by this customer.`,
      severity: "medium",
    });
  }

  for (const a of anomalies) findings.push(`${a.label}: ${a.detail}`);
  if (anomalies.length === 0) findings.push("No material deviation from historical baseline detected.");
  return { findings, anomalies };
}

function agentBehaviour(input: PipelineInput): { findings: string[] } {
  const { customer, txn, history } = input;
  const amounts = history.map((t) => t.amount);
  const avg = amounts.length ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length) : 0;
  const [w0, w1] = customer.normalTimeWindow;
  const findings: string[] = [
    `Historical spending across ${history.length} transactions: ${fmtINR(customer.normalAmountMin)}–${fmtINR(customer.normalAmountMax)} (avg ${fmtINR(avg)}).`,
    `Typical activity window: ${fmt12(w0, 0)}–${fmt12(w1, 0)} (${customer.normalTimeWindow[1] - customer.normalTimeWindow[0]}h span).`,
    `Typical locations: ${customer.normalLocations.join(" · ")}.`,
    `Known devices: ${customer.knownDevices.map((d) => d.label).join(" · ")}.`,
    `Frequent beneficiaries: ${customer.commonBeneficiaries.slice(0, 4).join(", ")}${customer.commonBeneficiaries.length > 4 ? "…" : ""}.`,
    customer.previousAlerts.length > 0
      ? `${customer.previousAlerts.length} previous alert(s) on record — latest: ${customer.previousAlerts[0].type} (${customer.previousAlerts[0].severity}).`
      : "No previous alerts on record.",
    `Customer normally transacts from ${customer.normalLocations[0]} using ${customer.knownDevices[0].label} during ${w0 >= 6 && w1 <= 22 ? "daytime" : `hours ${w0}:00–${w1}:00`}. Current transaction originated from ${txn.location} using ${txn.deviceLabel} at ${fmt12(txn.hour, parseInt(txn.time.split(":")[1], 10))}.`,
  ];
  return { findings };
}

function agentPattern(input: PipelineInput): { findings: string[]; patterns: PatternFinding[]; related: Tx[] } {
  const { customer, txn, history } = input;
  const patterns: PatternFinding[] = [];
  const minute = parseInt(txn.time.split(":")[1], 10);

  // Cluster: transactions on the same date within ±90 minutes of the flagged txn.
  const toMin = (t: string) => parseInt(t.split(":")[0], 10) * 60 + parseInt(t.split(":")[1], 10);
  const cluster = history.filter(
    (t) => t.date === txn.date && t.txnId !== txn.txnId && Math.abs(toMin(t.time) - (txn.hour * 60 + minute)) <= 90
  );
  const related = [...cluster];

  if (cluster.length > 0) {
    const total = cluster.reduce((s, t) => s + t.amount, 0) + txn.amount;
    const times = [...cluster.map((t) => t.time), txn.time].sort();
    patterns.push({
      key: "rapid_transfers",
      title: "Rapid Transfer Pattern",
      detail: `${cluster.length + 1} transactions totalling ${fmtINR(total)} moved within ${times[0]}–${times[times.length - 1]} (${cluster.length + 1} transfers in ~90 minutes).`,
      relatedTxnIds: [txn.txnId, ...cluster.map((t) => t.txnId)],
    });
    const newBens = new Set(cluster.filter((t) => !customer.commonBeneficiaries.includes(t.beneficiary)).map((t) => t.beneficiary));
    newBens.add(txn.beneficiary);
    if (newBens.size === 1) {
      patterns.push({
        key: "single_new_beneficiary",
        title: "Beneficiary Concentration",
        detail: `Multiple high-value transfers routed to a single first-time beneficiary: ${[...newBens][0]}.`,
        relatedTxnIds: [txn.txnId, ...cluster.map((t) => t.txnId)],
      });
    }
    const smallFirst = cluster.find((t) => t.amount < txn.amount * 0.05 && !customer.commonBeneficiaries.includes(t.beneficiary));
    if (smallFirst) {
      patterns.push({
        key: "test_then_large",
        title: "New Beneficiary Followed by Large Transfer",
        detail: `${fmtINR(smallFirst.amount)} test transfer to ${smallFirst.beneficiary} at ${smallFirst.time} was followed by ${fmtINR(txn.amount)} at ${txn.time} — a classic beneficiary-verification sequence.`,
        relatedTxnIds: [smallFirst.txnId, txn.txnId],
      });
    }
  } else {
    // Velocity check across history even without a same-day cluster
    const recent = history.slice(0, 5);
    patterns.push({
      key: "spending_escalation",
      title: "Sudden Spending Escalation",
      detail: `Flagged transaction is ${Math.max(1, Math.round(txn.amount / Math.max(1, customer.normalAmountMax)))}× the customer's typical maximum with no gradual build-up in the preceding ${recent.length} transactions.`,
      relatedTxnIds: [txn.txnId],
    });
  }

  const findings = patterns.map((p) => `${p.title}: ${p.detail}`);
  if (patterns.length === 0) findings.push("No cross-transaction correlation detected in recent history.");
  return { findings, patterns, related };
}

function agentInvestigation(input: PipelineInput, anomalies: Anomaly[], patterns: PatternFinding[], related: Tx[]) {
  const { customer, txn } = input;
  const relatedEntities = {
    accounts: [customer.accountId],
    devices: customer.knownDevices.map((d) => d.id).concat(customer.knownDevices.some((d) => d.id === txn.deviceId) ? [] : [txn.deviceId]),
    locations: [...new Set([...customer.normalLocations, txn.location])],
    beneficiaries: [...new Set([...customer.commonBeneficiaries.slice(0, 3), txn.beneficiary])],
    txnIds: [txn.txnId, ...related.map((t) => t.txnId)],
  };
  const findings = [
    `${anomalies.length} independent anomaly signal(s) and ${patterns.length} pattern correlation(s) collected.`,
    "Multiple independent signals correlate with the suspicious transaction.",
    `Related accounts: ${relatedEntities.accounts.join(", ")}.`,
    `Related devices: ${relatedEntities.devices.join(", ")}.`,
    `Related locations: ${relatedEntities.locations.join(", ")}.`,
    `Beneficiary relationships mapped: ${txn.beneficiary} → ${customer.accountId}.`,
    `Evidence trail assembled across ${relatedEntities.txnIds.length} transaction(s).`,
  ];
  return { findings, relatedEntities };
}

function agentRisk(input: PipelineInput, anomalies: Anomaly[], patterns: PatternFinding[]) {
  const { customer, txn } = input;
  const factors: RiskFactor[] = [];
  const has = (k: string) => anomalies.some((a) => a.key === k);
  const minute = parseInt(txn.time.split(":")[1], 10);
  const ratio = txn.amount / customer.normalAmountMax;

  if (has("unusual_amount")) {
    const pts = ratio >= 8 ? 25 : ratio >= 4 ? 18 : 12;
    factors.push({ key: "unusual_amount", label: "Unusual Amount", points: pts, detail: `${fmtINR(txn.amount)} is ${Math.round(ratio)}× the customer's typical maximum (${fmtINR(customer.normalAmountMax)}).` });
  }
  if (has("new_device")) factors.push({ key: "new_device", label: "New Device", points: 20, detail: `Unrecognized device "${txn.deviceLabel}" used for a high-value transfer.` });
  if (has("new_location")) factors.push({ key: "new_location", label: "New Location", points: 15, detail: `Origin ${txn.location} outside the customer's location profile (${customer.normalLocations.join(", ")}).` });
  if (has("unusual_time")) factors.push({ key: "unusual_time", label: "Unusual Time", points: 15, detail: `${fmt12(txn.hour, minute)} is outside the usual ${pad(customer.normalTimeWindow[0])}:00–${pad(customer.normalTimeWindow[1])}:00 window.` });
  if (has("new_beneficiary")) factors.push({ key: "new_beneficiary", label: "New Beneficiary", points: 10, detail: `First-time beneficiary "${txn.beneficiary}" receiving this transfer.` });
  if (patterns.some((p) => p.key === "rapid_transfers")) factors.push({ key: "rapid_transfers", label: "Rapid Transfers", points: 6, detail: "Multiple transfers clustered within a short window (pattern correlation)." });
  const priorSignificant = customer.previousAlerts.some((a) => a.severity === "medium" || a.severity === "high");
  if (priorSignificant) factors.push({ key: "historical_alerts", label: "Historical Alerts", points: 5, detail: `${customer.previousAlerts.length} significant alert(s) in the customer's history.` });

  const score = Math.min(99, factors.reduce((s, f) => s + f.points, 0));
  const { level, label } = levelForScore(score);
  const recommendation: "no_action" | "monitor" | "human_review" =
    score >= 60 ? "human_review" : score >= 25 ? "monitor" : "no_action";
  const recommendationText =
    recommendation === "human_review"
      ? "HIGH-RISK SUSPICIOUS ACTIVITY DETECTED. HUMAN REVIEW RECOMMENDED."
      : recommendation === "monitor"
      ? "MEDIUM-RISK ANOMALY DETECTED. CONTINUED MONITORING ADVISED."
      : "BEHAVIOUR CONSISTENT WITH CUSTOMER PROFILE. NO ACTION REQUIRED.";

  return {
    findings: [
      `Explainable risk score computed from ${factors.length} weighted factor(s): ${score}/100.`,
      `${label} — ${recommendationText}`,
      "This is an investigative lead, not a fraud determination. Human review decides the final case outcome.",
    ],
    riskAssessment: { score, level, label, factors, recommendation, recommendationText },
  };
}

function buildTimeline(input: PipelineInput, patterns: PatternFinding[]): TimelineEvent[] {
  const { txn } = input;
  const minute = parseInt(txn.time.split(":")[1], 10);
  const events: TimelineEvent[] = [
    { id: "t-device", time: addMinutes(txn.hour, minute, -14), title: "New device login", detail: `${txn.deviceLabel} (${txn.deviceId}) authenticated for the first time on this account.`, kind: "device" },
    { id: "t-beneficiary", time: addMinutes(txn.hour, minute, -8), title: "New beneficiary activity", detail: `First interaction with ${txn.beneficiary} recorded.`, kind: "beneficiary" },
    { id: "t-txn", time: txn.time, title: `${fmtINR(txn.amount)} transaction (${txn.txnId})`, detail: `${txn.type} transfer initiated from ${txn.location}.`, kind: "transaction" },
  ];
  if (patterns.some((p) => p.key === "rapid_transfers")) {
    events.push({ id: "t-pattern", time: addMinutes(txn.hour, minute, 1), title: "Rapid transfer detected", detail: "Pattern Agent correlated clustered transfers in the same window.", kind: "pattern" });
  }
  events.push(
    { id: "t-investigation", time: addMinutes(txn.hour, minute, 2), title: "AI investigation started", detail: "Seven-agent investigation pipeline initiated on the flagged transaction.", kind: "system" },
    { id: "t-risk", time: addMinutes(txn.hour, minute, 3), title: "Risk calculated", detail: "Explainable risk score computed with weighted factors.", kind: "risk" },
    { id: "t-review", time: addMinutes(txn.hour, minute, 4), title: "Human review recommended", detail: "Case routed to the human review queue with the full evidence trail.", kind: "review" }
  );
  return events;
}

function buildEvidence(input: PipelineInput, anomalies: Anomaly[], patterns: PatternFinding[], risk: ReturnType<typeof agentRisk>, related: Tx[]): EvidenceItem[] {
  const { customer, txn } = input;
  const ev: EvidenceItem[] = [];
  const push = (e: Omit<EvidenceItem, "id">) => ev.push({ id: `EV-${(ev.length + 1).toString().padStart(3, "0")}`, ...e });
  const pts = (k: string) => risk.riskAssessment.factors.find((f) => f.key === k)?.points ?? 0;
  const minute = parseInt(txn.time.split(":")[1], 10);

  if (pts("unusual_amount") > 0)
    push({
      category: "Transaction Evidence",
      observation: "Transaction amount is significantly above the customer's historical range.",
      supportingData: `${fmtINR(txn.amount)} vs typical ${fmtINR(customer.normalAmountMin)}–${fmtINR(customer.normalAmountMax)} across ${input.history.length} historical transactions.`,
      riskImpact: `+${pts("unusual_amount")} risk points`,
      sourceAgent: "anomaly",
      relatedTxnIds: [txn.txnId],
    });
  if (pts("unusual_time") > 0)
    push({
      category: "Behaviour Evidence",
      observation: `Initiated at ${fmt12(txn.hour, minute)} — outside the customer's normal activity window.`,
      supportingData: `Normal window ${pad(customer.normalTimeWindow[0])}:00–${pad(customer.normalTimeWindow[1])}:00 local time; ${(input.history.filter((t) => t.hour >= customer.normalTimeWindow[0] && t.hour <= customer.normalTimeWindow[1]).length / Math.max(1, input.history.length) * 100).toFixed(0)}% of history in-window.`,
      riskImpact: `+${pts("unusual_time")} risk points`,
      sourceAgent: "behaviour",
      relatedTxnIds: [txn.txnId],
    });
  if (pts("new_device") > 0)
    push({
      category: "Device Evidence",
      observation: "Transaction initiated from an unrecognized device never seen on this account.",
      supportingData: `${txn.deviceLabel} (${txn.deviceId}) — registered devices: ${customer.knownDevices.map((d) => d.label).join("; ")}.`,
      riskImpact: `+${pts("new_device")} risk points`,
      sourceAgent: "anomaly",
      relatedDeviceIds: [txn.deviceId],
    });
  if (pts("new_location") > 0)
    push({
      category: "Location Evidence",
      observation: "Geographic origin deviates from the customer's location profile.",
      supportingData: `${txn.location} vs known locations: ${customer.normalLocations.join("; ")}.`,
      riskImpact: `+${pts("new_location")} risk points`,
      sourceAgent: "anomaly",
      relatedLocations: [txn.location],
    });
  if (pts("new_beneficiary") > 0)
    push({
      category: "Transaction Evidence",
      observation: "First-time beneficiary combined with a high-value transfer.",
      supportingData: `"${txn.beneficiary}" does not appear in the customer's beneficiary history (${customer.commonBeneficiaries.length} frequent payees).`,
      riskImpact: `+${pts("new_beneficiary")} risk points`,
      sourceAgent: "anomaly",
      relatedBeneficiaries: [txn.beneficiary],
    });
  const rapid = patterns.find((p) => p.key === "rapid_transfers");
  if (rapid)
    push({
      category: "Pattern Evidence",
      observation: "Rapid transfer pattern detected across correlated transactions.",
      supportingData: rapid.detail,
      riskImpact: `+${pts("rapid_transfers")} risk points`,
      sourceAgent: "pattern",
      relatedTxnIds: rapid.relatedTxnIds,
    });
  if (customer.previousAlerts.length > 0)
    push({
      category: "Historical Alerts",
      observation: "Customer has previous alerts on record relevant to this investigation.",
      supportingData: customer.previousAlerts.map((a) => `${a.date}: ${a.type} (${a.severity})`).join("; "),
      riskImpact: priorSignificant(customer) ? "+5 risk points" : "Contextual only",
      sourceAgent: "investigation",
    });
  for (const t of related.slice(0, 2))
    push({
      category: "Pattern Evidence",
      observation: `Related transaction ${t.txnId} correlated with the flagged event.`,
      supportingData: `${fmtINR(t.amount)} ${t.type} at ${t.time} from ${t.location} to ${t.beneficiary}.`,
      riskImpact: "Corroborating signal",
      sourceAgent: "pattern",
      relatedTxnIds: [t.txnId],
    });
  return ev;
}

function priorSignificant(customer: PipelineInput["customer"]): boolean {
  return customer.previousAlerts.some((a) => a.severity === "medium" || a.severity === "high");
}

function buildReport(input: PipelineInput, out: Omit<PipelineOutput, "report">, investigationId: string, caseStatus: string): InvestigationReport {
  const { customer, txn } = input;
  const behaviour = agentBehaviour(input);
  const anomaly = agentAnomaly(input);
  const deviceNew = !customer.knownDevices.some((d) => d.id === txn.deviceId);
  const locNew = !customer.normalLocations.includes(txn.location);
  const relations: Record<string, string> = {};
  for (const p of out.patterns) for (const id of p.relatedTxnIds) relations[id] = p.title;
  return {
    investigationId,
    txnId: txn.txnId,
    customerName: customer.name,
    accountId: customer.accountId,
    riskScore: out.riskAssessment.score,
    riskLabel: out.riskAssessment.label,
    caseStatus,
    generatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    executiveSummary:
      `Investigation ${investigationId} examines ${txn.type} transaction ${txn.txnId} of ${fmtINR(txn.amount)} by ${customer.name} (${customer.accountId}) initiated at ${txn.time} from ${txn.location} using ${txn.deviceLabel}. ` +
      `Behavioural analysis shows the transaction deviates from the customer's established profile on ${out.anomalies.length} dimension(s)` +
      (out.patterns.length ? ` and correlates with ${out.patterns.length} suspicious pattern(s)` : "") +
      `. The explainable risk score is ${out.riskAssessment.score}/100 (${out.riskAssessment.label}). ${out.riskAssessment.recommendationText} This report is an investigative lead generated on synthetic demo data and is not a fraud determination.`,
    sections: {
      transactionDetails: agentTransaction(input).findings,
      customerBehaviour: behaviour.findings,
      anomalyFindings: anomaly.anomalies.length ? anomaly.anomalies.map((a) => `${a.label} [${a.severity.toUpperCase()}] — ${a.detail}`) : ["No anomalies detected."],
      patternFindings: out.patterns.length ? out.patterns.map((p) => `${p.title} — ${p.detail}`) : ["No cross-transaction patterns detected."],
      deviceSignals: deviceNew
        ? [`Unrecognized device "${txn.deviceLabel}" (${txn.deviceId}) used for this transaction.`, `Registered devices: ${customer.knownDevices.map((d) => `${d.label} (${d.id})`).join("; ")}.`, "Device fingerprint does not match any historical session."]
        : [`Device ${txn.deviceLabel} matches the customer's registered devices.`],
      locationSignals: locNew
        ? [`Origin ${txn.location} is outside the customer's known locations (${customer.normalLocations.join(", ")}).`, "Geographic jump is inconsistent with typical mobility patterns."]
        : [`Origin ${txn.location} is consistent with the customer's location profile.`],
      historicalAlerts: customer.previousAlerts.length
        ? customer.previousAlerts.map((a) => `${a.date} — ${a.type} (severity: ${a.severity}).`)
        : ["No previous alerts recorded for this customer."],
      evidenceTrail: out.evidence.map((e) => `[${e.category}] ${e.observation} (${e.riskImpact})`),
      riskAssessment: [
        `Explainable score: ${out.riskAssessment.score}/100 — ${out.riskAssessment.label}.`,
        ...out.riskAssessment.factors.map((f) => `${f.label}: +${f.points} — ${f.detail}`),
        `Recommendation: ${out.riskAssessment.recommendationText}`,
      ],
      aiFindings: [
        ...out.steps.filter((s) => s.id !== "report").flatMap((s) => s.findings.slice(0, 2).map((f) => `${s.name}: ${f}`)),
        "Overall: multiple independent signals correlate with the suspicious transaction. Investigation recommended.",
      ],
      humanReviewRecommendation:
        out.riskAssessment.recommendation === "human_review"
          ? [out.riskAssessment.recommendationText, "Recommended actions: verify with the customer via registered channel, confirm beneficiary legitimacy, and optionally freeze pending transfers pending confirmation."]
          : [out.riskAssessment.recommendationText],
      relatedTransactions: out.steps.length >= 0
        ? [...new Set(out.patterns.flatMap((p) => p.relatedTxnIds).concat([txn.txnId]))]
            .filter((id) => id !== txn.txnId)
            .map((id) => {
              const t = input.history.find((h) => h.txnId === id);
              return t
                ? { txnId: t.txnId, date: t.date, amount: t.amount, beneficiary: t.beneficiary, relation: relations[id] ?? "Related activity" }
                : null;
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
        : [],
      investigationTimeline: out.timeline,
    },
  };
}

/* ------------------------------ Pipeline ------------------------------ */

export function runPipeline(input: PipelineInput, investigationId: string, caseStatus = "OPEN — HUMAN REVIEW RECOMMENDED"): PipelineOutput {
  const steps: AgentStep[] = AGENT_DEFS.map((d) => ({ ...d, status: "waiting", findings: [], durationMs: d.durationMs }));

  const setStep = (id: AgentStep["id"], findings: string[]) => {
    const s = steps.find((x) => x.id === id)!;
    s.status = "completed";
    s.findings = findings;
  };

  const txRes = agentTransaction(input);
  setStep("transaction", txRes.findings);

  const anomalyRes = agentAnomaly(input);
  setStep("anomaly", anomalyRes.findings);

  const behaviourRes = agentBehaviour(input);
  setStep("behaviour", behaviourRes.findings);

  const patternRes = agentPattern(input);
  setStep("pattern", patternRes.findings);

  const invRes = agentInvestigation(input, anomalyRes.anomalies, patternRes.patterns, patternRes.related);
  setStep("investigation", invRes.findings);

  const riskRes = agentRisk(input, anomalyRes.anomalies, patternRes.patterns);
  setStep("risk", riskRes.findings);

  const timeline = buildTimeline(input, patternRes.patterns);
  const evidence = buildEvidence(input, anomalyRes.anomalies, patternRes.patterns, riskRes, patternRes.related);
  setStep("report", [
    `Structured investigation report ${investigationId} generated.`,
    `${evidence.length} evidence items · ${timeline.length} timeline events · ${outRelatedCount(invRes.relatedEntities)} related entities.`,
    "Report ready for human review.",
  ]);

  const partial: Omit<PipelineOutput, "report"> = {
    steps,
    anomalies: anomalyRes.anomalies,
    patterns: patternRes.patterns,
    evidence,
    timeline,
    riskAssessment: riskRes.riskAssessment,
    relatedEntities: invRes.relatedEntities,
  };
  const report = buildReport(input, partial, investigationId, caseStatus);
  return { ...partial, report };
}

function outRelatedCount(e: PipelineOutput["relatedEntities"]): number {
  return e.accounts.length + e.devices.length + e.locations.length + e.beneficiaries.length;
}

/**
 * FRAUDNEXUS AI — Agent pipeline types.
 * ⚠️ DEMO SIMULATION — deterministic local agent simulation, no external AI calls.
 */
import type { Tx } from "../data/transactions";
import type { CustomerSeed } from "../data/customers";
import type { RiskResult } from "../risk";

export type AgentId =
  | "transaction"
  | "anomaly"
  | "behaviour"
  | "pattern"
  | "investigation"
  | "risk"
  | "report";

export type AgentRunStatus = "waiting" | "analyzing" | "completed";

export interface AgentStep {
  id: AgentId;
  name: string; // "Transaction Agent"
  role: string; // short role description
  status: AgentRunStatus;
  findings: string[]; // concise outputs shown in UI/report
  durationMs: number; // simulated processing time
  startedAt?: number;
  completedAt?: number;
}

export interface Anomaly {
  key: string;
  label: string;
  detail: string; // e.g. "Amount is 28× the customer's typical range"
  severity: "medium" | "high" | "critical";
}

export interface EvidenceItem {
  id: string;
  category:
    | "Transaction Evidence"
    | "Behaviour Evidence"
    | "Device Evidence"
    | "Location Evidence"
    | "Pattern Evidence"
    | "Historical Alerts";
  observation: string;
  supportingData: string;
  riskImpact: string; // e.g. "+25 risk points"
  sourceAgent: AgentId;
  relatedTxnIds?: string[];
  relatedDeviceIds?: string[];
  relatedLocations?: string[];
  relatedBeneficiaries?: string[];
  relatedAccountIds?: string[];
}

export interface TimelineEvent {
  id: string;
  time: string; // display time
  title: string;
  detail: string;
  kind: "device" | "beneficiary" | "transaction" | "pattern" | "system" | "risk" | "review";
}

export interface PatternFinding {
  key: string;
  title: string;
  detail: string;
  relatedTxnIds: string[];
}

export interface RiskAssessment extends RiskResult {
  // extends shared explainable risk result with factor evidence linkage
}

export interface Investigation {
  investigationId: string;
  txnId: string;
  customerId: string;
  customerName: string;
  accountId: string;
  status: "running" | "open" | "escalated" | "safe" | "more_evidence";
  statusLabel: string;
  createdAt: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  steps: AgentStep[];
  anomalies: Anomaly[];
  patterns: PatternFinding[];
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  riskAssessment: RiskAssessment | null;
  report?: InvestigationReport;
  humanReview?: {
    aiRecommendation: string;
    action?: "escalate" | "more_evidence" | "safe";
    actionAt?: string;
    reviewerNote?: string;
  };
  relatedEntities: {
    accounts: string[];
    devices: string[];
    locations: string[];
    beneficiaries: string[];
    txnIds: string[];
  };
}

export interface InvestigationReport {
  investigationId: string;
  txnId: string;
  customerName: string;
  accountId: string;
  riskScore: number;
  riskLabel: string;
  caseStatus: string;
  generatedAt: string;
  executiveSummary: string;
  sections: {
    transactionDetails: string[];
    customerBehaviour: string[];
    anomalyFindings: string[];
    patternFindings: string[];
    deviceSignals: string[];
    locationSignals: string[];
    historicalAlerts: string[];
    evidenceTrail: string[];
    riskAssessment: string[];
    aiFindings: string[];
    humanReviewRecommendation: string[];
    relatedTransactions: { txnId: string; date: string; amount: number; beneficiary: string; relation: string }[];
    investigationTimeline: TimelineEvent[];
  };
}

export interface PipelineInput {
  customer: CustomerSeed;
  txn: Tx;
  history: Tx[];
}

export interface PipelineOutput {
  steps: AgentStep[];
  anomalies: Anomaly[];
  patterns: PatternFinding[];
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  riskAssessment: RiskAssessment;
  relatedEntities: Investigation["relatedEntities"];
  report: InvestigationReport;
}

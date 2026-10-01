/**
 * FRAUDNEXUS AI — Explainable risk engine (deterministic, rule-based).
 * One shared weighting model consumed by the agent pipeline, UI badges and reports
 * so the risk score is always explainable and consistent across the app.
 * ⚠️ DEMO SIMULATION — heuristic scoring on synthetic data, not a real fraud model.
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  detail: string; // human-readable reason for this factor
}

export interface RiskResult {
  score: number; // 0-100
  level: RiskLevel;
  label: string; // display label e.g. "HIGH RISK"
  factors: RiskFactor[];
  recommendation: "no_action" | "monitor" | "human_review";
  recommendationText: string;
}

export const RISK_LEVELS: Record<RiskLevel, { label: string; min: number }> = {
  low: { label: "LOW RISK", min: 0 },
  medium: { label: "MEDIUM RISK", min: 25 },
  high: { label: "HIGH RISK", min: 60 },
  critical: { label: "CRITICAL RISK", min: 85 },
};

/** Compute the level + label from a raw score. */
export function levelForScore(score: number): { level: RiskLevel; label: string } {
  const level =
    score >= 85 ? "critical" : score >= 60 ? "high" : score >= 25 ? "medium" : "low";
  return { level, label: RISK_LEVELS[level].label };
}

/** Status classification for a transaction (used by monitor filters). */
export function txStatusFor(score: number): "Normal" | "Suspicious" | "High Risk" | "Critical" {
  if (score >= 85) return "Critical";
  if (score >= 60) return "High Risk";
  if (score >= 25) return "Suspicious";
  return "Normal";
}

/** Deterministic pseudo-random generator so synthetic data is stable per seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

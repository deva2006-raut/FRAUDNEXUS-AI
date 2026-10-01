"use client";

import { useState } from "react";
import type { InvestigationReport } from "@/lib/agents/types";
import { fmtINR } from "@/lib/format";
import { RiskBadge } from "@/components/ui";
import { IconDownload, IconPrint, IconShare } from "@/components/Icons";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-[12px] font-bold tracking-wider uppercase text-cyanx-300 border-b border-cyanx-500/20 pb-1.5 mb-2.5">{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="text-[13px] text-ink-200 leading-relaxed flex gap-2">
          <span className="text-cyanx-500/70 mt-0.5">▸</span><span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportView({ report, customerName }: { report: InvestigationReport; customerName?: string }) {
  const [shared, setShared] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const buildText = (): string => {
    const L: string[] = [];
    const s = report.sections;
    L.push("FRAUDNEXUS AI — INVESTIGATION REPORT");
    L.push("=".repeat(60));
    L.push(`Investigation ID: ${report.investigationId}`);
    L.push(`Transaction ID:  ${report.txnId}`);
    L.push(`Customer:        ${report.customerName} (${report.accountId})`);
    L.push(`Risk Score:      ${report.riskScore}/100 — ${report.riskLabel}`);
    L.push(`Case Status:     ${report.caseStatus}`);
    L.push(`Generated:       ${report.generatedAt}`);
    L.push("");
    L.push("EXECUTIVE SUMMARY"); L.push(report.executiveSummary); L.push("");
    L.push("TRANSACTION DETAILS"); s.transactionDetails.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("CUSTOMER BEHAVIOUR"); s.customerBehaviour.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("ANOMALY FINDINGS"); s.anomalyFindings.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("PATTERN FINDINGS"); s.patternFindings.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("DEVICE SIGNALS"); s.deviceSignals.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("LOCATION SIGNALS"); s.locationSignals.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("HISTORICAL ALERTS"); s.historicalAlerts.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("EVIDENCE TRAIL"); s.evidenceTrail.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("RISK ASSESSMENT"); s.riskAssessment.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("AI FINDINGS"); s.aiFindings.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("HUMAN REVIEW RECOMMENDATION"); s.humanReviewRecommendation.forEach((x) => L.push(`- ${x}`)); L.push("");
    L.push("INVESTIGATION TIMELINE");
    s.investigationTimeline.forEach((e) => L.push(`${e.time} — ${e.title}: ${e.detail}`));
    L.push("");
    if (s.relatedTransactions.length) {
      L.push("RELATED TRANSACTIONS");
      s.relatedTransactions.forEach((t) => L.push(`${t.txnId} | ${t.date} | INR ${t.amount} | ${t.beneficiary} | ${t.relation}`));
      L.push("");
    }
    L.push("-".repeat(60));
    L.push("DISCLAIMER: FRAUDNEXUS AI is a hackathon prototype using synthetic/demo");
    L.push("financial data. This report is an investigative lead, not a fraud determination.");
    return L.join("\n");
  };

  const download = () => {
    const blob = new Blob([buildText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.investigationId}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const share = async () => {
    const summary = `${report.investigationId} — ${report.txnId} — Risk ${report.riskScore}/100 (${report.riskLabel}) — ${report.caseStatus}. (FRAUDNEXUS AI demo report, synthetic data)`;
    try {
      await navigator.clipboard.writeText(summary);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      setShared(false);
    }
  };

  const s = report.sections;

  return (
    <div className="print-area">
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <button onClick={() => window.print()} className="btn-ghost !py-1.5 !text-xs"><IconPrint size={13} /> Print Report</button>
        <button onClick={download} className="btn-ghost !py-1.5 !text-xs"><IconDownload size={13} /> {downloaded ? "Downloaded ✓" : "Download Report"}</button>
        <button onClick={share} className="btn-ghost !py-1.5 !text-xs"><IconShare size={13} /> {shared ? "Copied ✓" : "Share Demo Report"}</button>
        <span className="text-[10px] text-ink-500 ml-auto">⚠ Demo report on synthetic data — not a fraud determination</span>
      </div>

      <div className="glass-panel p-6 lg:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-cyanx-300 font-bold">FRAUDNEXUS AI</p>
            <h2 className="text-2xl font-bold mt-1 tracking-tight">INVESTIGATION REPORT</h2>
            <p className="text-[11px] text-ink-400 mt-1">Generated {report.generatedAt} · Synthetic demo data</p>
          </div>
          <div className="text-right space-y-2">
            <RiskBadge level={report.riskScore >= 85 ? "critical" : report.riskScore >= 60 ? "high" : report.riskScore >= 25 ? "medium" : "low"} score={report.riskScore} className="!text-xs" />
            <p className="text-[11px] text-ink-300 font-mono">{report.caseStatus}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            ["Investigation ID", report.investigationId],
            ["Transaction ID", report.txnId],
            ["Customer", `${report.customerName}${customerName && customerName !== report.customerName ? "" : ""}`],
            ["Risk Score", `${report.riskScore}/100 — ${report.riskLabel}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-navy-800/60 border border-white/5 rounded-lg px-3.5 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-ink-400">{k}</p>
              <p className="text-xs font-semibold text-ink-100 mt-0.5 font-mono">{v}</p>
            </div>
          ))}
        </div>

        <Section title="Executive Summary">
          <p className="text-[13px] text-ink-200 leading-relaxed">{report.executiveSummary}</p>
        </Section>

        <Section title="Transaction Details"><Bullets items={s.transactionDetails} /></Section>
        <Section title="Customer Behaviour"><Bullets items={s.customerBehaviour} /></Section>
        <Section title="Detected Anomalies"><Bullets items={s.anomalyFindings} /></Section>
        <Section title="Suspicious Patterns"><Bullets items={s.patternFindings} /></Section>

        <div className="grid md:grid-cols-2 gap-x-8">
          <Section title="Device Signals"><Bullets items={s.deviceSignals} /></Section>
          <Section title="Location Signals"><Bullets items={s.locationSignals} /></Section>
        </div>

        <Section title="Historical Alerts"><Bullets items={s.historicalAlerts} /></Section>

        <Section title="Evidence Trail">
          <ul className="space-y-1.5">
            {s.evidenceTrail.map((e, i) => (
              <li key={i} className="text-[13px] text-ink-200 leading-relaxed flex gap-2">
                <span className="text-warn-400/80 mt-0.5">◈</span><span>{e}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Investigation Timeline">
          <div className="space-y-0">
            {s.investigationTimeline.map((e, i) => (
              <div key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <span className="w-2 h-2 rounded-full bg-cyanx-400/80" />
                  {i < s.investigationTimeline.length - 1 && <span className="w-px flex-1 bg-white/10 min-h-[18px]" />}
                </div>
                <div className="pb-3">
                  <p className="text-[11px] font-mono text-cyanx-300">{e.time}</p>
                  <p className="text-xs font-semibold text-ink-100">{e.title}</p>
                  <p className="text-[11px] text-ink-400">{e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {s.relatedTransactions.length > 0 && (
          <Section title="Related Transactions">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10">
                  <th className="th !px-2 !py-2">Txn</th><th className="th !px-2 !py-2">Date</th>
                  <th className="th !px-2 !py-2">Amount</th><th className="th !px-2 !py-2">Beneficiary</th>
                  <th className="th !px-2 !py-2">Relation</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {s.relatedTransactions.map((t) => (
                    <tr key={t.txnId}>
                      <td className="td !px-2 !py-2 font-mono text-xs text-cyanx-300">{t.txnId}</td>
                      <td className="td !px-2 !py-2 text-xs">{t.date}</td>
                      <td className="td !px-2 !py-2 text-xs font-semibold">{fmtINR(t.amount)}</td>
                      <td className="td !px-2 !py-2 text-xs">{t.beneficiary}</td>
                      <td className="td !px-2 !py-2 text-xs text-warn-400">{t.relation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        <Section title="Risk Assessment"><Bullets items={s.riskAssessment} /></Section>
        <Section title="AI Findings"><Bullets items={s.aiFindings} /></Section>

        <Section title="Human Review Recommendation">
          <div className="bg-danger-500/10 border border-danger-500/30 rounded-lg p-4">
            <Bullets items={s.humanReviewRecommendation} />
          </div>
        </Section>

        <Section title="Case Status">
          <p className="text-sm font-semibold text-ink-100 font-mono">{report.caseStatus}</p>
        </Section>

        <p className="mt-8 pt-4 border-t border-white/10 text-[10px] text-ink-500 leading-relaxed">
          DISCLAIMER — FRAUDNEXUS AI is a hackathon prototype using synthetic/demo financial data. It does not make
          definitive fraud determinations and is designed to support human investigation. All entities in this report are fictional.
        </p>
      </div>
    </div>
  );
}

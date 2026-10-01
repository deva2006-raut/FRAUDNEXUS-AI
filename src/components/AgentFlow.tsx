"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AGENT_DEFS } from "@/lib/agents/pipeline";
import type { AgentStep, Investigation } from "@/lib/agents/types";
import { IconCheck, IconPlay } from "@/components/Icons";

type Mode = "live" | "static";

interface RunState {
  idx: number; // current agent index being "analyzed"
  phase: "idle" | "running" | "done";
  steps: AgentStep[];
}

const INITIAL: RunState = {
  idx: 0,
  phase: "idle",
  steps: AGENT_DEFS.map((d) => ({ ...d, status: "waiting", findings: [] })),
};

/**
 * Live agent pipeline runner. Mirrors the deterministic pipeline output:
 * each agent animates "Analyzing" for its durationMs, then reveals its findings.
 */
export function useAgentRunner(investigation: Investigation) {
  const [state, setState] = useState<RunState>(INITIAL);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedIdRef = useRef<string | null>(null);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    startedIdRef.current = null;
    setState(INITIAL);
  };

  const start = () => {
    if (timer.current) clearTimeout(timer.current);
    setState({ ...INITIAL, phase: "running" });
    let acc = 0;
    const seqSteps = investigation.steps;
    const advance = (i: number) => {
      if (i >= seqSteps.length) {
        setState({ idx: seqSteps.length, phase: "done", steps: seqSteps });
        return;
      }
      const step = seqSteps[i];
      timer.current = setTimeout(() => {
        setState((prev) => {
          const steps = prev.steps.map((s, j) =>
            j === i ? { ...step, status: "completed" as const, startedAt: Date.now() - step.durationMs, completedAt: Date.now() } : s
          );
          return { idx: i + 1, phase: i + 1 >= seqSteps.length ? "done" : "running", steps };
        });
        advance(i + 1);
      }, step.durationMs);
    };
    advance(0);
  };

  // Auto-run once per investigation id (StrictMode-safe: cleanup re-arms the trigger)
  useEffect(() => {
    if (startedIdRef.current === investigation.investigationId) return;
    startedIdRef.current = investigation.investigationId;
    start();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      startedIdRef.current = null;
    };
  }, [investigation.investigationId]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { state, start, reset, running: state.phase === "running", done: state.phase === "done" };
}

const STATUS_META: Record<AgentStep["status"], { dot: string; text: string; label: string }> = {
  waiting: { dot: "bg-ink-500", text: "text-ink-400", label: "Waiting" },
  analyzing: { dot: "bg-cyanx-400 animate-pulse-dot", text: "text-cyanx-300", label: "Analyzing" },
  completed: { dot: "bg-safe-400", text: "text-safe-400", label: "Completed" },
};

function AgentCard({ step, active, last, onComplete }: {
  step: AgentStep; active: boolean; last: boolean; onComplete?: () => void;
}) {
  const display: AgentStep["status"] = active && step.status === "waiting" ? "analyzing" : step.status;
  const meta = STATUS_META[display];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (step.status !== "completed") return;
    setShown(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= step.findings.length) clearInterval(t);
    }, 220);
    return () => clearInterval(t);
  }, [step.status, step.findings.length]);

  return (
    <div className={`glass-panel p-4 transition-all duration-300 ${active ? "border-cyanx-500/40 shadow-glowc" : ""} ${last && step.status === "completed" ? "border-safe-500/30" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-100">{step.name}</p>
          <p className="text-[11px] text-ink-400 truncate">{step.role}</p>
        </div>
        <span className={`ml-auto chip !py-0.5 ${display === "completed" ? "bg-safe-500/12 text-safe-400" : display === "analyzing" ? "bg-cyanx-500/12 text-cyanx-300" : "bg-white/5 text-ink-400"}`}>
          {display === "completed" ? "Completed" : display === "analyzing" ? "Analyzing…" : "Waiting"}
        </span>
      </div>
      {step.findings.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
          {step.findings.slice(0, shown).map((f, i) => (
            <li key={i} className="text-[11px] text-ink-200 flex gap-2 animate-fadeUp">
              <IconCheck size={12} className="text-safe-400 shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
          {shown < step.findings.length && (
            <li className="text-[11px] text-cyanx-300 animate-pulse-dot">▍ processing…</li>
          )}
        </ul>
      )}
      {onComplete && shown >= step.findings.length && step.status === "completed" && !last && <div className="h-0" />}
    </div>
  );
}

export function AgentFlowRunner({ investigation, onComplete }: { investigation: Investigation; onComplete?: () => void }) {
  const { state, start, running, done } = useAgentRunner(investigation);
  const firedRef = useRef(false);

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
    if (!done) firedRef.current = false;
  }, [done, onComplete]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {running && <span className="chip bg-cyanx-500/12 text-cyanx-300"><span className="w-1.5 h-1.5 rounded-full bg-cyanx-400 animate-pulse-dot" /> Investigation running — agents collaborating</span>}
        {done && <span className="chip bg-safe-500/12 text-safe-400"><IconCheck size={12} /> Investigation pipeline completed</span>}
        {!running && !done && <span className="chip bg-white/5 text-ink-400">Pipeline idle</span>}
        <button onClick={start} className="btn-ghost !px-3 !py-1 text-xs ml-auto" disabled={running}>
          <IconPlay size={12} /> Replay pipeline
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.steps.map((s, i) => (
          <AgentCard key={s.id} step={s} active={state.idx === i && running} last={i === state.steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

/** Static vertical flow used on Dashboard (no investigation attached). */
export function AgentFlowStatic() {
  return (
    <div className="flex flex-col gap-0">
      {AGENT_DEFS.map((d, i) => (
        <div key={d.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyanx-400/80 shadow-glowc" />
            {i < AGENT_DEFS.length - 1 && <span className="w-px flex-1 bg-gradient-to-b from-cyanx-500/50 to-white/5" />}
          </div>
          <div className="pb-4">
            <p className="text-xs font-semibold text-ink-100">{d.name}</p>
            <p className="text-[11px] text-ink-400">{d.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

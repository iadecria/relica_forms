import { Check, Circle, Lock, Clock } from "lucide-react";
import type { Section } from "../data/sections";
import type { Respondent } from "../lib/types";

interface Props {
  respondent: Respondent;
  sections: Section[];
  waitingFor: number | null;
  onSelect: (sectionId: number) => void;
  current: number;
}

type State = "done" | "current" | "waiting" | "locked";

const LEGEND: { state: State; label: string }[] = [
  { state: "done", label: "Concluído" },
  { state: "current", label: "Atual" },
  { state: "waiting", label: "Aguardando liberação" },
  { state: "locked", label: "Bloqueado" },
];

export default function ProgressBar({ respondent, sections, waitingFor, onSelect, current }: Props) {
  const TOTAL = sections.length;
  const done = new Set(respondent.completed_sections);
  const accessibleUpTo = waitingFor ?? respondent.current_section;

  const stateFor = (id: number): State => {
    if (done.has(id)) return "done";
    if (waitingFor !== null && id === waitingFor) return "waiting";
    if (id > accessibleUpTo) return "locked";
    if (waitingFor !== null) return "locked";
    if (id === current) return "current";
    return "current";
  };

  const pct = TOTAL ? Math.round((done.size / TOTAL) * 100) : 0;

  return (
    <div className="bg-white border border-line rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-ink-soft">Módulos</p>
        <p className="text-xs text-ink-muted">
          {done.size} de {TOTAL} concluídos · {pct}%
        </p>
      </div>
      <div className="h-1.5 w-full rounded-full bg-canvas overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {sections.map((s) => {
          const st = stateFor(s.id);
          const clickable = st === "done" || st === "current";
          return (
            <button
              key={s.id}
              onClick={() => clickable && onSelect(s.id)}
              disabled={!clickable}
              aria-label={`Módulo ${s.id}: ${s.title}`}
              title={`${s.title}${st === "locked" ? " (bloqueado)" : ""}`}
              className={`flex items-center justify-center gap-1 rounded-full text-xs font-medium py-2 transition-colors ${
                st === "done"
                  ? "bg-success/10 text-success hover:bg-success/20"
                  : st === "current"
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : st === "waiting"
                      ? "bg-warning/10 text-warning"
                      : "bg-canvas border border-line text-ink-muted/60 cursor-not-allowed"
              }`}
            >
              {st === "done" ? (
                <Check className="w-3.5 h-3.5" />
              ) : st === "waiting" ? (
                <Clock className="w-3.5 h-3.5" />
              ) : st === "locked" ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{s.id}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND.map(({ state, label }) => (
          <span key={state} className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                state === "done"
                  ? "bg-success"
                  : state === "current"
                    ? "bg-primary"
                    : state === "waiting"
                      ? "bg-warning"
                      : "bg-ink-muted/30"
              }`}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
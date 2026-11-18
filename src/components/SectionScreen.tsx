import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Send, MessageSquareText } from "lucide-react";
import { getSettings, saveAnswer } from "../lib/db";
import type { Respondent } from "../lib/types";
import type { Section } from "../data/sections";

interface Props {
  section: Section;
  isLast: boolean;
  respondent: Respondent;
  responses: Map<string, string>;
  onAnswerChange: (sectionId: number, questionId: string, answer: string) => void;
  onSectionComplete: () => void;
  readOnly: boolean;
  goToWaiting: () => void;
}

export default function SectionScreen({
  section,
  isLast,
  respondent,
  responses,
  onAnswerChange,
  onSectionComplete,
  readOnly,
  goToWaiting,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimers = useRef<Map<string, number>>(new Map());
  const [settings, setSettings] = useState<{
    allow_edit_after_release: boolean;
  } | null>(null);

  useEffect(() => {
    getSettings()
      .then((s) => setSettings(s))
      .catch(() => setSettings({ allow_edit_after_release: false }));
  }, []);

  const editable = readOnly ? (settings?.allow_edit_after_release ?? false) : true;

  const handleChange = (qid: string, value: string) => {
    onAnswerChange(section.id, qid, value);
    setSaved(false);
    const key = `${section.id}:${qid}`;
    const prev = saveTimers.current.get(key);
    if (prev) window.clearTimeout(prev);
    const timer = window.setTimeout(async () => {
      try {
        await saveAnswer(respondent.id, section.id, qid, value);
        setSaved(true);
      } catch {
        // draft stays in memory; user can retry on submit
      }
    }, 700);
    saveTimers.current.set(key, timer);
  };

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 112)}px`;
  };

  const missingRequired = section.questions.filter(
    (q) => !q.optional && !(responses.get(`${section.id}:${q.id}`) ?? "").trim()
  );

  const handleSubmit = async () => {
    if (missingRequired.length > 0) {
      setError(
        "Todas as perguntas obrigatórias devem ser respondidas antes de concluir o módulo."
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await Promise.all(
        section.questions.map((q) =>
          saveAnswer(
            respondent.id,
            section.id,
            q.id,
            responses.get(`${section.id}:${q.id}`) ?? ""
          )
        )
      );
      onSectionComplete();
    } catch {
      setError("Não foi possível salvar as respostas. Tente novamente.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-line rounded-2xl p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2">
          Seção {section.id}
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink leading-tight mb-3">
          {section.title}
        </h1>
        <p className="text-sm text-ink-mid leading-relaxed">{section.intro}</p>
        {readOnly && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted bg-primary-soft border border-line rounded-full px-3 py-1.5">
            <CheckCircle2 className="w-4 h-4 text-success" /> Módulo concluído — visualização{" "}
            {editable ? "editável" : "somente leitura"}.
          </p>
        )}
      </div>

      <div className="space-y-5">
        {section.questions.map((q, idx) => {
          const value = responses.get(`${section.id}:${q.id}`) ?? "";
          return (
            <div key={q.id} className="bg-white border border-line rounded-2xl p-5 sm:p-6">
              <label className="block text-sm text-ink-soft mb-3 leading-relaxed">
                <span className="text-ink-muted mr-2 font-semibold">{idx + 1}.</span>
                {q.text}
                {q.optional ? (
                  <span className="ml-2 text-xs font-normal text-ink-muted">
                    (não obrigatória)
                  </span>
                ) : (
                  <span className="ml-2 text-xs font-normal text-primary-text">obrigatória</span>
                )}
              </label>
              <textarea
                value={value}
                ref={autoGrow}
                onChange={(e) => {
                  autoGrow(e.target);
                  handleChange(q.id, e.target.value);
                }}
                disabled={!editable}
                rows={4}
                placeholder={
                  editable ? "Escreva com detalhes..." : "Edição desativada pelo administrador"
                }
                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink leading-relaxed placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition resize-none overflow-hidden"
              />
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {editable && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
            Concluir módulo e avançar
          </button>
          <p className="text-xs text-ink-muted">
            {saved ? "Rascunho salvo automaticamente." : "As respostas são salvas automaticamente enquanto você digita."}
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
        <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <p className="text-xs text-ink-mid leading-relaxed">
          Prefere explicar por áudio ou vídeo? Envie um WhatsApp para o
          responsável apenas dizendo o módulo que está preenchendo:{" "}
          <span className="font-semibold text-ink-soft">{section.title}</span>.
        </p>
      </div>

      {readOnly && isLast && (
        <button
          onClick={goToWaiting}
          className="text-sm text-ink-mid underline hover:text-ink"
        >
          Voltar
        </button>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, LogOut } from "lucide-react";
import type { Respondent, FormDef } from "../lib/types";
import type { Section } from "../data/sections";
import { DEFAULT_SECTIONS } from "../data/sections";
import ProgressBar from "./ProgressBar";
import SectionScreen from "./SectionScreen";
import WaitingScreen from "./WaitingScreen";
import FinalScreen from "./FinalScreen";
import Footer from "./Footer";
import {
  createRespondent,
  findRespondentByForm,
  getResponses,
  getRespondent,
  getSettings,
  updateRespondent,
} from "../lib/db";
import { findFormByPassword, getFormById } from "../lib/forms";
import { supabase } from "../lib/supabase";
import Brand from "./Brand";

const SESSION_KEY = "descoberta_humana_session";

type View = "loading" | "identify" | "section" | "waiting" | "final";

export default function RespondentApp() {
  const [view, setView] = useState<View>("loading");
  const [respondent, setRespondent] = useState<Respondent | null>(null);
  const [formDef, setFormDef] = useState<FormDef | null>(null);
  const [responses, setResponses] = useState<Map<string, string>>(new Map());
  const [currentSection, setCurrentSection] = useState(0);
  const [waitingFor, setWaitingFor] = useState<number | null>(null);
  const [requireManual, setRequireManual] = useState(true);
  const [form, setForm] = useState({ password: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sections: Section[] = formDef?.sections.length ? formDef.sections : DEFAULT_SECTIONS;
  const total = sections.length;

  const loadResponses = useCallback(async (rid: string) => {
    try {
      setResponses(await getResponses(rid));
    } catch {
      setResponses(new Map());
    }
  }, []);

  const loadRespondent = useCallback(
    async (r: Respondent, def: FormDef) => {
      setRespondent(r);
      setFormDef(def);
      await loadResponses(r.id);
      setCurrentSection(r.current_section);
      if (r.completed_sections.length >= def.sections.length) {
        setView("final");
      } else if (r.status === "Aguardando liberação") {
        setWaitingFor(r.current_section);
        setView("waiting");
      } else {
        setWaitingFor(null);
        setView("section");
      }
    },
    [loadResponses]
  );

  const resolveForm = useCallback(async (r: Respondent): Promise<FormDef> => {
    const byId = await getFormById(r.form_id);
    if (byId) return byId;
    return {
      id: "legacy",
      company: r.company || "HL Humana",
      password: "",
      sections: DEFAULT_SECTIONS,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSettings();
        setRequireManual(s.require_manual_release);
      } catch {
        setRequireManual(true);
      }
      const savedId = localStorage.getItem(SESSION_KEY);
      if (savedId) {
        try {
          const current = await getRespondent(savedId);
          if (current) {
            await loadRespondent(current, await resolveForm(current));
            return;
          }
          localStorage.removeItem(SESSION_KEY);
        } catch {
          // ignore, fall back to identification
        }
      }
      setView("identify");
    })();
  }, [loadRespondent, resolveForm]);

  useEffect(() => {
    const client = supabase;
    if (!client || !respondent) return;
    const channel = client
      .channel(`respondent-${respondent.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "respondents", filter: `id=eq.${respondent.id}` },
        (payload) => {
          const fresh = payload.new as Respondent;
          setRespondent((prev) => {
            if (!prev) return prev;
            if (fresh.completed_sections.length >= total) {
              setView("final");
            } else if (fresh.status === "Aguardando liberação") {
              setWaitingFor(fresh.current_section);
              setView("waiting");
            } else {
              setWaitingFor(null);
              setCurrentSection(fresh.current_section);
              setView("section");
            }
            return { ...fresh };
          });
        }
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [respondent?.id, total]);

  const handleLogin = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const def = await findFormByPassword(form.password.trim());
      if (!def) {
        setFormError("Senha incorreta.");
        return;
      }
      const existing = await findRespondentByForm(def.id === "legacy" ? null : def.id, def.company);
      if (existing) {
        localStorage.setItem(SESSION_KEY, existing.id);
        await loadRespondent(existing, def);
        return;
      }
      const created = await createRespondent({
        name: def.company,
        role: "",
        whatsapp: "",
        company: def.company,
        form_id: def.id === "legacy" ? null : def.id,
      });
      localStorage.setItem(SESSION_KEY, created.id);
      await loadRespondent(created, def);
    } catch {
      setFormError("Não foi possível iniciar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (sectionId: number, questionId: string, answer: string) => {
    setResponses((prev) => {
      const next = new Map(prev);
      next.set(`${sectionId}:${questionId}`, answer);
      return next;
    });
  };

  const handleSectionComplete = async () => {
    if (!respondent) return;
    const nextDone = Array.from(new Set([...respondent.completed_sections, currentSection])).sort(
      (a, b) => a - b
    );
    const nextSection = currentSection + 1;
    const finished = nextSection >= total;
    const patch = {
      completed_sections: nextDone,
      current_section: finished ? currentSection : nextSection,
      status: (finished || !requireManual
        ? finished
          ? "Concluído"
          : "Em preenchimento"
        : "Aguardando liberação") as
        | "Em preenchimento"
        | "Aguardando liberação"
        | "Concluído",
    };
    try {
      const updated = await updateRespondent(respondent.id, patch);
      setRespondent({
        ...respondent,
        ...patch,
        updated_at: updated?.updated_at ?? new Date().toISOString(),
      });
      if (finished) {
        setView("final");
      } else if (requireManual) {
        setWaitingFor(nextSection);
        setView("waiting");
      } else {
        setWaitingFor(null);
        setCurrentSection(nextSection);
        setView("section");
      }
    } catch {
      // keep user on the same screen; they can retry
    }
  };

  const checkRelease = useCallback(async () => {
    if (!respondent) return;
    try {
      const fresh = await getRespondent(respondent.id);
      if (!fresh) return;
      setRespondent(fresh);
      if (fresh.completed_sections.length >= total) {
        setView("final");
      } else if (fresh.status !== "Aguardando liberação") {
        setWaitingFor(null);
        setCurrentSection(fresh.current_section);
        setView("section");
      }
    } catch {
      // ignore, user can retry
    }
  }, [respondent, total]);

  useEffect(() => {
    if (view !== "waiting") return;
    const t = setInterval(() => void checkRelease(), 10000);
    return () => clearInterval(t);
  }, [view, checkRelease]);

  const handleLogout = () => {
    if (
      !window.confirm(
        "Sair do formulário? Suas respostas continuam salvas e você pode retomar depois informando a senha."
      )
    ) {
      return;
    }
    localStorage.removeItem(SESSION_KEY);
    setRespondent(null);
    setFormDef(null);
    setResponses(new Map());
    setCurrentSection(0);
    setWaitingFor(null);
    setForm({ password: "" });
    setFormError(null);
    setView("identify");
  };

  const activeSection = useMemo(
    () => sections.find((s) => s.id === currentSection),
    [sections, currentSection]
  );
  const nextTitle = useMemo(
    () => sections.find((s) => s.id === waitingFor)?.title ?? null,
    [sections, waitingFor]
  );

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (view === "identify") {
    const password = form.password.trim();
    const submit = () => {
      if (!password) return;
      void handleLogin();
    };
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="mb-8">
              <Brand />
            </div>
            <h1 className="text-2xl font-semibold text-ink mb-3">Identificação</h1>
            <p className="text-sm text-ink-mid leading-relaxed mb-6">
              Formulário de descoberta para mapear como sua empresa trabalha hoje, módulo a
              módulo, antes de configurar o sistema. Responda com detalhe: quanto mais real a
              resposta, melhor o sistema fica.
            </p>
            <div>
              <label htmlFor="identify-password" className="block text-sm font-semibold text-ink-soft mb-1.5">
                Senha de acesso
              </label>
              <input
                id="identify-password"
                type="password"
                autoComplete="off"
                value={form.password}
                onChange={(e) => {
                  setFormError(null);
                  setForm({ password: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="Digite a senha"
                className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            {formError && (
              <p className="mt-4 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                {formError}
              </p>
            )}
            <button
              onClick={submit}
              disabled={submitting || !password}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Iniciar descoberta
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!respondent || !formDef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-white">
        <div className="max-w-form mx-auto px-4 py-4 flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-medium text-ink-mid">
              {formDef.company}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-canvas transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-form w-full mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
        <ProgressBar
          respondent={respondent}
          sections={sections}
          waitingFor={waitingFor}
          current={currentSection}
          onSelect={(id) => {
            if (view === "waiting" && id === waitingFor) return;
            setCurrentSection(id);
            setView("section");
          }}
        />
        {view === "waiting" && <WaitingScreen onCheck={checkRelease} nextTitle={nextTitle} />}
        {view === "section" && activeSection && (
          <SectionScreen
            key={currentSection}
            section={activeSection}
            isLast={currentSection === total - 1}
            respondent={respondent}
            responses={responses}
            onAnswerChange={handleAnswerChange}
            onSectionComplete={handleSectionComplete}
            readOnly={respondent.completed_sections.includes(currentSection)}
            goToWaiting={() => setView("waiting")}
          />
        )}
        {view === "final" && <FinalScreen />}
      </main>
      <Footer />
    </div>
  );
}

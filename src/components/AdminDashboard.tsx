import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Unlock,
  Lock,
  Eye,
  LogOut,
  Save,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { DEFAULT_SECTIONS } from "../data/sections";
import type { Section } from "../data/sections";
import {
  deleteRespondent,
  getAllResponses,
  getSettings,
  listRespondents,
  resetRespondent,
  resetSection,
  saveSettings,
  updateRespondent,
} from "../lib/db";
import { listForms } from "../lib/forms";
import type { FormDef, Respondent, ResponseRow, Settings } from "../lib/types";
import { exportAll, exportRespondent, type ExportFormat } from "../lib/export";
import Brand from "./Brand";
import Footer from "./Footer";
import FormsManager from "./FormsManager";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [forms, setForms] = useState<FormDef[]>([]);
  const [formFilter, setFormFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [releasingAll, setReleasingAll] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [form, setForm] = useState({ form_company: "Humana", form_password: "humana" });
  const [savingAccess, setSavingAccess] = useState(false);
  const [accessSaved, setAccessSaved] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [r, allRows, s, f] = await Promise.all([
        listRespondents(),
        getAllResponses(),
        getSettings(),
        listForms(),
      ]);
      setRespondents(r);
      setRows(allRows);
      setSettings(s);
      setForms(f);
      setForm({
        form_company: s.form_company ?? "Humana",
        form_password: s.form_password ?? "humana",
      });
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  const sectionsFor = useCallback(
    (r: Respondent): Section[] => {
      if (r.form_id) {
        const match = forms.find((f) => f.id === r.form_id);
        if (match?.sections.length) return match.sections;
      }
      return DEFAULT_SECTIONS;
    },
    [forms]
  );

  const visibleRespondents = useMemo(() => {
    if (formFilter === "all") return respondents;
    if (formFilter === "legacy") return respondents.filter((r) => !r.form_id);
    return respondents.filter((r) => r.form_id === formFilter);
  }, [respondents, formFilter]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [refresh]);

  const rowsByRespondent = useMemo(() => {
    const map = new Map<string, ResponseRow[]>();
    for (const row of rows) {
      const list = map.get(row.respondent_id) ?? [];
      list.push(row);
      map.set(row.respondent_id, list);
    }
    return map;
  }, [rows]);

  const releaseNext = async (r: Respondent) => {
    setBusyId(r.id);
    try {
      const total = sectionsFor(r).length;
      const nextSection = Math.min(
        Math.max(r.current_section + 1, r.completed_sections.length),
        Math.max(total - 1, 0)
      );
      await updateRespondent(r.id, {
        current_section: nextSection,
        status: "Em preenchimento",
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const releaseUpTo = async (r: Respondent, upTo: number) => {
    setReleasingAll(r.id);
    try {
      const total = sectionsFor(r).length;
      await updateRespondent(r.id, {
        current_section: Math.max(r.current_section, Math.min(upTo, Math.max(total - 1, 0))),
        status: "Em preenchimento",
      });
      await refresh();
    } finally {
      setReleasingAll(null);
    }
  };

  const toggleSetting = async (key: "require_manual_release" | "allow_edit_after_release") => {    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      await saveSettings(next);
    } catch {
      setSettings(settings);
    }
  };

  const saveAccess = async (next: { form_company: string; form_password: string }) => {
    setSavingAccess(true);
    setAccessSaved(false);
    setAccessError(null);
    try {
      const saved = await saveSettings({
        form_company: next.form_company.trim(),
        form_password: next.form_password.trim(),
      });
      setSettings(saved);
      setForm({
        form_company: saved.form_company ?? next.form_company,
        form_password: saved.form_password ?? next.form_password,
      });
      const check = await getSettings();
      if (check.form_password !== next.form_password.trim()) {
        setAccessError(
          "A senha não foi gravada. Rode a migration no Supabase (colunas form_password/form_company)."
        );
      } else {
        setAccessSaved(true);
      }
    } catch {
      setAccessError("Não foi possível salvar o acesso.");
    } finally {
      setSavingAccess(false);
    }
  };

  const resetModule = async (r: Respondent, sectionId: number) => {
    const section = sectionsFor(r).find((s) => s.id === sectionId);
    if (
      !window.confirm(
        `Apagar as respostas do módulo ${sectionId} — ${section?.title ?? ""}? O respondente poderá preenchê-lo novamente.`
      )
    ) {
      return;
    }
    setResetting(`${r.id}:${sectionId}`);
    try {
      await resetSection(r.id, sectionId);
      await refresh();
    } finally {
      setResetting(null);
    }
  };

  const resetAllAnswers = async (r: Respondent) => {
    if (
      !window.confirm(
        `Apagar TODAS as respostas de ${r.company} e reiniciar o preenchimento do zero?`
      )
    ) {
      return;
    }
    setResetting(r.id);
    try {
      await resetRespondent(r.id);
      setExpanded(null);
      await refresh();
    } finally {
      setResetting(null);
    }
  };

  const removeRespondent = async (r: Respondent) => {
    if (
      !window.confirm(
        `Excluir ${r.company} e todas as respostas? Essa ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    setResetting(r.id);
    try {
      await deleteRespondent(r.id);
      setExpanded(null);
      await refresh();
    } finally {
      setResetting(null);
    }
  };

  const handleExport = (r: Respondent | null, format: ExportFormat) => {
    if (r) {
      exportRespondent(r, rowsByRespondent.get(r.id) ?? [], sectionsFor(r), format);
    } else {
      exportAll(visibleRespondents, rows, sectionsFor, format);
    }
  };

  const statusColor = (status: string) => {
    if (status === "Concluído") return "bg-success/10 text-success";
    if (status === "Aguardando liberação") return "bg-warning/10 text-warning";
    return "bg-primary-soft text-primary-text";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brand />
            <h1 className="text-lg font-semibold text-ink">Painel administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-ink-muted mr-1">Exportar todos</span>
            <ExportButtons onExport={(f) => handleExport(null, f)} />
            <a
              href="/"
              className="text-xs text-ink-muted hover:text-ink-mid border border-line rounded-xl px-3 py-2 transition"
            >
              Ver formulário
            </a>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft border border-line rounded-xl px-3 py-2 hover:bg-canvas transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <FormsManager onFormsChanged={refresh} />

        {settings && (
          <div className="bg-white border border-line rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink-soft mb-4">Configurações</h2>
            <div className="space-y-3">
              <ToggleRow
                label="Exigir liberação manual do Admin para cada módulo"
                checked={settings.require_manual_release}
                onToggle={() => toggleSetting("require_manual_release")}
              />
              <ToggleRow
                label="Permitir que o respondente edite módulos já liberados"
                checked={settings.allow_edit_after_release}
                onToggle={() => toggleSetting("allow_edit_after_release")}
              />
            </div>
            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-sm font-semibold text-ink-soft mb-1">Acesso ao formulário padrão</p>
              <p className="text-xs text-ink-muted mb-3">
                Usado quando nenhum formulário personalizado corresponde à senha informada.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveAccess(form);
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div>
                  <label htmlFor="form-company" className="block text-xs font-semibold text-ink-soft mb-1.5">
                    Empresa exibida
                  </label>
                  <input
                    id="form-company"
                    value={form.form_company}
                    onChange={(e) => setForm((p) => ({ ...p, form_company: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label htmlFor="form-password" className="block text-xs font-semibold text-ink-soft mb-1.5">
                    Senha de acesso
                  </label>
                  <input
                    id="form-password"
                    value={form.form_password}
                    onChange={(e) => setForm((p) => ({ ...p, form_password: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingAccess || !form.form_password.trim() || !form.form_company.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-40 transition"
                  >
                    {savingAccess ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar acesso
                  </button>
                  {accessSaved && (
                    <span className="text-xs text-success">Acesso atualizado.</span>
                  )}
                  {accessError && (
                    <span className="text-xs text-error">{accessError}</span>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {respondents.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-8 text-center text-sm text-ink-muted">
            Nenhum respondente ainda.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <label htmlFor="form-filter" className="text-xs font-semibold text-ink-soft">
                Filtrar por formulário:
              </label>
              <select
                id="form-filter"
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">Todos</option>
                <option value="legacy">Padrão (Relica/Humana)</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.company}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {visibleRespondents.map((r) => {
                const rSections = sectionsFor(r);
                const isExpanded = expanded === r.id;
                const rRows = rowsByRespondent.get(r.id) ?? [];
                const waiting = r.status === "Aguardando liberação";
                const done = r.completed_sections.length;
                return (
                  <div key={r.id} className="bg-white border border-line rounded-2xl overflow-hidden">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-ink">{r.company}</p>
                          <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${statusColor(r.status)}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Módulo atual: {done}/{rSections.length} · Atualizado em{" "}
                          {new Date(r.updated_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {waiting && (
                      <button
                        onClick={() => releaseNext(r)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        Liberar próximo nível
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft hover:bg-canvas transition"
                    >
                      {isExpanded ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isExpanded ? "Fechar" : "Detalhes"}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line bg-canvas p-4 sm:p-5 space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-ink-soft mb-2">
                        Liberação de módulos (liberar até)
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button
                          onClick={() => releaseUpTo(r, rSections.length - 1)}
                          disabled={releasingAll === r.id}
                          className="text-xs font-semibold text-ink-mid border border-line bg-white rounded-full px-3 py-1.5 hover:bg-canvas disabled:opacity-50 transition"
                        >
                          Liberar todos
                        </button>
                        {rSections.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => releaseUpTo(r, s.id)}
                            disabled={releasingAll === r.id}
                            className={`text-xs rounded-full px-3 py-1.5 transition disabled:opacity-50 ${
                              r.completed_sections.includes(s.id)
                                ? "bg-success/10 text-success hover:bg-success/20"
                                : "bg-white border border-line text-ink-mid hover:bg-canvas"
                            }`}
                          >
                            {s.id}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-ink-muted">
                        Clique em um número para liberar todos os módulos até ele. Verde
                        significa concluído pelo respondente.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-ink-soft mb-2">
                        Resetar respostas
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {rSections.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => resetModule(r, s.id)}
                            disabled={resetting !== null}
                            title={`Apagar as respostas de ${s.title}`}
                            className="text-xs rounded-full bg-white border border-line text-ink-mid px-3 py-1.5 hover:border-error/40 hover:text-error disabled:opacity-50 transition"
                          >
                            {s.id}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => resetAllAnswers(r)}
                          disabled={resetting !== null}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-soft hover:border-warning/40 hover:text-warning disabled:opacity-50 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Apagar todas as respostas
                        </button>
                        <button
                          onClick={() => removeRespondent(r)}
                          disabled={resetting !== null}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-error hover:border-error/40 hover:bg-error/5 disabled:opacity-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir respondente
                        </button>
                      </div>
                      <p className="text-xs text-ink-muted mt-2">
                        Clique no número do módulo para apagar só aquelas respostas e liberar
                        o preenchimento novamente.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-ink-soft">Respostas</p>
                        <ExportButtons onExport={(f) => handleExport(r, f)} />
                      </div>
                      {rRows.length === 0 ? (
                        <p className="text-xs text-ink-muted">Nenhuma resposta ainda.</p>
                      ) : (
                        <div className="space-y-4">
                          {rSections.filter((s) =>
                            rRows.some((row) => row.section_id === s.id)
                          ).map((s) => (
                            <div key={s.id} className="bg-white border border-line rounded-2xl p-4">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <p className="text-sm font-semibold text-ink-soft">{s.title}</p>
                                <button
                                  onClick={() => resetModule(r, s.id)}
                                  disabled={resetting !== null}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-muted hover:text-error hover:bg-error/5 disabled:opacity-50 transition"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Resetar
                                </button>
                              </div>
                              <p className="text-xs text-ink-muted mb-3">{s.intro}</p>
                              <div className="space-y-3">
                                {s.questions.map((q, i) => {
                                  const answer =
                                    rRows.find(
                                      (row) =>
                                        row.section_id === s.id && row.question_id === q.id
                                    )?.answer ?? "";
                                  return (
                                    <div key={q.id} className="border-t border-line pt-3">
                                      <p className="text-xs font-medium text-ink-mid mb-1">
                                        {i + 1}. {q.text}
                                      </p>
                                      <p className="text-sm text-ink whitespace-pre-wrap">
                                        {answer || "—"}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <span className="text-sm text-ink-soft">{label}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        role="switch"
        aria-checked={checked}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-primary" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}

function ExportButtons({ onExport }: { onExport: (f: ExportFormat) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-canvas transition"
      >
        <Download className="w-3.5 h-3.5" />
        Exportar
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 w-44 bg-white border border-line rounded-xl shadow-lg py-1">
            {(
              ["md", "csv", "json"] as ExportFormat[]
            ).map((f) => {
              const labels: Record<ExportFormat, [typeof FileText, string]> = {
                md: [FileText, "Markdown (.md)"],
                csv: [FileSpreadsheet, "CSV (.csv)"],
                json: [FileJson, "JSON (.json)"],
              };
              const [Icon, label] = labels[f];
              return (
                <button
                  key={f}
                  onClick={() => {
                    setOpen(false);
                    onExport(f);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-soft hover:bg-canvas transition"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

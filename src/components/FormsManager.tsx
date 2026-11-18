import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import type { FormDef } from "../lib/types";
import type { Section } from "../data/sections";
import { createForm, deleteForm, isFormsTableReady, listForms, updateForm } from "../lib/forms";
import { parseImport, reindexSections } from "../lib/importForm";

interface Props {
  onFormsChanged: () => void;
}

export default function FormsManager({ onFormsChanged }: Props) {
  const [forms, setForms] = useState<FormDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(true);
  const [editing, setEditing] = useState<FormDef | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setTableReady(await isFormsTableReady());
      setForms(await listForms());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="bg-white border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink-soft">Formulários</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Crie formulários para outras empresas ou edite as perguntas importadas.
          </p>
        </div>
        <button
          onClick={() => {
            setIsNew(true);
            setEditing(null);
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo formulário
        </button>
      </div>

      {!tableReady && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-warning">
          A tabela <span className="font-mono">forms</span> ainda não existe no Supabase. Rode a
          migration <span className="font-mono">supabase/migrations/20261118180000_multi_form_support.sql</span>{" "}
          no SQL Editor. Enquanto isso, os formulários são salvos apenas no localStorage deste navegador.
        </div>
      )}

      {showCreate && (
        <FormEditor
          initial={editing}
          isNew={isNew}
          onCancel={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowCreate(false);
            setEditing(null);
            await reload();
            onFormsChanged();
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
        </div>
      ) : forms.length === 0 ? (
        <p className="text-xs text-ink-muted py-4">
          Nenhum formulário personalizado ainda. O formulário padrão da Relica/HL Humana continua ativo.
        </p>
      ) : (
        <div className="space-y-2">
          {forms.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-soft">{f.company}</p>
                <p className="text-xs text-ink-muted truncate">
                  {f.sections.length} módulos · senha: <span className="font-mono">{f.password}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsNew(false);
                    setEditing(f);
                    setShowCreate(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-white transition"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Excluir o formulário de ${f.company}?`)) return;
                    await deleteForm(f.id);
                    await reload();
                    onFormsChanged();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-error hover:bg-error/5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormEditor({
  initial,
  isNew,
  onCancel,
  onSaved,
}: {
  initial: FormDef | null;
  isNew: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [sections, setSections] = useState<Section[]>(
    initial?.sections.length ? reindexSections(initial.sections) : []
  );
  const [importText, setImportText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sectionCount = sections.length;
  const questionCount = useMemo(
    () => sections.reduce((n, s) => n + s.questions.length, 0),
    [sections]
  );

  const handleImport = () => {
    if (!importText.trim()) return;
    const parsed = parseImport(importText);
    if (!parsed.sections.length) {
      setParseError("Não foi possível extrair perguntas do texto importado.");
      return;
    }
    setParseError(null);
    if (parsed.company && !company) setCompany(parsed.company);
    setSections(reindexSections(parsed.sections));
    setImportText("");
  };

  const save = async () => {
    if (!company.trim() || !password.trim() || !sections.length) {
      setParseError("Preencha empresa, senha e importe ao menos um módulo com perguntas.");
      return;
    }
    setSaving(true);
    setParseError(null);
    try {
      if (isNew) {
        await createForm({ company, password, sections });
      } else if (initial) {
        await updateForm(initial.id, { company, password, sections });
      }
      onSaved();
    } catch {
      setParseError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-line bg-canvas p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-soft">
          {isNew ? "Novo formulário" : `Editar ${initial?.company}`}
        </p>
        <button onClick={onCancel} className="text-ink-muted hover:text-ink-mid">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Empresa</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Nome da empresa"
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Senha de acesso</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha para o respondente"
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">
          Importar perguntas (JSON / Markdown / texto)
        </label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={5}
          placeholder={`Cole aqui o roteiro gerado pela IA. Exemplo JSON:\n{ "company": "Acme", "password": "acme", "sections": [ { "title": "Módulo 1", "questions": ["Pergunta 1?", "Pergunta 2?"] } ] }`}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft hover:bg-canvas disabled:opacity-40 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar
          </button>
          <p className="text-xs text-ink-muted">
            {questionCount > 0
              ? `${sectionCount} módulos · ${questionCount} perguntas carregadas`
              : "Nada importado ainda"}
          </p>
        </div>
      </div>

      {parseError && <p className="text-xs text-error">{parseError}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !company.trim() || !password.trim() || !sections.length}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-40 transition"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar formulário
        </button>
        <button onClick={onCancel} className="text-xs text-ink-muted hover:text-ink-mid">
          Cancelar
        </button>
      </div>

      {sections.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sections.map((s) => (
            <div key={s.id} className="rounded-xl border border-line bg-white p-3">
              <p className="text-xs font-semibold text-ink-soft mb-1">{s.title}</p>
              {s.intro && <p className="text-[11px] text-ink-muted mb-1.5">{s.intro}</p>}
              <ol className="space-y-1">
                {s.questions.map((q, i) => (
                  <li key={q.id} className="text-[11px] text-ink-mid flex gap-1.5">
                    <FileText className="w-3 h-3 text-ink-muted mt-0.5 shrink-0" />
                    <span>
                      {i + 1}. {q.text}
                      {q.optional ? " (não obrigatória)" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import type { Section } from "../data/sections";

export interface ParsedForm {
  company?: string;
  password?: string;
  sections: Section[];
}

function isOptionalText(text: string): boolean {
  return /\(?\s*n[ãa]o\s+obrigat[óo]ria\s*\)?/i.test(text);
}

function cleanText(text: string): { text: string; optional: boolean } {
  const optional = isOptionalText(text);
  const cleaned = text
    .replace(/\(?\s*n[ãa]o\s+obrigat[óo]ria\s*\)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { text: cleaned, optional };
}

function buildSections(
  raw: { title?: string; intro?: string; questions: { text: string; optional?: boolean }[] }[]
): Section[] {
  return raw
    .map((s, index) => ({
      id: index,
      title: (s.title ?? `Módulo ${index + 1}`).trim() || `Módulo ${index + 1}`,
      intro: (s.intro ?? "").trim(),
      questions: s.questions
        .filter((q) => q.text.trim().length > 0)
        .map((q, qi) => ({
          id: `q${qi + 1}`,
          text: q.text.trim(),
          ...(q.optional ? { optional: true } : {}),
        })),
    }))
    .filter((s) => s.questions.length > 0);
}

interface RawSection {
  title?: string;
  intro?: string;
  questions: { text: string; optional?: boolean }[];
}

function parseJson(value: unknown): ParsedForm | null {
  if (Array.isArray(value)) {
    const sections = normalizeJsonSections(value);
    return sections.length ? { sections } : null;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = obj.sections ?? obj.modules ?? obj.secoes ?? obj.sessoes;
    if (!Array.isArray(candidates)) return null;
    const sections = normalizeJsonSections(candidates);
    if (!sections.length) return null;
    return {
      sections,
      company:
        typeof obj.company === "string"
          ? obj.company
          : typeof obj.empresa === "string"
            ? obj.empresa
            : undefined,
      password:
        typeof obj.password === "string"
          ? obj.password
          : typeof obj.senha === "string"
            ? obj.senha
            : undefined,
    };
  }
  return null;
}

function normalizeJsonSections(list: unknown[]): Section[] {
  const raw: RawSection[] = [];
  for (const item of list) {
    if (typeof item === "string") {
      raw.push({ title: item, questions: [] });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const questionsRaw = s.questions ?? s.perguntas ?? s.items;
    const questions: { text: string; optional?: boolean }[] = [];
    if (Array.isArray(questionsRaw)) {
      for (const q of questionsRaw) {
        if (typeof q === "string") {
          const { text, optional } = cleanText(q);
          if (text) questions.push({ text, optional });
        } else if (q && typeof q === "object") {
          const qo = q as Record<string, unknown>;
          const text = qo.text ?? qo.question ?? qo.pergunta ?? qo.title;
          if (typeof text === "string") {
            const cleaned = cleanText(text);
            questions.push({
              text: cleaned.text,
              optional: cleaned.optional || qo.optional === true || qo.obrigatoria === false,
            });
          }
        }
      }
    }
    raw.push({
      title: typeof s.title === "string" ? s.title : typeof s.titulo === "string" ? s.titulo : undefined,
      intro:
        typeof s.intro === "string"
          ? s.intro
          : typeof s.description === "string"
            ? s.description
            : typeof s.descricao === "string"
              ? s.descricao
              : undefined,
      questions,
    });
  }
  return buildSections(raw);
}

function parseText(raw: string): ParsedForm {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const rawSections: RawSection[] = [];
  let current: RawSection | null = null;
  let company: string | undefined;

  const pushSection = () => {
    if (current && current.questions.length) rawSections.push(current);
    else if (current && !current.questions.length && current.title) rawSections.push(current);
  };

  const ensure = () => {
    if (!current) {
      current = { title: `Módulo ${rawSections.length + 1}`, questions: [] };
    }
    return current;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level <= 2) {
        pushSection();
        current = { title: text, questions: [] };
      } else {
        ensure();
        const { text: qt, optional } = cleanText(text);
        current!.questions.push({ text: qt, optional });
      }
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const introText = trimmed.replace(/^>\s?/, "").trim();
      ensure();
      current!.intro = current!.intro ? `${current!.intro} ${introText}` : introText;
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      ensure();
      const { text: qt, optional } = cleanText(bullet[1]);
      if (qt) current!.questions.push({ text: qt, optional });
      continue;
    }

    const meta = trimmed.match(/^(empresa|company|senha|password)\s*[:=]\s*(.+)$/i);
    if (meta) {
      const key = meta[1].toLowerCase();
      if (key === "empresa" || key === "company") company = meta[2].trim();
      continue;
    }

    ensure();
    const { text: qt, optional } = cleanText(trimmed);
    if (qt) current!.questions.push({ text: qt, optional });
  }
  pushSection();

  return { company, sections: buildSections(rawSections) };
}

/**
 * Imports the AI generated script in JSON, Markdown or plain text.
 */
export function parseImport(raw: string): ParsedForm {
  const trimmed = raw.trim();
  if (!trimmed) return { sections: [] };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed) as unknown;
      const parsed = parseJson(json);
      if (parsed && parsed.sections.length) return parsed;
    } catch {
      // fall back to text parsing
    }
  }

  return parseText(trimmed);
}

export function emptySection(index: number): Section {
  return {
    id: index,
    title: `Módulo ${index + 1}`,
    intro: "",
    questions: [{ id: "q1", text: "" }],
  };
}

export function reindexSections(sections: Section[]): Section[] {
  return sections.map((s, index) => ({
    ...s,
    id: index,
    questions: s.questions.map((q, qi) => ({ ...q, id: `q${qi + 1}` })),
  }));
}

export function toImportJson(company: string, password: string, sections: Section[]): string {
  return JSON.stringify(
    {
      company,
      password,
      sections: sections.map((s) => ({
        title: s.title,
        intro: s.intro,
        questions: s.questions.map((q) => ({ text: q.text, optional: q.optional === true })),
      })),
    },
    null,
    2
  );
}
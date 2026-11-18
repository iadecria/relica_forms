import type { Respondent, ResponseRow } from "./types";
import type { Section } from "../data/sections";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
}

function sortRows(rows: ResponseRow[]) {
  return [...rows].sort(
    (a, b) =>
      a.section_id - b.section_id ||
      a.question_id.localeCompare(b.question_id, undefined, { numeric: true })
  );
}

function toMarkdown(r: Respondent, rows: ResponseRow[], sections: Section[]): string {
  const answered = rows.filter((row) => row.answer.trim()).length;
  const lines: string[] = [
    `# Descoberta HL Humana — ${r.company}`,
    "",
    `> Documento gerado pela Relica para configuração do sistema da ${r.company}.`,
    "",
    "## Identificação",
    "",
    `- Empresa: ${r.company}`,
    `- Status: ${r.status}`,
    `- Módulos concluídos: ${r.completed_sections.length} de ${sections.length}`,
    `- Perguntas respondidas: ${answered}`,
    `- Última atualização: ${new Date(r.updated_at).toLocaleString("pt-BR")}`,
    "",
    "---",
    "",
  ];
  for (const section of sections) {
    const sRows = sortRows(rows.filter((row) => row.section_id === section.id));
    const status = r.completed_sections.includes(section.id) ? "Concluído" : "Em andamento";
    lines.push(
      `## ${section.title}`,
      "",
      `Status do módulo: ${status}`,
      ""
    );
    if (section.intro) lines.push(`> ${section.intro}`, "");
    section.questions.forEach((q, i) => {
      const answer = sRows.find((row) => row.question_id === q.id)?.answer ?? "";
      lines.push(
        `### ${i + 1}. ${q.text}${q.optional ? " (não obrigatória)" : ""}`,
        "",
        answer.trim() || "_Sem resposta._",
        ""
      );
    });
    lines.push("---", "");
  }
  return lines.join("\n");
}

function toCsv(r: Respondent, rows: ResponseRow[], sections: Section[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = ["respondente,empresa,secao,pergunta,resposta"];
  for (const section of sections) {
    const sRows = rows.filter((row) => row.section_id === section.id);
    section.questions.forEach((q, i) => {
      const answer = sRows.find((row) => row.question_id === q.id)?.answer ?? "";
      lines.push(
        [
          esc(r.company),
          esc(r.company),
          esc(section.title),
          esc(`${i + 1}. ${q.text}`),
          esc(answer),
        ].join(",")
      );
    });
  }
  return lines.join("\n");
}

function toJson(r: Respondent, rows: ResponseRow[], sections: Section[]): object {
  return {
    respondent: {
      company: r.company,
      status: r.status,
      updated_at: r.updated_at,
    },
    responses: sections.map((section) => ({
      section: section.title,
      intro: section.intro,
      answers: section.questions.map((q, i) => ({
        question: `${i + 1}. ${q.text}`,
        answer:
          rows.find((row) => row.section_id === section.id && row.question_id === q.id)
            ?.answer ?? "",
      })),
    })),
  };
}

export type ExportFormat = "md" | "csv" | "json";

export function exportRespondent(
  r: Respondent,
  rows: ResponseRow[],
  sections: Section[],
  format: ExportFormat
) {
  const base = `descoberta-${slug(r.company)}`;
  if (format === "md") download(`${base}.md`, toMarkdown(r, rows, sections), "text/markdown");
  if (format === "csv") download(`${base}.csv`, toCsv(r, rows, sections), "text/csv");
  if (format === "json")
    download(`${base}.json`, JSON.stringify(toJson(r, rows, sections), null, 2), "application/json");
}

export function exportAll(
  respondents: Respondent[],
  allRows: ResponseRow[],
  sectionsFor: (r: Respondent) => Section[],
  format: ExportFormat
) {
  if (respondents.length === 0) return;
  const base = `descoberta-todos-${new Date().toISOString().slice(0, 10)}`;
  if (format === "md") {
    const md = respondents
      .map((r, i) => {
        const rows = allRows.filter((row) => row.respondent_id === r.id);
        return (i > 0 ? "---\n\n" : "") + toMarkdown(r, rows, sectionsFor(r));
      })
      .join("\n");
    download(`${base}.md`, md, "text/markdown");
    return;
  }
  if (format === "csv") {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = ["respondente,empresa,secao,pergunta,resposta"];
    for (const r of respondents) {
      const rows = allRows.filter((row) => row.respondent_id === r.id);
      for (const section of sectionsFor(r)) {
        const sRows = rows.filter((row) => row.section_id === section.id);
        section.questions.forEach((q, i) => {
          const answer = sRows.find((row) => row.question_id === q.id)?.answer ?? "";
          lines.push(
            [
              esc(r.company),
              esc(r.company),
              esc(section.title),
              esc(`${i + 1}. ${q.text}`),
              esc(answer),
            ].join(",")
          );
        });
      }
    }
    download(`${base}.csv`, lines.join("\n"), "text/csv");
    return;
  }
  const json = JSON.stringify(
    respondents.map((r) => toJson(r, allRows.filter((row) => row.respondent_id === r.id), sectionsFor(r))),
    null,
    2
  );
  download(`${base}.json`, json, "application/json");
}

export { toMarkdown as buildMarkdown };
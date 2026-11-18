import { supabase } from "./supabase";
import type { Respondent, RespondentStatus, ResponseRow, Settings } from "./types";

// localStorage fallback (demo mode) -------------------------------------------------

const LS_KEY = "descoberta_humana_v1";

interface LocalDb {
  respondents: Respondent[];
  responses: ResponseRow[];
  settings: Settings;
}

function readLocal(): LocalDb {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as LocalDb;
    } catch {
      // fall through to default
    }
  }
  return {
    respondents: [],
    responses: [],
    settings: {
      id: 1,
      require_manual_release: true,
      allow_edit_after_release: false,
      form_password: "humana",
      form_company: "Humana",
    },
  };
}

function writeLocal(db: LocalDb) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function computeStatus(r: Respondent): RespondentStatus {
  if (r.completed_sections.length >= 12) return "Concluído";
  if (r.status === "Aguardando liberação") return "Aguardando liberação";
  return "Em preenchimento";
}

// API --------------------------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const defaults: Settings = {
    id: 1,
    require_manual_release: true,
    allow_edit_after_release: false,
    form_password: "humana",
    form_company: "Humana",
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (data) return { ...defaults, ...(data as Partial<Settings>) } as Settings;
  }
  return { ...defaults, ...readLocal().settings };
}

export async function saveSettings(s: Partial<Settings>): Promise<Settings> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("settings")
        .upsert({ id: 1, ...s })
        .select()
        .single();
      if (error) throw error;
      return data as Settings;
    } catch (err) {
      // The form_password/form_company columns may not exist yet (migration
      // pending). Keep the other toggles working instead of failing entirely.
      const base = { ...s } as Record<string, unknown>;
      delete base.form_password;
      delete base.form_company;
      const { data, error } = await supabase
        .from("settings")
        .upsert({ id: 1, ...base })
        .select()
        .single();
      if (error) throw err;
      return { ...(data as unknown as Settings), ...s } as Settings;
    }
  }
  const db = readLocal();
  db.settings = { ...db.settings, ...s };
  writeLocal(db);
  return db.settings;
}

export async function createRespondent(input: {
  name: string;
  role: string;
  whatsapp: string;
  company: string;
  form_id?: string | null;
}): Promise<Respondent> {
  if (supabase) {
    const { data, error } = await supabase
      .from("respondents")
      .insert(input)
      .select()
      .single();
    if (error) {
      // form_id column may not exist yet (migration pending) — retry without it.
      if ("form_id" in input && input.form_id != null) {
        const { form_id: _ignored, ...rest } = input;
        const { data: retryData, error: retryError } = await supabase
          .from("respondents")
          .insert(rest)
          .select()
          .single();
        if (!retryError) return retryData as Respondent;
      } else if ("form_id" in input) {
        const { form_id: _ignored, ...rest } = input;
        const { data: retryData } = await supabase
          .from("respondents")
          .insert(rest)
          .select()
          .single();
        if (retryData) return retryData as Respondent;
      }
      throw error;
    }
    return data as Respondent;
  }
  const db = readLocal();
  const now = new Date().toISOString();
  const r: Respondent = {
    id: uid(),
    name: input.name,
    role: input.role,
    whatsapp: input.whatsapp,
    company: input.company,
    form_id: input.form_id ?? null,
    current_section: 0,
    completed_sections: [],
    status: "Em preenchimento",
    created_at: now,
    updated_at: now,
  };
  db.respondents.push(r);
  writeLocal(db);
  return r;
}

export async function findRespondentByWhatsApp(
  whatsapp: string
): Promise<Respondent | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("respondents")
      .select("*")
      .eq("whatsapp", whatsapp)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as Respondent) ?? null;
  }
  const db = readLocal();
  return (
    db.respondents
      .filter((r) => r.whatsapp === whatsapp)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
  );
}

/**
 * Finds the most recent session for a company so a returning participant can
 * resume where they stopped (e.g. after clearing the browser or on another device).
 */
export async function findRespondentByCompany(
  company: string
): Promise<Respondent | null> {
  const target = company.trim().toLowerCase();
  if (supabase) {
    const { data, error } = await supabase
      .from("respondents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const rows = (data ?? []) as Respondent[];
    return rows.find((r) => r.company.trim().toLowerCase() === target) ?? null;
  }
  const db = readLocal();
  return (
    db.respondents
      .filter((r) => r.company.trim().toLowerCase() === target)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null
  );
}

/**
 * Returns the most recent session for a given form (falling back to company
 * when form_id is not available yet) so a returning participant resumes.
 */
export async function findRespondentByForm(
  formId: string | null,
  company: string
): Promise<Respondent | null> {
  const byCompany = (rows: Respondent[]) =>
    rows
      .filter((r) => r.company.trim().toLowerCase() === company.trim().toLowerCase())
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;

  if (supabase) {
    if (formId) {
      const { data, error } = await supabase
        .from("respondents")
        .select("*")
        .eq("form_id", formId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return data as Respondent;
    }
    const { data, error } = await supabase
      .from("respondents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return byCompany((data ?? []) as Respondent[]);
  }

  const db = readLocal();
  if (formId) {
    const match = db.respondents
      .filter((r) => r.form_id === formId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    if (match) return match;
  }
  return byCompany(db.respondents);
}

export async function getRespondent(id: string): Promise<Respondent | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("respondents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Respondent) ?? null;
  }
  return readLocal().respondents.find((r) => r.id === id) ?? null;
}

export async function listRespondents(): Promise<Respondent[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("respondents")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data as Respondent[]) ?? [];
  }
  return readLocal().respondents.sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at)
  );
}

export async function updateRespondent(
  id: string,
  patch: Partial<Respondent>
): Promise<Respondent | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("respondents")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return (data as Respondent) ?? null;
  }
  const db = readLocal();
  const idx = db.respondents.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db.respondents[idx] = {
    ...db.respondents[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  writeLocal(db);
  return db.respondents[idx];
}

export async function getResponses(
  respondentId: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (supabase) {
    const { data, error } = await supabase
      .from("responses")
      .select("section_id, question_id, answer")
      .eq("respondent_id", respondentId);
    if (error) throw error;
    for (const row of (data ?? []) as Pick<ResponseRow, "section_id" | "question_id" | "answer">[]) {
      map.set(`${row.section_id}:${row.question_id}`, row.answer);
    }
  } else {
    const db = readLocal();
    for (const row of db.responses) {
      if (row.respondent_id === respondentId) {
        map.set(`${row.section_id}:${row.question_id}`, row.answer);
      }
    }
  }
  return map;
}

export async function saveAnswer(
  respondentId: string,
  sectionId: number,
  questionId: string,
  answer: string
): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("responses").upsert(
      {
        respondent_id: respondentId,
        section_id: sectionId,
        question_id: questionId,
        answer,
      },
      { onConflict: "respondent_id,section_id,question_id" }
    );
    if (error) throw error;
    return;
  }
  const db = readLocal();
  const key = (r: ResponseRow) =>
    r.respondent_id === respondentId &&
    r.section_id === sectionId &&
    r.question_id === questionId;
  const idx = db.responses.findIndex(key);
  if (idx >= 0) {
    db.responses[idx] = {
      ...db.responses[idx],
      answer,
      updated_at: new Date().toISOString(),
    };
  } else {
    db.responses.push({
      id: uid(),
      respondent_id: respondentId,
      section_id: sectionId,
      question_id: questionId,
      answer,
      updated_at: new Date().toISOString(),
    });
  }
  writeLocal(db);
}

export async function getAllResponses(): Promise<ResponseRow[]> {
  if (supabase) {
    const { data, error } = await supabase.from("responses").select("*");
    if (error) throw error;
    return (data as ResponseRow[]) ?? [];
  }
  return readLocal().responses;
}

/**
 * Clears every answer of a single module and reopens it for the respondent.
 */
export async function resetSection(
  respondentId: string,
  sectionId: number
): Promise<void> {
  if (supabase) {
    const { error: delError } = await supabase
      .from("responses")
      .delete()
      .eq("respondent_id", respondentId)
      .eq("section_id", sectionId);
    if (delError) throw delError;

    const { data, error } = await supabase
      .from("respondents")
      .select("completed_sections, current_section")
      .eq("id", respondentId)
      .maybeSingle();
    if (error) throw error;
    const current = data as Pick<Respondent, "completed_sections" | "current_section"> | null;
    const completed = (current?.completed_sections ?? []).filter((id) => id !== sectionId);
    const { error: updError } = await supabase
      .from("respondents")
      .update({
        completed_sections: completed,
        current_section: Math.min(current?.current_section ?? sectionId, sectionId),
        status: "Em preenchimento",
      })
      .eq("id", respondentId);
    if (updError) throw updError;
    return;
  }

  const db = readLocal();
  db.responses = db.responses.filter(
    (r) => !(r.respondent_id === respondentId && r.section_id === sectionId)
  );
  const idx = db.respondents.findIndex((r) => r.id === respondentId);
  if (idx >= 0) {
    const r = db.respondents[idx];
    db.respondents[idx] = {
      ...r,
      completed_sections: r.completed_sections.filter((id) => id !== sectionId),
      current_section: Math.min(r.current_section, sectionId),
      status: "Em preenchimento",
      updated_at: new Date().toISOString(),
    };
  }
  writeLocal(db);
}

/**
 * Wipes every answer and progress of a respondent, keeping the session itself.
 */
export async function resetRespondent(respondentId: string): Promise<void> {
  if (supabase) {
    const { error: delError } = await supabase
      .from("responses")
      .delete()
      .eq("respondent_id", respondentId);
    if (delError) throw delError;
    const { error } = await supabase
      .from("respondents")
      .update({
        completed_sections: [],
        current_section: 0,
        status: "Em preenchimento",
      })
      .eq("id", respondentId);
    if (error) throw error;
    return;
  }

  const db = readLocal();
  db.responses = db.responses.filter((r) => r.respondent_id !== respondentId);
  const idx = db.respondents.findIndex((r) => r.id === respondentId);
  if (idx >= 0) {
    db.respondents[idx] = {
      ...db.respondents[idx],
      completed_sections: [],
      current_section: 0,
      status: "Em preenchimento",
      updated_at: new Date().toISOString(),
    };
  }
  writeLocal(db);
}

/**
 * Removes the respondent and all of its answers.
 */
export async function deleteRespondent(respondentId: string): Promise<void> {
  if (supabase) {
    const { error: delError } = await supabase
      .from("responses")
      .delete()
      .eq("respondent_id", respondentId);
    if (delError) throw delError;
    const { error } = await supabase.from("respondents").delete().eq("id", respondentId);
    if (error) throw error;
    return;
  }

  const db = readLocal();
  db.responses = db.responses.filter((r) => r.respondent_id !== respondentId);
  db.respondents = db.respondents.filter((r) => r.id !== respondentId);
  writeLocal(db);
}

// Derived helpers -------------------------------------------------------------------

export function computeRespondentStatus(r: Respondent): RespondentStatus {
  if (supabase) {
    if (r.completed_sections.length >= 12) return "Concluído";
    return r.status;
  }
  return computeStatus(r);
}

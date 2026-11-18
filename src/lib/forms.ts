import { supabase } from "./supabase";
import type { FormDef } from "./types";
import { DEFAULT_SECTIONS } from "../data/sections";
import { reindexSections } from "./importForm";
import { getSettings } from "./db";

const LS_KEY = "relica_forms_v1";

function readLocal(): FormDef[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as FormDef[];
  } catch {
    // ignore
  }
  return [];
}

function writeLocal(forms: FormDef[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(forms));
}

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

let formsReadyCache: boolean | null = null;

/**
 * True when the forms table is reachable (or when running without Supabase).
 * False means the migration has not been applied yet.
 */
export async function isFormsTableReady(): Promise<boolean> {
  if (!supabase) return false;
  if (formsReadyCache !== null) return formsReadyCache;
  const { error } = await supabase.from("forms").select("id").limit(1);
  formsReadyCache = !error;
  return formsReadyCache;
}

export async function listForms(): Promise<FormDef[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...(row as Omit<FormDef, "sections">),
        sections: reindexSections(
          Array.isArray((row as FormDef).sections) ? (row as FormDef).sections : []
        ),
      })) as FormDef[];
    } catch {
      return readLocal();
    }
  }
  return readLocal();
}

export async function createForm(input: {
  company: string;
  password: string;
  sections: FormDef["sections"];
}): Promise<FormDef> {
  const sections = reindexSections(input.sections);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("forms")
        .insert({
          company: input.company.trim(),
          password: input.password.trim(),
          sections,
        })
        .select()
        .single();
      if (error) throw error;
      return { ...(data as Omit<FormDef, "sections">), sections } as FormDef;
    } catch {
      // table not created yet -> fall through to local
    }
  }
  const forms = readLocal();
  const now = new Date().toISOString();
  const created: FormDef = {
    id: uid(),
    company: input.company.trim(),
    password: input.password.trim(),
    sections,
    created_at: now,
    updated_at: now,
  };
  forms.push(created);
  writeLocal(forms);
  return created;
}

export async function updateForm(
  id: string,
  patch: Partial<Pick<FormDef, "company" | "password" | "sections">>
): Promise<void> {
  const sectionsPatch = patch.sections ? reindexSections(patch.sections) : undefined;
  if (supabase) {
    try {
      const { error } = await supabase
        .from("forms")
        .update({
          ...patch,
          ...(sectionsPatch ? { sections: sectionsPatch } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      return;
    } catch {
      // fall through to local
    }
  }
  const forms = readLocal();
  const idx = forms.findIndex((f) => f.id === id);
  if (idx < 0) return;
  forms[idx] = {
    ...forms[idx],
    ...patch,
    sections: sectionsPatch ?? forms[idx].sections,
    updated_at: new Date().toISOString(),
  };
  writeLocal(forms);
}

export async function deleteForm(id: string): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from("forms").delete().eq("id", id);
      if (error) throw error;
      return;
    } catch {
      // fall through to local
    }
  }
  writeLocal(readLocal().filter((f) => f.id !== id));
}

/**
 * Resolves the form for a typed password: custom forms first, then the
 * legacy default form configured in settings (so "humana" keeps working).
 */
export async function findFormByPassword(password: string): Promise<FormDef | null> {
  const key = normalizeKey(password);
  if (!key) return null;
  const forms = await listForms();
  const match = forms.find((f) => normalizeKey(f.password) === key);
  if (match) return match;

  try {
    const settings = await getSettings();
    const legacyKey = normalizeKey(settings.form_password ?? "");
    if (legacyKey && legacyKey === key) {
      return legacyForm(settings.form_company || "HL Humana", password);
    }
  } catch {
    // settings unavailable
  }
  return null;
}

export async function getFormById(id: string | null | undefined): Promise<FormDef | null> {
  if (!id) return null;
  const forms = await listForms();
  return forms.find((f) => f.id === id) ?? null;
}

/**
 * Legacy fallback: the original hardcoded form is used when the forms table
 * has not been created or no custom form matches the password.
 */
export async function legacyForm(
  company: string,
  password: string
): Promise<FormDef> {
  const now = new Date().toISOString();
  return {
    id: "legacy",
    company,
    password,
    sections: DEFAULT_SECTIONS,
    created_at: now,
    updated_at: now,
  };
}

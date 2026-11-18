export type RespondentStatus =
  | "Em preenchimento"
  | "Aguardando liberação"
  | "Concluído";

import type { Section } from "../data/sections";

export interface Respondent {
  id: string;
  name: string;
  role: string;
  whatsapp: string;
  company: string;
  form_id: string | null;
  current_section: number;
  completed_sections: number[];
  status: RespondentStatus;
  created_at: string;
  updated_at: string;
}

export interface FormDef {
  id: string;
  company: string;
  password: string;
  sections: import("../data/sections").Section[];
  created_at: string;
  updated_at: string;
}

export type ResponseMap = Record<string, string>;

export interface ResponseRow {
  id: string;
  respondent_id: string;
  section_id: number;
  question_id: string;
  answer: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  require_manual_release: boolean;
  allow_edit_after_release: boolean;
  form_password: string;
  form_company: string;
}

export interface FormRow {
  id: string;
  company: string;
  password: string;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

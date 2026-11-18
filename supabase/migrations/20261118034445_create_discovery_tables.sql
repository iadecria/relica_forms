/*
# Descoberta Humana — respondents, responses, settings

1. New Tables
- `respondents`: one row per participant of the discovery form.
  - `id` (uuid, primary key, default gen_random_uuid())
  - `name` (text, not null) — participant full name
  - `role` (text, not null) — job title
  - `whatsapp` (text, not null) — used for session resume lookup
  - `company` (text, not null) — company name
  - `current_section` (integer, not null, default 0) — section the participant is on
  - `completed_sections` (integer array, not null, default empty) — completed section ids
  - `status` (text, not null, default 'Em preenchimento') — 'Em preenchimento', 'Aguardando liberação' or 'Concluído'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
- `responses`: one row per answered question.
  - `id` (uuid, primary key, default gen_random_uuid())
  - `respondent_id` (uuid, not null, FK to respondents ON DELETE CASCADE)
  - `section_id` (integer, not null) — 0..11
  - `question_id` (text, not null) — e.g. 'q1'
  - `answer` (text, not null, default '')
  - `updated_at` (timestamptz, default now())
  - UNIQUE (respondent_id, section_id, question_id) — enables upsert from the client
- `settings`: single row (id = 1) with admin configuration.
  - `id` (integer, primary key)
  - `require_manual_release` (boolean, default true)
  - `allow_edit_after_release` (boolean, default false)

2. Security
- Enable RLS on all three tables.
- This is a single-tenant, no-sign-in app: the anon-key client must read and write.
  Policies target `anon, authenticated` using `(true)`, which is intentional here
  because the app is a shared internal discovery form with no user accounts.
- Grant SELECT/INSERT/UPDATE/DELETE to `anon` and `authenticated` on all three tables.
- Index on `responses(respondent_id)` for per-respondent lookups.

3. Notes
- No auth users are involved; no `auth.uid()` ownership checks are applicable.
- The `responses` unique constraint allows `onConflict: "respondent_id,section_id,question_id"` upserts.
*/

CREATE TABLE IF NOT EXISTS respondents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  whatsapp text NOT NULL,
  company text NOT NULL,
  current_section integer NOT NULL DEFAULT 0,
  completed_sections integer[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Em preenchimento',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id uuid NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  section_id integer NOT NULL,
  question_id text NOT NULL,
  answer text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (respondent_id, section_id, question_id)
);

CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY,
  require_manual_release boolean NOT NULL DEFAULT true,
  allow_edit_after_release boolean NOT NULL DEFAULT false
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS responses_respondent_id_idx ON responses (respondent_id);

ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON respondents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON responses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_respondents" ON respondents;
CREATE POLICY "anon_select_respondents" ON respondents FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_respondents" ON respondents;
CREATE POLICY "anon_insert_respondents" ON respondents FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_respondents" ON respondents;
CREATE POLICY "anon_update_respondents" ON respondents FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_respondents" ON respondents;
CREATE POLICY "anon_delete_respondents" ON respondents FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_responses" ON responses;
CREATE POLICY "anon_select_responses" ON responses FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_responses" ON responses;
CREATE POLICY "anon_insert_responses" ON responses FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_responses" ON responses;
CREATE POLICY "anon_update_responses" ON responses FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_responses" ON responses;
CREATE POLICY "anon_delete_responses" ON responses FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

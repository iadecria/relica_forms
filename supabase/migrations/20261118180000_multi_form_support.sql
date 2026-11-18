-- ============================================================
-- Relica Forms — migration completa (rode tudo no SQL Editor)
-- Inclui colunas novas em settings/respondents e a tabela forms.
-- ============================================================

-- 1) settings: senha/acesso do formulário padrão (gerenciado no admin)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS form_password text NOT NULL DEFAULT 'humana';
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS form_company text NOT NULL DEFAULT 'Humana';

UPDATE settings
SET form_password = 'humana', form_company = 'Humana'
WHERE id = 1 AND (form_password IS NULL OR form_password = '' OR form_company IS NULL OR form_company = '');

-- 2) respondents: vínculo com o formulário personalizado
ALTER TABLE respondents
  ADD COLUMN IF NOT EXISTS form_id uuid;

-- 3) forms: formulários personalizados criados no admin
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  password text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON forms TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_forms" ON forms;
CREATE POLICY "anon_select_forms" ON forms FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_forms" ON forms;
CREATE POLICY "anon_insert_forms" ON forms FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_forms" ON forms;
CREATE POLICY "anon_update_forms" ON forms FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_forms" ON forms;
CREATE POLICY "anon_delete_forms" ON forms FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS forms_company_idx ON forms (company);
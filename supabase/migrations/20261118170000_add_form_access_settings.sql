-- Adds the discovery form access password to the single settings row.
-- Managed exclusively by the admin panel; the respondent only enters the password.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS form_password text NOT NULL DEFAULT 'humana';

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS form_company text NOT NULL DEFAULT 'Humana';

UPDATE settings
SET form_password = 'humana', form_company = 'Humana'
WHERE id = 1 AND (form_password IS NULL OR form_password = '' OR form_company IS NULL OR form_company = '');
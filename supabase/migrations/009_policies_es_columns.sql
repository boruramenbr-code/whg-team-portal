-- ============================================================
-- Add Spanish translation columns to the policies table.
-- Each translatable text column gets a corresponding _es column.
-- The app shows _es content when the user toggles to Spanish,
-- but signatures are language-agnostic (sign once).
-- ============================================================

alter table policies
  add column if not exists purpose_es            text,
  add column if not exists details_es            text,
  add column if not exists consequences_es       text,
  add column if not exists acknowledgment_text_es text,
  add column if not exists location_notes_es     text;

-- Add a comment so future devs know what these are for
comment on column policies.purpose_es            is 'Spanish translation of purpose';
comment on column policies.details_es            is 'Spanish translation of details';
comment on column policies.consequences_es       is 'Spanish translation of consequences';
comment on column policies.acknowledgment_text_es is 'Spanish translation of acknowledgment_text';
comment on column policies.location_notes_es     is 'Spanish translation of location_notes';

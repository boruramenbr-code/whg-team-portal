-- ============================================================
-- WHG TEAM PORTAL — PRE-SHIFT FOH + BOH MESSAGE SPLIT
-- Splits preshift_notes.message into two fields so managers can
-- speak directly to BOH instead of broadcasting only to FOH.
-- Both messages are visible to all staff (cross-house empathy)
-- but each is clearly labeled in the UI.
--
--   message → foh_message   (existing content stays — was always
--                            functionally a FOH-oriented message)
--   + boh_message            (new column, nullable)
--
-- Idempotent — guarded with information_schema checks.
-- ============================================================

-- Rename `message` → `foh_message` only if it still exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'preshift_notes' and column_name = 'message'
  ) then
    alter table preshift_notes rename column message to foh_message;
  end if;
end $$;

-- Add boh_message (nullable, no default — empty by default).
alter table preshift_notes add column if not exists boh_message text;

-- ============================================================
-- WHG TEAM PORTAL — MOVE BORU DESCRIPTIONS TO PER-RESTAURANT TABLE
-- Migration 031 seeded positions.description with Boru's job
-- descriptions. This migration moves that content into
-- position_descriptions scoped to Boru, then nulls out the
-- canonical column so other restaurants don't accidentally
-- inherit Boru content as a fallback.
--
-- After this migration:
--   • Boru staff see all 11 Boru-specific descriptions
--   • Ichiban / Shokudo / Central Hub staff see no positions
--     until per-restaurant descriptions are added for them
--
-- Idempotent — safe to re-run.
-- ============================================================

do $$
declare
  boru_id uuid;
begin
  select id into boru_id from restaurants where lower(name) like 'boru%' limit 1;

  if boru_id is null then
    raise notice 'No Boru restaurant found — skipping description copy.';
    return;
  end if;

  -- Copy positions.description → position_descriptions for Boru
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, boru_id, p.description
  from positions p
  where p.description is not null
    and length(trim(p.description)) > 0
  on conflict (position_id, restaurant_id) do update
    set description = excluded.description,
        updated_at  = now();

  -- Clear positions.description — content now lives per-restaurant
  update positions set description = null where description is not null;
end $$;

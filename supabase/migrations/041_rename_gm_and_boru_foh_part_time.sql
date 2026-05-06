-- ============================================================
-- WHG TEAM PORTAL — POSITION TWEAKS
--   1. Rename 'General Manager' → 'Manager' (positions.name).
--      Slug stays 'gen_mgr' for stable referencing. Brand-wide.
--
--   2. Boru FOH descriptions (server, host, bartender) — change
--      Schedule and Availability lines from Full-time to Part-time.
--      Busser description is still a placeholder, no change needed.
--
-- Idempotent — uses REPLACE() and direct UPDATE; re-running is a no-op.
-- ============================================================

-- ── 1. Rename General Manager → Manager ─────────────────────────
update positions
set name = 'Manager'
where slug = 'gen_mgr'
  and name = 'General Manager';

-- ── 2. Boru server / host / bartender → Part-time ──────────────
do $$
declare
  boru_id uuid;
begin
  select id into boru_id from restaurants where lower(name) like 'boru%' limit 1;
  if boru_id is null then return; end if;

  update position_descriptions pd
  set description = replace(
        replace(
          pd.description,
          'Schedule: Full-time | Evenings, weekends & holidays',
          'Schedule: Part-time | Evenings, weekends & holidays'
        ),
        'Full-time strongly preferred (30-40 hrs/week)',
        'Part-time available (up to 30 hrs/week)'
      )
  from positions p
  where pd.position_id   = p.id
    and pd.restaurant_id = boru_id
    and p.slug in ('server', 'host', 'bartender');
end $$;

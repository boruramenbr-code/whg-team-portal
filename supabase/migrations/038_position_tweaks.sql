-- ============================================================
-- WHG TEAM PORTAL — POSITION TWEAKS (Bartender, AM, Busser)
--
-- 1. Bartender Boru: pay info corrected from $2.15/hr to
--    $4.00/hr + tips & 10% server tipout (matches Boru pay scale).
-- 2. Assistant Manager: moved from FOH to Management department
--    (it's a leadership role, belongs grouped with KM/GM).
--    Boru description pay corrected $17.00/hr → $15.00/hr.
-- 3. Busser: added placeholder description for Boru so the role
--    appears on the Boru grid. Empty description renders as the
--    "Description coming soon" modal until Randy writes it.
--
-- Idempotent.
-- ============================================================

-- ── 2. Move Assistant Manager into Management department ───────
update positions
set department = 'Management',
    sort_order = 195
where slug = 'asst_mgr';

-- ── Boru-scoped description tweaks ─────────────────────────────
do $$
declare
  boru_id uuid;
begin
  select id into boru_id from restaurants where lower(name) like 'boru%' limit 1;
  if boru_id is null then return; end if;

  -- 1. Bartender: $2.15/hr + tips → $4.00/hr + tips & 10% server tipout
  update position_descriptions pd
  set description = replace(
        pd.description,
        'Pay Type: Tipped Hourly | $2.15/hr + tips',
        'Pay Type: Tipped Hourly | $4.00/hr + tips & 10% server tipout'
      )
  from positions p
  where pd.position_id   = p.id
    and pd.restaurant_id = boru_id
    and p.slug           = 'bartender';

  -- 2a. Assistant Manager: $17.00/hr → $15.00/hr
  update position_descriptions pd
  set description = replace(
        pd.description,
        'Pay Type: Hourly | Starting $17.00/hr',
        'Pay Type: Hourly | Starting $15.00/hr'
      )
  from positions p
  where pd.position_id   = p.id
    and pd.restaurant_id = boru_id
    and p.slug           = 'asst_mgr';

  -- 3. Busser: add empty description so the role appears on the
  --    Boru grid with the standard "Coming Soon" modal when tapped.
  --    on conflict do nothing — don't overwrite if a real
  --    description has been written later.
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, boru_id, ''
  from positions p
  where p.slug = 'busser'
  on conflict (position_id, restaurant_id) do nothing;
end $$;

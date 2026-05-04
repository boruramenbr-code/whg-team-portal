-- ============================================================
-- WHG TEAM PORTAL — REDACT MANAGER + KM PAY INFO IN DESCRIPTIONS
-- The position descriptions for Boru's Manager and Kitchen Manager
-- include a [POS_INFO] block at the top that exposes Hourly rates
-- (Starting $21.00/hr and $20.00/hr respectively). Both positions
-- are actually salaried; pay info is redacted to just "Salary"
-- with status updated from Hourly,Non-Exempt to Salaried.
--
-- Uses REPLACE() so it's idempotent — if the description has
-- already been redacted, re-running is a no-op.
-- ============================================================

do $$
declare
  boru_id uuid;
begin
  select id into boru_id from restaurants where lower(name) like 'boru%' limit 1;
  if boru_id is null then return; end if;

  -- Manager (gen_mgr): Hourly $21.00/hr → Salary
  update position_descriptions pd
  set description = replace(
        replace(
          pd.description,
          'Pay Type: Hourly | Starting $21.00/hr',
          'Pay Type: Salary'
        ),
        'Status: Hourly, Non-Exempt',
        'Status: Salaried'
      )
  from positions p
  where pd.position_id   = p.id
    and pd.restaurant_id = boru_id
    and p.slug           = 'gen_mgr';

  -- Kitchen Manager (kitchen_mgr): Hourly $20.00/hr → Salary
  update position_descriptions pd
  set description = replace(
        replace(
          pd.description,
          'Pay Type: Hourly | Starting $20.00/hr',
          'Pay Type: Salary'
        ),
        'Status: Hourly, Non-Exempt',
        'Status: Salaried'
      )
  from positions p
  where pd.position_id   = p.id
    and pd.restaurant_id = boru_id
    and p.slug           = 'kitchen_mgr';
end $$;

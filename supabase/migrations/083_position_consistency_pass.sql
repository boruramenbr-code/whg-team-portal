-- ============================================================
-- 083 — Position consistency pass (Randy's calls, Sept 22 2026)
--
-- Safe to run more than once. Fixes the contradictions the audit found:
--
--   1) Pay comes out of staff-facing descriptions entirely. Starting pay
--      lives on the manager-only Pay Rates screen, already scoped so a
--      manager sees their own restaurant and the owner sees all.
--   2) "FOH Manager" isn't a position in the catalog → Restaurant Manager.
--      (In practice the Assistant Manager runs FOH; the Assistant KITCHEN
--      Manager is the separate BOH role.)
--   3) Assistant Managers carry FULL void and comp authority, matching the
--      handbook — not the "$10 without approval" two descriptions claimed.
--   4) Fills the missing rows on the Pay Rates screen.
--
-- The last statement prints what the data looks like afterwards.
-- ============================================================

-- ── 1) Strip the pay line from every staff-facing description ───────
update position_descriptions
set description = regexp_replace(description, '(Pay Type|Compensation):[^' || chr(10) || ']*' || chr(10), '', 'g'),
    updated_at = now()
where description is not null
  and (description like '%Pay Type:%' or description like '%Compensation:%');

update positions
set description = regexp_replace(description, '(Pay Type|Compensation):[^' || chr(10) || ']*' || chr(10), '', 'g'),
    updated_at = now()
where description is not null
  and (description like '%Pay Type:%' or description like '%Compensation:%');

-- ── 2) Retire the "FOH Manager" title ──────────────────────────────
update position_descriptions
set description = replace(description, 'FOH Manager', 'Restaurant Manager'),
    updated_at = now()
where description like '%FOH Manager%';

update positions
set description = replace(description, 'FOH Manager', 'Restaurant Manager'),
    updated_at = now()
where description like '%FOH Manager%';

-- ── 3) Assistant Manager comp authority matches the handbook ───────
-- Whole sentence, however it is punctuated, in either description.
update position_descriptions
set description = regexp_replace(
      description,
      'Comp strategically[^.]*\.',
      'You carry full void and comp authority — use it with judgment, and log every one with your reason.',
      'g'
    ),
    updated_at = now()
where description like '%Comp strategically%';

update position_descriptions
set description = regexp_replace(
      description,
      'you are authorized to comp up to \$10 without manager approval',
      'you carry full void and comp authority — use it with judgment, and log every one with your reason',
      'gi'
    ),
    updated_at = now()
where description ilike '%comp up to $10 without manager approval%';

-- ── 4) Pay Rates screen: add the missing positions ─────────────────
insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select p.id, r.id, v.pay_rate, v.notes
from (values
  ('asst_kitchen_mgr', 'Boru Ramen',    '$14/hr',                                       null::text),
  ('asst_kitchen_mgr', 'Ichiban Sushi', 'Hourly — commensurate with experience',        null::text),
  ('kitchen_mgr',      'Ichiban Sushi', 'Salary + benefits',                            null::text),
  ('gen_mgr',          'Ichiban Sushi', 'Salary + benefits',                            null::text),
  ('sushi_mgr',        'Ichiban Sushi', 'Salary + benefits',                            null::text),
  ('sushi_lead',       'Ichiban Sushi', '$16/hr + tips',                                null::text),
  ('bar_mgr',          'Ichiban Sushi', 'Hourly + tips — commensurate with experience', null::text)
) as v(slug, restaurant_name, pay_rate, notes)
join positions p on p.slug = v.slug
join restaurants r on r.name = v.restaurant_name
on conflict (position_id, restaurant_id) do nothing;

-- ── Result (all four should read 0, and pay rates should be 35) ────
select
  (select count(*) from position_descriptions
     where description like '%Pay Type:%' or description like '%Compensation:%') as descriptions_still_showing_pay,
  (select count(*) from position_descriptions where description like '%FOH Manager%') as still_saying_foh_manager,
  (select count(*) from position_descriptions where description ilike '%up to $10 without%') as still_ten_dollar_comp_rule,
  (select count(*) from positions where description like '%Pay Type:%') as whg_descriptions_showing_pay,
  (select count(*) from position_pay_rates) as pay_rate_rows;

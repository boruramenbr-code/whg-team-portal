-- ============================================================
-- 083 — Position consistency pass (Randy's calls, Sept 22 2026)
--
-- Fixes the contradictions the audit turned up, across every position
-- description that hasn't been rewritten as a WHG version yet:
--
--   1) Pay comes out of staff-facing descriptions entirely. Starting pay
--      lives on the manager-only Pay Rates screen, which is already scoped
--      so a manager sees their own restaurant and the owner sees all.
--   2) "FOH Manager" isn't a position in the catalog → Restaurant Manager.
--      (In practice the Assistant Manager runs FOH; the Assistant KITCHEN
--      Manager is the separate BOH role.)
--   3) Assistant Managers carry FULL void and comp authority, matching the
--      handbook's Voids & Comps section — not the "$10 without approval"
--      the two AM descriptions claimed. The Restaurant Manager audits comps
--      and voids daily.
--   4) Fills the 7 missing rows on the Pay Rates screen, using the rates
--      that were written into those descriptions.
-- ============================================================

-- ── 1) Strip the pay line from every staff-facing description ───────
update position_descriptions
set description = regexp_replace(description, '(Pay Type|Compensation):[^\n]*\n', '', 'g'),
    updated_at = now()
where description ~ '(Pay Type|Compensation):';

update positions
set description = regexp_replace(description, '(Pay Type|Compensation):[^\n]*\n', '', 'g'),
    updated_at = now()
where description ~ '(Pay Type|Compensation):';

-- ── 2) Retire the "FOH Manager" title ──────────────────────────────
update position_descriptions
set description = replace(description, 'FOH Manager', 'Restaurant Manager'),
    updated_at = now()
where description like '%FOH Manager%';

-- ── 3) Assistant Manager comp authority matches the handbook ───────
update position_descriptions
set description = replace(
      description,
      'Comp strategically — up to $10 without Manager approval.',
      'You carry full void and comp authority — use it with judgment, and log every one with your reason.'
    ),
    updated_at = now()
where description like '%up to $10 without Manager approval%';

update position_descriptions
set description = replace(
      description,
      'you are authorized to comp up to $10 without manager approval',
      'you carry full void and comp authority — use it with judgment, and log every one with your reason'
    ),
    updated_at = now()
where description like '%comp up to $10 without manager approval%';

-- ── 4) Pay Rates screen: add the missing positions ─────────────────
insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select p.id, r.id, v.pay_rate, v.notes
from (values
  ('asst_kitchen_mgr', 'Boru Ramen',    '$14/hr',                        null::text),
  ('asst_kitchen_mgr', 'Ichiban Sushi', 'Hourly — commensurate with experience', null),
  ('kitchen_mgr',      'Ichiban Sushi', 'Salary + benefits',             null),
  ('gen_mgr',          'Ichiban Sushi', 'Salary + benefits',             null),
  ('sushi_mgr',        'Ichiban Sushi', 'Salary + benefits',             null),
  ('sushi_lead',       'Ichiban Sushi', '$16/hr + tips',                 null),
  ('bar_mgr',          'Ichiban Sushi', 'Hourly + tips — commensurate with experience', null)
) as v(slug, restaurant_name, pay_rate, notes)
join positions p on p.slug = v.slug
join restaurants r on r.name = v.restaurant_name
on conflict (position_id, restaurant_id) do nothing;

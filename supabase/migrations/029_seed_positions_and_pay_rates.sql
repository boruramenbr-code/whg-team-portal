-- ============================================================
-- WHG TEAM PORTAL — SEED POSITIONS + PAY RATES
-- Seeds the position catalog (FOH / BOH / Management) and
-- starting pay rates pulled from Randy's Boru and Ichiban
-- pay scale documents (2025).
--
-- Position descriptions are intentionally left empty for now —
-- Randy is writing them separately and will fill them via the
-- portal admin UI.
--
-- Idempotent — uses on conflict to allow re-runs.
-- ============================================================

-- ── 1. Insert/upsert positions ─────────────────────────────────
insert into positions (slug, name, emoji, department, sort_order, description) values
  -- Front of House
  ('host',            'Host / Hostess',           '🪑',   'FOH', 10, null),
  ('togo',            'Togo Section',             '📦',   'FOH', 20, null),
  ('server',          'Server',                   '🍽️',   'FOH', 30, null),
  ('busser',          'Busser',                   '🪣',   'FOH', 40, null),
  ('bartender',       'Bartender',                '🍸',   'FOH', 50, null),
  ('expo',            'Food Runner / Expo',       '🏃',   'FOH', 60, null),
  ('shift_leader',    'Server Shift Leader',      '⭐',   'FOH', 70, null),
  ('asst_mgr_pt',     'Assistant Manager (P/T)',  '🧑‍💼', 'FOH', 80, null),
  ('asst_mgr',        'Assistant Manager',        '💼',   'FOH', 90, null),

  -- Back of House
  ('line_cook',       'Line Cook',                '🔥',   'BOH', 110, null),
  ('sushi_helper',    'Sushi Helper',             '🍱',   'BOH', 120, null),
  ('sushi_chef',      'Sushi Chef',               '🍣',   'BOH', 130, null),
  ('fry_cook',        'Fry Cook',                 '🍤',   'BOH', 140, null),
  ('prep_cook',       'Prep Cook',                '🔪',   'BOH', 150, null),
  ('dish',            'Dish & Cleaning Crew',     '🧽',   'BOH', 160, null),
  ('kitchen_lead',    'Kitchen Lead',             '🥇',   'BOH', 170, null),

  -- Management
  ('kitchen_mgr',     'Kitchen Manager',          '👨‍🍳', 'Management', 210, null),
  ('gen_mgr',         'General Manager',          '🎯',   'Management', 220, null)
on conflict (slug) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  department = excluded.department,
  sort_order = excluded.sort_order;


-- ── 2. Seed pay rates ──────────────────────────────────────────
-- Each row resolves position_id from positions.slug and
-- restaurant_id from restaurants.name (ILIKE prefix match).
-- Rows where the lookup returns NULL are skipped via WHERE clause.

-- Boru Ramen
insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select
  p.id,
  r.id,
  v.pay_rate,
  v.notes
from (values
  ('host',         '$10/hr + tips',                    null),
  ('server',       '$2.15/hr + tips',                  null),
  ('busser',       '$5/hr + 10% server tipout',        null),
  ('bartender',    '$4/hr + tips & 10% server tipout', null),
  ('shift_leader', '$6/hr + tips',                     '*Part-time'),
  ('asst_mgr',     '$15/hr',                           null),
  ('gen_mgr',      'Salary + benefits',                null),
  ('line_cook',    '$13–14/hr',                        'Ramen Line'),
  ('fry_cook',     '$12–13/hr',                        null),
  ('prep_cook',    '$12/hr',                           null),
  ('dish',         '$10/hr',                           null),
  ('kitchen_lead', '$15/hr',                           null),
  ('kitchen_mgr',  'Salary + benefits',                null)
) as v(slug, pay_rate, notes)
join positions p on p.slug = v.slug
cross join (select id from restaurants where lower(name) like 'boru%' limit 1) r
on conflict (position_id, restaurant_id)
do update set pay_rate = excluded.pay_rate, notes = excluded.notes;

-- Ichiban Sushi
insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select
  p.id,
  r.id,
  v.pay_rate,
  v.notes
from (values
  ('host',         '$11/hr + tips',                 null),
  ('togo',         '$5/hr + tips',                  null),
  ('server',       '$2.15/hr + tips',               null),
  ('busser',       '$6/hr + 10% server tipout',     null),
  ('bartender',    '$4/hr + tips',                  null),
  ('expo',         '$10/hr + tips',                 null),
  ('shift_leader', '$3.15/hr + tips',               '*Part-time'),
  ('asst_mgr_pt',  '$6/hr + tips',                  '*Part-time'),
  ('asst_mgr',     '$16/hr',                        null),
  ('line_cook',    '$13–14/hr',                     'Kitchen Line'),
  ('sushi_helper', '$13–14/hr',                     null),
  ('sushi_chef',   '$14–16/hr',                     null),
  ('fry_cook',     '$12–13/hr',                     null),
  ('prep_cook',    '$12/hr',                        null),
  ('dish',         '$10/hr',                        null)
) as v(slug, pay_rate, notes)
join positions p on p.slug = v.slug
cross join (select id from restaurants where lower(name) like 'ichiban%' limit 1) r
on conflict (position_id, restaurant_id)
do update set pay_rate = excluded.pay_rate, notes = excluded.notes;

-- ============================================================
-- WHG TEAM PORTAL — LOCAL BR ANNUAL EVENTS (2026)
--
-- Two recurring Baton Rouge events that pull foot traffic from
-- our Essen / Old Goodwood locations:
--   • Hot Art Cool Nights  — Mid City, Fri of Mother's Day weekend
--   • Night Market BTR     — Downtown, typically Sat early May
--
-- Dates CHANGE every year. Notes flag this so the editor knows
-- to verify and update each February before peak event season.
--
-- Idempotent — WHERE NOT EXISTS guards against duplicates.
-- ============================================================

with new_events(start_date, end_date, name, name_es, type, notes, notes_es) as (values
  -- Hot Art Cool Nights — Mid City, Friday of Mother's Day weekend (May 8, 2026)
  ('2026-05-08'::date, '2026-05-08'::date,
   'Hot Art Cool Nights — Mid City',
   'Hot Art Cool Nights — Mid City',
   'slow',
   'Annual Mid City BR art walk. Pulls foot traffic from Essen/Old Goodwood. Date changes every year — verify next year.',
   'Caminata anual de arte en Mid City BR. Atrae tráfico peatonal lejos de nosotros. La fecha cambia cada año.'),

  -- Night Market BTR — Downtown, May 9, 2026
  ('2026-05-09'::date, '2026-05-09'::date,
   'Night Market BTR — Downtown',
   'Night Market BTR — Centro',
   'slow',
   'Annual downtown BR food and culture market near the State Capitol. Pulls evening dine-in away from us. Date changes every year — verify next year.',
   'Mercado nocturno anual en el centro de BR. Reduce nuestro tráfico de cena. La fecha cambia cada año.')
)
insert into holidays (start_date, end_date, name, name_es, type, notes, notes_es, restaurant_id)
select ne.start_date, ne.end_date, ne.name, ne.name_es, ne.type, ne.notes, ne.notes_es, null
from new_events ne
where not exists (
  select 1 from holidays h
  where h.start_date = ne.start_date
    and lower(h.name) = lower(ne.name)
);

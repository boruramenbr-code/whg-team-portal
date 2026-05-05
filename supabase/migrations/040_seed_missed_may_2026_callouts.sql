-- ============================================================
-- WHG TEAM PORTAL — BACKFILL MISSED MAY 2026 CALL-OUTS
-- Migration 039 skipped a few events whose start dates landed
-- on or before today (May 4, 2026) but were actually active /
-- still upcoming. Adding them now so the holiday banner on the
-- Home pre-shift card surfaces them today.
--
-- Idempotent — same WHERE NOT EXISTS pattern as migration 039.
-- ============================================================

with new_callouts(start_date, end_date, name, name_es, type, notes, notes_es) as (values
  ('2026-05-04'::date, '2026-05-04'::date, 'May the Fourth Be With You', 'Que la Fuerza te Acompañe', 'normal',
   'Star Wars Day. Fun call-out — energize the team and lean in on social.',
   'Día de Star Wars. Día divertido — anima al equipo y aprovéchalo en redes.'),

  ('2026-05-01'::date, '2026-05-31'::date, 'AAPI Heritage Month', 'Mes de la Herencia AAPI', 'normal',
   'Cultural awareness — relevant to our Asian concepts. Possible feature campaign.',
   'Conciencia cultural — relevante para nuestros conceptos asiáticos.'),

  ('2026-05-04'::date, '2026-05-08'::date, 'Teacher Appreciation Week', 'Semana de Apreciación al Maestro', 'normal',
   'Possible teacher discount or lunch promo this week.',
   'Posible descuento o promoción para maestros esta semana.'),

  ('2026-04-17'::date, '2026-05-08'::date, 'High School Prom Season', 'Temporada de Bailes de Promoción', 'busy',
   'Prom dinners drive volume. Confirm reservations and dress code expectations with FOH.',
   'Cenas de baile aumentan volumen. Confirma reservaciones con el equipo de FOH.')
)
insert into holidays (start_date, end_date, name, name_es, type, notes, notes_es, restaurant_id)
select nc.start_date, nc.end_date, nc.name, nc.name_es, nc.type, nc.notes, nc.notes_es, null
from new_callouts nc
where not exists (
  select 1 from holidays h
  where h.start_date = nc.start_date
    and lower(h.name) = lower(nc.name)
);

-- Louisiana / Baton Rouge specific events seed (2026–2027)
--
-- Decisions captured from Randy 2026-04-30:
--   • Good Friday   → normal (info only; he'll adjust per-restaurant if needed)
--   • LSU exams     → slow (campus empties out — students focused on exams)
--   • Graduations   → busy (families in town, family meals out)

-- 1. Fix the wrong Easter Sunday 2027 date.
--    Original seed in migration 017 had 2027-04-04 — actual Easter 2027 is March 28.
UPDATE holidays
SET start_date = '2027-03-28',
    end_date   = '2027-03-28',
    updated_at = now()
WHERE name = 'Easter Sunday' AND start_date = '2027-04-04';

-- 2. Insert Louisiana-specific events.
INSERT INTO holidays (start_date, end_date, name, name_es, type, notes, notes_es) VALUES
  -- ── Religious calendar (2027 — Easter is March 28) ──────────────────────
  ('2027-02-10', '2027-02-10', 'Ash Wednesday',
                                'Miércoles de Ceniza',
                                'normal',
                                'Start of Lent. Info only.',
                                'Inicio de Cuaresma. Solo informativo.'),
  ('2027-02-10', '2027-03-28', 'Lent',
                                'Cuaresma',
                                'normal',
                                '47-day Lenten season.',
                                'Temporada de 47 días de Cuaresma.'),
  ('2027-03-26', '2027-03-26', 'Good Friday',
                                'Viernes Santo',
                                'normal',
                                'Info only. Adjust per-location if you see a volume shift.',
                                'Solo informativo. Ajusta por ubicación si notas cambio de volumen.'),
  ('2027-03-27', '2027-03-27', 'Holy Saturday',
                                'Sábado Santo',
                                'busy',
                                'Easter prep dinner crowd.',
                                'Cena pre-Pascua — más ocupado.'),

  -- ── Mardi Gras 2027 (Mardi Gras Day = Feb 9) ────────────────────────────
  ('2027-02-06', '2027-02-06', 'Spanish Town Parade',
                                'Desfile Spanish Town',
                                'busy',
                                'Big Baton Rouge parade day. Heavy lunch + dinner.',
                                'Gran día de desfile en Baton Rouge. Mucho almuerzo y cena.'),
  ('2027-02-08', '2027-02-08', 'Lundi Gras',
                                'Lundi Gras',
                                'busy',
                                'Day before Mardi Gras.',
                                'Día antes del Martes de Carnaval.'),
  ('2027-02-09', '2027-02-09', 'Mardi Gras Day',
                                'Martes de Carnaval',
                                'all_hands',
                                'Top Baton Rouge day of the year. No PTO.',
                                'Día más grande de Baton Rouge del año. Sin PTO.'),

  -- ── LSU exam weeks (slow per Randy) ─────────────────────────────────────
  ('2026-12-07', '2026-12-12', 'LSU Fall Exam Week',
                                'Exámenes Otoño LSU',
                                'slow',
                                'Campus thins out — students focused on exams.',
                                'Campus más tranquilo — estudiantes enfocados en exámenes.'),
  ('2027-05-03', '2027-05-08', 'LSU Spring Exam Week',
                                'Exámenes Primavera LSU',
                                'slow',
                                'Campus thins out — students focused on exams.',
                                'Campus más tranquilo — estudiantes enfocados en exámenes.'),

  -- ── Graduation season (busy per Randy) ──────────────────────────────────
  ('2026-12-11', '2026-12-11', 'LSU Fall Commencement',
                                'Graduación Otoño LSU',
                                'busy',
                                'Families in town for graduation.',
                                'Familias en la ciudad para graduación.'),
  ('2027-05-14', '2027-05-15', 'LSU Spring Commencement',
                                'Graduación Primavera LSU',
                                'busy',
                                'Families in town. Big weekend for restaurants.',
                                'Familias en la ciudad. Gran fin de semana para restaurantes.'),
  ('2027-05-15', '2027-05-25', 'BR High School Graduation Season',
                                'Temporada de Graduaciones de Bachillerato',
                                'busy',
                                'Multiple Baton Rouge high schools graduating — family celebrations all weeks.',
                                'Múltiples escuelas graduándose — celebraciones familiares todas las semanas.');

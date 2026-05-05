-- ============================================================
-- WHG TEAM PORTAL — COMPREHENSIVE CALL-OUT DAYS SEED (2026 → 2027)
--
-- Adds ~55 events across these categories:
--   • Federal holidays
--   • Industry busy days (Mother's, Valentine's, Mardi Gras, etc.)
--   • Industry slow days (Cinco de Mayo, St. Patrick's, Super Bowl, etc.)
--   • Staff appreciation days (Bartender, Chef's, Customer Service, etc.)
--   • Concept-specific (National Ramen Day → Boru; Sushi Day → Ichiban)
--   • Fun call-outs (April Fool's, May the Fourth, Pi Day)
--   • Louisiana / Baton Rouge specific (Mardi Gras, LSU/SU graduations,
--     LSU football season, White Light Night, HS prom/grad seasons)
--
-- Idempotent: each row uses WHERE NOT EXISTS on (start_date, name) to
-- avoid duplicating any rows already present from migration 017.
--
-- Dates for variable annual events (LSU graduations, White Light Night,
-- HS proms) are best-estimate ranges — Randy can edit individual rows
-- via the Holidays admin UI as exact dates are confirmed.
--
-- TYPE values: 'closed', 'slow', 'normal', 'busy', 'all_hands'
-- ============================================================

-- ── Helper CTE: pull restaurant IDs for concept-specific scoping ──
-- Each insert that needs a specific restaurant joins to this.

-- Master CTE pattern: load all rows into a temp values table, then INSERT
-- only those that aren't already in the holidays table.

with new_callouts(start_date, end_date, name, name_es, type, notes, notes_es, scope) as (values
  -- ──────────────────────────────────────────────────────────
  -- REST OF 2026 (May 5 onwards — May 4 is today)
  -- ──────────────────────────────────────────────────────────

  -- May 2026 — staff/industry
  ('2026-05-05'::date, '2026-05-05'::date, 'Cinco de Mayo',                    'Cinco de Mayo',                'slow',     'Slow for Asian concepts. Push sake/Japanese specials to counter-program.', 'Lento para conceptos asiáticos. Promueve sake / especiales japoneses.', 'all'),
  ('2026-05-06'::date, '2026-05-12'::date, 'Nurses Week',                       'Semana de Enfermeras',         'normal',   'Recognize any nurse guests with appreciation. Possible discount campaign.', 'Reconoce a las enfermeras que sean clientes. Posible campaña de descuento.', 'all'),
  ('2026-05-08'::date, '2026-05-09'::date, 'Southern University Graduation',    'Graduación de Southern University', 'busy',  'Graduation weekend — expect grad dinners and family parties.',     'Fin de semana de graduación — esperen cenas familiares.',                  'all'),
  ('2026-05-14'::date, '2026-05-16'::date, 'LSU Spring Graduation',             'Graduación de Primavera de LSU', 'busy',    'LSU commencement weekend — graduation dinners and family parties.', 'Fin de semana de graduación de LSU — cenas y reuniones familiares.',       'all'),
  ('2026-05-18'::date, '2026-05-25'::date, 'High School Graduation Season',     'Temporada de Graduación de Secundaria', 'busy', 'Local high school graduations. Grad dinners drive volume.',     'Graduaciones locales de secundaria. Cenas de graduación aumentan volumen.', 'all'),
  ('2026-05-21'::date, '2026-05-21'::date, 'National Waiter & Waitress Day',    'Día Nacional del Mesero',      'normal',   'Recognize FOH staff today. Small gestures count.',                 'Reconoce al equipo de servicio hoy. Los pequeños gestos cuentan.',         'all'),

  -- June 2026
  ('2026-06-18'::date, '2026-06-18'::date, 'National Sushi Day',                'Día Nacional del Sushi',       'busy',     'Ichiban: push sushi specials, social posts, repeat-guest campaigns.', 'Ichiban: promueve especiales de sushi y publicaciones en redes.',     'ichiban'),
  ('2026-06-19'::date, '2026-06-19'::date, 'Juneteenth',                        'Juneteenth',                   'normal',   'Federal holiday. Some guests off work — slight uptick possible.', 'Día festivo federal. Algunos clientes con día libre — leve aumento posible.', 'all'),

  -- August / September 2026
  ('2026-08-30'::date, '2026-11-28'::date, 'LSU Football Season — Home Games',  'Temporada de Fútbol de LSU — Partidos en Casa', 'slow', 'Home game days slow our dine-in. Check schedule weekly. Push delivery.', 'Días de partidos en casa reducen el comer en sala. Promueve entregas.', 'all'),
  ('2026-09-23'::date, '2026-09-23'::date, 'National Restaurant Workers Day',   'Día Nacional de Trabajadores Restauranteros', 'normal', 'Recognize the team — pre-shift shoutouts, small thank-you.',     'Reconoce al equipo — menciones en pre-turno, pequeños agradecimientos.',   'all'),

  -- October 2026
  ('2026-10-05'::date, '2026-10-09'::date, 'Customer Service Week',             'Semana del Servicio al Cliente', 'normal', 'Theme the week around guest experience excellence.',               'Tema de la semana: excelencia en la experiencia del cliente.',             'all'),
  ('2026-10-12'::date, '2026-10-12'::date, 'Columbus Day / Indigenous Peoples Day', 'Día de la Raza / Pueblos Indígenas', 'normal', 'Federal holiday. Some banks closed.',                         'Día festivo federal. Algunos bancos cerrados.',                            'all'),
  ('2026-10-16'::date, '2026-10-16'::date, 'Boss''s Day',                        'Día del Jefe',                  'normal',  'Let the team appreciate leadership. Or just a fun call-out.',     'Día para que el equipo aprecie al liderazgo o simplemente un día divertido.', 'all'),
  ('2026-10-20'::date, '2026-10-20'::date, 'National Chef''s Day',               'Día Nacional del Chef',        'normal',   'Recognize BOH leadership and the kitchen team.',                   'Reconoce al liderazgo de cocina y al equipo de BOH.',                      'all'),
  ('2026-10-31'::date, '2026-10-31'::date, 'Halloween',                          'Halloween',                    'busy',     'Costumed guests — energy is high. Push themed cocktails.',         'Clientes disfrazados — energía alta. Promueve cócteles temáticos.',        'all'),

  -- November 2026
  ('2026-11-06'::date, '2026-11-06'::date, 'White Light Night — Mid-City BR',   'White Light Night — Mid-City BR', 'slow',  'Mid-City event pulls foot traffic away. Plan accordingly.',        'Evento de Mid-City desvía el tráfico peatonal. Planifica.',                'all'),
  ('2026-11-11'::date, '2026-11-11'::date, 'Veterans Day',                       'Día de los Veteranos',         'normal',   'Federal holiday. Some banks closed. Acknowledge veteran staff.',  'Día festivo federal. Algunos bancos cerrados. Reconoce al personal veterano.', 'all'),
  ('2026-11-27'::date, '2026-11-27'::date, 'Black Friday',                       'Viernes Negro',                'slow',     'Retail-driven day — slower for dine-in.',                          'Día impulsado por compras — más lento para comer en sala.',                'all'),
  ('2026-11-28'::date, '2026-11-28'::date, 'Small Business Saturday',            'Sábado de Pequeñas Empresas',  'busy',     'Push community-supported local-business messaging.',                'Promueve mensajes de apoyo a negocios locales.',                            'all'),

  -- December 2026
  ('2026-12-05'::date, '2026-12-05'::date, 'National Bartender Day',             'Día Nacional del Bartender',   'normal',   'Recognize bar team. Small token from management.',                  'Reconoce al equipo de bar. Pequeño detalle de la gerencia.',               'all'),
  ('2026-12-11'::date, '2026-12-12'::date, 'LSU & SU Fall Graduation',           'Graduación de Otoño LSU & SU', 'busy',     'Smaller fall ceremonies — still drive grad dinners.',               'Ceremonias de otoño más pequeñas — aún generan cenas de graduación.',      'all'),

  -- ──────────────────────────────────────────────────────────
  -- 2027 — full year
  -- ──────────────────────────────────────────────────────────

  -- January 2027
  ('2027-01-18'::date, '2027-01-18'::date, 'Martin Luther King Jr. Day',         'Día de Martin Luther King Jr.', 'normal',   'Federal holiday. Banks closed.',                                   'Día festivo federal. Bancos cerrados.',                                    'all'),

  -- February 2027
  ('2027-02-07'::date, '2027-02-07'::date, 'Super Bowl LXI',                     'Super Bowl LXI',               'slow',     'People watch at home. Push delivery / takeout / game-day specials.', 'Gente ve el juego en casa. Promueve entregas y especiales del partido.',  'all'),
  ('2027-02-09'::date, '2027-02-09'::date, 'Mardi Gras / Fat Tuesday',           'Mardi Gras / Martes Gordo',    'busy',     'Huge in Baton Rouge. Plan inventory, staffing, and parade-route impact.', 'Enorme en Baton Rouge. Planifica inventario y personal.',          'all'),
  ('2027-02-15'::date, '2027-02-15'::date, 'Presidents'' Day',                    'Día de los Presidentes',       'normal',   'Federal holiday. Banks closed.',                                   'Día festivo federal. Bancos cerrados.',                                    'all'),

  -- March 2027
  ('2027-03-05'::date, '2027-03-05'::date, 'Employee Appreciation Day',          'Día de Apreciación al Empleado', 'normal',  'Recognize the whole team. Free drink, treat, or shift-end gesture.', 'Reconoce a todo el equipo. Bebida o detalle al final del turno.',     'all'),
  ('2027-03-14'::date, '2027-03-14'::date, 'Pi Day',                              'Día de Pi',                    'normal',   'Fun call-out. 3.14 — possible pun-based promo.',                   'Día divertido. 3.14 — posible promo con juego de palabras.',               'all'),
  ('2027-03-17'::date, '2027-03-17'::date, 'St. Patrick''s Day',                  'Día de San Patricio',          'slow',     'Slow for Asian concepts. People go to Irish bars.',                'Lento para conceptos asiáticos. La gente va a bares irlandeses.',          'all'),

  -- April 2027
  ('2027-04-01'::date, '2027-04-01'::date, 'April Fool''s Day',                   'Día de los Inocentes (US)',     'normal',   'Fun call-out. Be wary of staff jokes / social pranks.',            'Día divertido. Cuidado con bromas del personal.',                          'all'),
  ('2027-04-04'::date, '2027-04-04'::date, 'National Ramen Day',                  'Día Nacional del Ramen',       'busy',     'Boru: push ramen specials, social posts, regulars-only campaign.',  'Boru: promueve especiales de ramen y publicaciones.',                       'boru'),
  ('2027-04-15'::date, '2027-04-15'::date, 'Tax Day',                             'Día de Impuestos',             'normal',   'Federal tax filing deadline. Some guests stressed; lean into hospitality.', 'Fecha límite federal. Algunos clientes estresados; enfócate en hospitalidad.', 'all'),
  ('2027-04-21'::date, '2027-04-21'::date, 'Administrative Professionals Day',   'Día de Profesionales Administrativos', 'busy', 'Office bosses take their teams to lunch. Possible lunch surge.', 'Jefes de oficina invitan a sus equipos. Posible aumento en almuerzo.',     'all'),
  ('2027-04-22'::date, '2027-04-22'::date, 'Earth Day',                           'Día de la Tierra',             'normal',   'Sustainability call-out. Highlight our practices.',                'Día de sostenibilidad. Destaca nuestras prácticas.',                        'all'),

  -- High school prom + graduation seasons (BR area)
  ('2027-04-17'::date, '2027-05-08'::date, 'High School Prom Season',            'Temporada de Bailes de Promoción', 'busy', 'Prom dinners drive volume. Confirm reservations and dress code.', 'Cenas de baile aumentan volumen. Confirma reservaciones y código de vestimenta.', 'all'),
  ('2027-05-17'::date, '2027-05-24'::date, 'High School Graduation Season',     'Temporada de Graduación de Secundaria', 'busy', 'Local high school graduations. Grad dinners drive volume.',     'Graduaciones locales. Cenas de graduación aumentan volumen.',              'all'),

  -- May 2027
  ('2027-05-01'::date, '2027-05-31'::date, 'AAPI Heritage Month',                'Mes de la Herencia AAPI',      'normal',   'Cultural awareness — relevant to our concepts. Possible feature campaign.', 'Conciencia cultural — relevante para nuestros conceptos.',         'all'),
  ('2027-05-03'::date, '2027-05-09'::date, 'Teacher Appreciation Week',          'Semana de Apreciación al Maestro', 'normal', 'Possible teacher discount or campaign.',                          'Posible descuento o campaña para maestros.',                                'all'),
  ('2027-05-04'::date, '2027-05-04'::date, 'May the Fourth Be With You',         'Que la Fuerza te Acompañe',    'normal',   'Star Wars Day. Fun call-out for social.',                          'Día de Star Wars. Día divertido para redes sociales.',                     'all'),
  ('2027-05-05'::date, '2027-05-05'::date, 'Cinco de Mayo',                      'Cinco de Mayo',                'slow',     'Slow for Asian concepts. Counter-program with sake / Japanese specials.', 'Lento para conceptos asiáticos.',                                  'all'),
  ('2027-05-06'::date, '2027-05-12'::date, 'Nurses Week',                         'Semana de Enfermeras',         'normal',   'Recognize any nurse guests.',                                       'Reconoce a las enfermeras que sean clientes.',                              'all'),
  ('2027-05-08'::date, '2027-05-09'::date, 'Southern University Graduation',     'Graduación de Southern University', 'busy',  'Graduation weekend.',                                              'Fin de semana de graduación.',                                              'all'),
  ('2027-05-09'::date, '2027-05-09'::date, 'Mother''s Day',                       'Día de las Madres',            'all_hands','One of the busiest days of the year. All hands on deck.',          'Uno de los días más ocupados del año. Todos en cubierta.',                 'all'),
  ('2027-05-13'::date, '2027-05-15'::date, 'LSU Spring Graduation',              'Graduación de Primavera de LSU', 'busy',    'LSU commencement weekend.',                                         'Fin de semana de graduación de LSU.',                                       'all'),
  ('2027-05-21'::date, '2027-05-21'::date, 'National Waiter & Waitress Day',     'Día Nacional del Mesero',      'normal',   'Recognize FOH staff today.',                                        'Reconoce al equipo de servicio hoy.',                                       'all'),
  ('2027-05-25'::date, '2027-05-25'::date, 'Memorial Day',                        'Día de los Caídos',            'all_hands','Holiday weekend traffic — heavy lunch and dinner.',                 'Tráfico de fin de semana festivo — mucho almuerzo y cena.',                 'all'),

  -- June 2027
  ('2027-06-18'::date, '2027-06-18'::date, 'National Sushi Day',                 'Día Nacional del Sushi',       'busy',     'Ichiban: push sushi specials.',                                     'Ichiban: promueve especiales de sushi.',                                    'ichiban'),
  ('2027-06-19'::date, '2027-06-19'::date, 'Juneteenth',                          'Juneteenth',                   'normal',   'Federal holiday. Banks closed.',                                    'Día festivo federal. Bancos cerrados.',                                     'all'),
  ('2027-06-20'::date, '2027-06-20'::date, 'Father''s Day',                       'Día del Padre',                'all_hands','Big restaurant day. Full crew.',                                    'Gran día para restaurantes. Equipo completo.',                              'all')
)
insert into holidays (start_date, end_date, name, name_es, type, notes, notes_es, restaurant_id)
select
  nc.start_date,
  nc.end_date,
  nc.name,
  nc.name_es,
  nc.type,
  nc.notes,
  nc.notes_es,
  case
    when nc.scope = 'boru'    then (select id from restaurants where lower(name) like 'boru%'    limit 1)
    when nc.scope = 'ichiban' then (select id from restaurants where lower(name) like 'ichiban%' limit 1)
    else null
  end as restaurant_id
from new_callouts nc
where not exists (
  select 1 from holidays h
  where h.start_date = nc.start_date
    and lower(h.name) = lower(nc.name)
);

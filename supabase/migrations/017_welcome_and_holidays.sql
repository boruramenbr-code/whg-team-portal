-- Welcome Note + Upcoming Holidays + new-hire welcome support
--
-- 1) welcome_messages: a single canonical orientation message for the whole company,
--    bilingual (EN + ES). Admin can edit; we keep history via is_active flag.
-- 2) profiles.welcome_dismissed_at: per-user dismissal so the modal only shows on
--    first login (or after admin posts a brand-new message — see notes).
-- 3) holidays: company-wide and per-restaurant calendar entries with type
--    (closed | all_hands), bilingual.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) welcome_messages
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS welcome_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content     text NOT NULL,
  content_es  text,
  is_active   boolean DEFAULT true,
  updated_at  timestamptz DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS welcome_messages_active_idx
  ON welcome_messages (is_active, updated_at DESC)
  WHERE is_active = true;

ALTER TABLE welcome_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read the active welcome message
CREATE POLICY "Authenticated read welcome message"
  ON welcome_messages FOR SELECT
  TO authenticated
  USING (true);

-- Admin writes go through service-role (bypasses RLS) — no INSERT/UPDATE/DELETE
-- policy needed for app users. Pattern matches owner_messages soft-delete.

-- Seed the initial welcome message
INSERT INTO welcome_messages (content, content_es, is_active)
VALUES (
'Welcome to the WHG Team Portal

This is something I''ve been wanting to build for a long time. Most restaurants treat their staff like temps — paper handbooks nobody reads, schedules buried in group chats, important information lost in the shuffle. We''re not most restaurants.

This app is yours. Built for you. Here''s what''s in it:

PRE-SHIFT — the day''s specials, what''s 86''d, what we''re focused on. Read it before every shift.

HANDBOOK — every policy, every procedure, every answer to "how do I...?" Ask it questions like you''d ask a manager. Works in English and Spanish.

OUR TEAM — see who''s who, who reports to who, and who your coworkers are across all our locations.

HOME — birthdays, updates, and messages from me.

A real note from me: hospitality is a craft, not a job you stumble into. The folks who treat it that way go far — both here and in their lives. This app is a small part of how we invest in that. Take care of it. Take care of each other. Take care of every guest like they''re sitting at your kitchen table.

Glad you''re here.

—Randy',

'Bienvenido al Portal del Equipo WHG

Esto es algo que he querido construir desde hace mucho tiempo. La mayoría de los restaurantes tratan a su personal como temporales — manuales en papel que nadie lee, horarios perdidos en grupos de chat, información importante que se pierde. Nosotros no somos como la mayoría de los restaurantes.

Esta app es tuya. Hecha para ti. Esto es lo que encontrarás:

PRE-TURNO — los especiales del día, lo que está 86''d, en qué nos estamos enfocando. Léelo antes de cada turno.

MANUAL — cada política, cada procedimiento, cada respuesta a "¿cómo hago...?" Pregúntale como le preguntarías a un gerente. Funciona en inglés y español.

NUESTRO EQUIPO — ve quién es quién, a quién le reporta cada quien, y quiénes son tus compañeros en todas nuestras ubicaciones.

INICIO — cumpleaños, actualizaciones, y mensajes de mi parte.

Una nota real de mi parte: la hospitalidad es un oficio, no un trabajo en el que tropiezas. La gente que lo trata así llega lejos — tanto aquí como en sus vidas. Esta app es una pequeña parte de cómo invertimos en eso. Cuídala. Cuídense unos a otros. Cuiden a cada huésped como si estuviera sentado en la mesa de su casa.

Me alegra que estés aquí.

—Randy',
  true
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) profiles.welcome_dismissed_at
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS welcome_dismissed_at timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) holidays
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS holidays (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE,  -- NULL = company-wide
  date            date NOT NULL,
  name            text NOT NULL,
  name_es         text,
  type            text NOT NULL CHECK (type IN ('closed', 'all_hands')),
  notes           text,
  notes_es        text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS holidays_date_idx ON holidays (date);
CREATE INDEX IF NOT EXISTS holidays_restaurant_idx ON holidays (restaurant_id);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read upcoming holidays
CREATE POLICY "Authenticated read holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (true);

-- Admin writes go through service-role; no app-level write policy needed.

-- Seed common 2026-2027 holidays. Mix of closed days (we shut and celebrate)
-- and all-hands days (busy restaurant days, no PTO requests). Adjust as needed.
INSERT INTO holidays (date, name, name_es, type, notes, notes_es) VALUES
  ('2026-05-10', 'Mother''s Day',         'Día de las Madres',         'all_hands', 'One of the busiest days of the year. All hands on deck.', 'Uno de los días más ocupados del año. Todos en cubierta.'),
  ('2026-05-25', 'Memorial Day',          'Día de los Caídos',         'all_hands', 'Holiday weekend traffic — expect heavy lunch and dinner.', 'Tráfico de fin de semana festivo — esperen mucho almuerzo y cena.'),
  ('2026-06-21', 'Father''s Day',         'Día del Padre',             'all_hands', 'Big restaurant day. Full crew.', 'Gran día para restaurantes. Equipo completo.'),
  ('2026-07-04', 'Independence Day',      'Día de la Independencia',   'all_hands', NULL, NULL),
  ('2026-09-07', 'Labor Day',             'Día del Trabajo',           'all_hands', NULL, NULL),
  ('2026-11-26', 'Thanksgiving',          'Día de Acción de Gracias',  'closed',    'We close so everyone can be with family.', 'Cerramos para que todos puedan estar con su familia.'),
  ('2026-12-24', 'Christmas Eve',         'Nochebuena',                'all_hands', 'Likely closing early — check with your manager.', 'Probable cierre temprano — confirma con tu gerente.'),
  ('2026-12-25', 'Christmas Day',         'Navidad',                   'closed',    'We close so everyone can be with family.', 'Cerramos para que todos puedan estar con su familia.'),
  ('2026-12-31', 'New Year''s Eve',       'Víspera de Año Nuevo',      'all_hands', 'One of the biggest nights of the year.', 'Una de las noches más grandes del año.'),
  ('2027-01-01', 'New Year''s Day',       'Día de Año Nuevo',          'all_hands', NULL, NULL),
  ('2027-02-14', 'Valentine''s Day',      'Día de San Valentín',       'all_hands', 'Top 3 busiest day. No PTO. Plan now.', 'Top 3 día más ocupado. Sin PTO. Planea desde ahora.'),
  ('2027-04-04', 'Easter Sunday',         'Domingo de Pascua',         'all_hands', 'Brunch crush. Full crew.', 'Brunch lleno. Equipo completo.')
ON CONFLICT DO NOTHING;

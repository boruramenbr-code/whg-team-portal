-- ============================================================
-- WHG TEAM PORTAL — JOURNEY STAGES (start + ongoing)
--
-- Randy's career arc per position (locked 2026-07-12):
--   1. Start — floor training (shadow shifts, trainer-led)
--   2. The Path — the standard ladder (066)
--   3. Floor-Ready — standard training complete
--   4. Ongoing — constant improvement, never "done"
--   5. Advanced → Pro tiers   (AFTER standard content is complete)
--   6. Leadership / training others (last)
--
-- This migration ships stages 1 + 4 and lays groundwork for 5 + 6:
--   • Floor Training shadow-shift modules at the TOP of each Ichiban
--     pilot track (manager sign-off — a human confirms the shadowing).
--   • New track level 'ongoing' + one "Ongoing Growth" track for all —
--     its modules are optional so it never blocks Floor-Ready; it exists
--     to make "we keep growing here" a permanent, visible stage.
--   • training_tracks.tier column ('core' default) — future home of
--     Advanced / Pro / Leader tiers. No UI uses it yet by design.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) Allow the 'ongoing' level + add the future tier column ----
alter table training_tracks drop constraint if exists training_tracks_level_check;
alter table training_tracks add constraint training_tracks_level_check
  check (level in ('foundations', 'department', 'position', 'certification', 'ongoing'));

alter table training_tracks add column if not exists tier text not null default 'core'
  check (tier in ('core', 'advanced', 'pro', 'leader'));

-- 2) Floor Training modules for the Ichiban pilot tracks -------
do $$
declare
  ichiban_id uuid;
  t_id uuid;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  if ichiban_id is null then return; end if;

  -- Server
  select id into t_id from training_tracks
    where level = 'position' and restaurant_id = ichiban_id and position_slugs = array['server'] limit 1;
  if t_id is not null and not exists (select 1 from track_modules where track_id = t_id and title like 'Floor Training%') then
    insert into track_modules (track_id, title, title_es, module_type, completion, sort_order, description, description_es) values
      (t_id, 'Floor Training: Shadow a senior server (2 shifts)', 'Entrenamiento en piso: acompaña a un mesero senior (2 turnos)', 'skill', 'manager', 10,
       'Follow a senior server for two full shifts — watch the greet, the pace, the table talk. Ask questions between tables, not during.',
       'Sigue a un mesero senior por dos turnos completos — observa el saludo, el ritmo, la conversación. Pregunta entre mesas, no durante.'),
      (t_id, 'Floor Training: Take tables with backup (2 shifts)', 'Entrenamiento en piso: toma mesas con respaldo (2 turnos)', 'skill', 'manager', 20,
       'You run the tables, your trainer shadows YOU. Manager signs off when you''re steady without rescue.',
       'Tú llevas las mesas, tu entrenador te sigue A TI. El gerente firma cuando estés estable sin rescates.');
  end if;

  -- Busser
  select id into t_id from training_tracks
    where level = 'position' and restaurant_id = ichiban_id and position_slugs = array['busser'] limit 1;
  if t_id is not null and not exists (select 1 from track_modules where track_id = t_id and title like 'Floor Training%') then
    insert into track_modules (track_id, title, title_es, module_type, completion, sort_order, description, description_es) values
      (t_id, 'Floor Training: Shadow shift with a lead', 'Entrenamiento en piso: turno con un líder', 'skill', 'manager', 10,
       'One full shift beside an experienced busser — routes, timing, staying invisible to guests while seeing everything.',
       'Un turno completo junto a un busser experimentado — rutas, tiempos, ser invisible para los invitados viéndolo todo.');
  end if;

  -- Sushi chef
  select id into t_id from training_tracks
    where level = 'position' and restaurant_id = ichiban_id and position_slugs = array['sushi_chef'] limit 1;
  if t_id is not null and not exists (select 1 from track_modules where track_id = t_id and title like 'Floor Training%') then
    insert into track_modules (track_id, title, title_es, module_type, completion, sort_order, description, description_es) values
      (t_id, 'Floor Training: Station shadow with the sushi lead (3 shifts)', 'Entrenamiento en piso: sombra en estación con el líder de sushi (3 turnos)', 'skill', 'manager', 10,
       'Three shifts at the bar beside the lead — station setup, rice standards, order flow, close-down. Hands in from day one, knives when the lead says so.',
       'Tres turnos en la barra junto al líder — montaje de estación, estándar del arroz, flujo de órdenes, cierre. Manos a la obra desde el día uno, cuchillos cuando el líder lo diga.');
  end if;

  -- Dish crew
  select id into t_id from training_tracks
    where level = 'position' and restaurant_id = ichiban_id and position_slugs = array['dish'] limit 1;
  if t_id is not null and not exists (select 1 from track_modules where track_id = t_id and title like 'Floor Training%') then
    insert into track_modules (track_id, title, title_es, module_type, completion, sort_order, description, description_es) values
      (t_id, 'Floor Training: First shift walkthrough with a lead', 'Entrenamiento en piso: primer turno con un líder', 'skill', 'manager', 10,
       'Work your first shift beside a lead — the pit, the machine, where everything lives, and the rhythm of a rush.',
       'Trabaja tu primer turno junto a un líder — el área de lavado, la máquina, dónde vive todo y el ritmo de la hora pico.');
  end if;

  -- 3) Ongoing Growth track (everyone, never blocks completion) --
  if not exists (select 1 from training_tracks where level = 'ongoing') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description, description_es)
    values ('Ongoing Growth', 'Crecimiento Continuo', '🔁', 'ongoing', 'all', 500,
            'Standard training has a finish line. Growth doesn''t. We are a progressive company — constantly learning, constantly improving, in our positions and beyond them.',
            'El entrenamiento estándar tiene meta. El crecimiento no. Somos una empresa progresista — siempre aprendiendo, siempre mejorando, en nuestras posiciones y más allá.')
    returning id into t_id;
    insert into track_modules (track_id, title, title_es, module_type, completion, required, sort_order, description, description_es) values
      (t_id, 'After every menu change-up: re-study what changed', 'Después de cada cambio de menú: estudia lo nuevo', 'note', 'self', false, 100,
       'New items, new builds, new allergens. When the menu moves, your knowledge moves with it — check the Menu tab and retake the Photo Test.',
       'Platillos nuevos, recetas nuevas, alérgenos nuevos. Cuando el menú cambia, tu conocimiento cambia con él — revisa el Menú y repite el examen de fotos.'),
      (t_id, 'Sharpen one skill this month', 'Afila una habilidad este mes', 'note', 'self', false, 200,
       'Pick one thing — tray speed, knife work, table talk — and get deliberately better at it. Small sharpening, every month, forever.',
       'Elige una cosa — velocidad de charola, cuchillo, conversación — y mejórala a propósito. Afinar poco a poco, cada mes, siempre.'),
      (t_id, 'Raise your hand: cross-train for growth', 'Levanta la mano: entrena para crecer', 'note', 'self', false, 300,
       'Want the next position — server, sushi bar, a lead spot? Tell a manager. The Library is open to you for a reason; advancement here is built, not waited for.',
       'Quieres la siguiente posición — mesero, barra de sushi, un puesto de líder? Dile a un gerente. La Biblioteca está abierta por una razón; aquí el avance se construye, no se espera.');
  end if;
end $$;

-- ============================================================
-- Done. Advanced / Pro / Leader tiers activate in a later phase,
-- after Ichiban's standard content is complete (Randy's sequencing).
-- ============================================================

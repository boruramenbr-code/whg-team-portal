-- ============================================================
-- 072 — Systems & Tools zone
--
-- Randy's call (2026-07-24): software/tool training (OpenTable,
-- Toast POS, 7shifts, Paychex Flex…) does NOT belong inside the
-- menu's Study & Knowledge band. Each tool is a broad topic that
-- deserves its own whole section, in its own home.
--
-- This migration:
--   1) Adds menu_categories.zone ('menu' | 'systems'). The Menu
--      tab shows zone='menu' only; a new Training → 🧰 Systems
--      sub-tab shows zone='systems'.
--   2) Splits "OpenTable & Table Management" into two sections:
--      "OpenTable" and "Table Management" (each its own topic).
--   3) Renames "POS Basics" → "Toast POS".
--   4) Creates placeholder sections "7shifts" and "Paychex Flex"
--      with one intro card each — they grow over time.
--   5) Fixes track module titles + adds "Study: Table Management"
--      to every track that studies OpenTable (FOH management).
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) ZONE COLUMN ---------------------------------------------
alter table menu_categories
  add column if not exists zone text not null default 'menu';

alter table menu_categories drop constraint if exists menu_categories_zone_check;
alter table menu_categories
  add constraint menu_categories_zone_check check (zone in ('menu', 'systems'));

-- 2) RE-HOME + SPLIT THE TWO TOOL SECTIONS -------------------

-- "OpenTable & Table Management" becomes just "OpenTable".
update menu_categories
   set name = 'OpenTable', name_es = 'OpenTable',
       zone = 'systems', sort_order = 61, is_knowledge = true
 where restaurant_id is null
   and name in ('OpenTable & Table Management', 'OpenTable');

-- "Table Management" becomes its own section.
insert into menu_categories (restaurant_id, name, name_es, sort_order, active, is_knowledge, zone)
select null, 'Table Management', 'Manejo de Mesas', 62, true, true, 'systems'
 where not exists (
   select 1 from menu_categories
    where restaurant_id is null and name = 'Table Management');

-- Move the table-management card out of the OpenTable section.
update menu_items
   set category_id = (select id from menu_categories
                       where restaurant_id is null and name = 'Table Management')
 where name = 'Why Table Management Matters'
   and category_id = (select id from menu_categories
                       where restaurant_id is null and name = 'OpenTable');

-- 3) "POS Basics" → "Toast POS" ------------------------------
update menu_categories
   set name = 'Toast POS', name_es = 'Toast (Punto de Venta)',
       zone = 'systems', sort_order = 63, is_knowledge = true
 where restaurant_id is null
   and name in ('POS Basics', 'Toast POS');

-- 4) PLACEHOLDER SECTIONS: 7shifts + Paychex Flex ------------
insert into menu_categories (restaurant_id, name, name_es, sort_order, active, is_knowledge, zone)
select null, '7shifts', '7shifts', 64, true, true, 'systems'
 where not exists (
   select 1 from menu_categories
    where restaurant_id is null and name = '7shifts');

insert into menu_categories (restaurant_id, name, name_es, sort_order, active, is_knowledge, zone)
select null, 'Paychex Flex', 'Paychex Flex', 65, true, true, 'systems'
 where not exists (
   select 1 from menu_categories
    where restaurant_id is null and name = 'Paychex Flex');

-- One intro card each so the sections render. More lessons come later.
insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, sort_order, active)
select c.id, null, 'What Is 7shifts?', '¿Qué es 7shifts?',
  '7shifts is where your work schedule lives. Check your upcoming shifts, set your availability, request time off, and offer or pick up shift swaps — all from the app. Managers post schedules and announcements here, so turn notifications on. If a shift changes, 7shifts is the source of truth — not a text thread.

This section will grow: schedule etiquette, swap rules, and time-off lead times are coming.',
  '7shifts es donde vive tu horario de trabajo. Revisa tus próximos turnos, define tu disponibilidad, pide días libres y ofrece o toma cambios de turno — todo desde la app. Los gerentes publican horarios y avisos aquí, así que activa las notificaciones. Si un turno cambia, 7shifts es la fuente oficial — no un hilo de mensajes.

Esta sección crecerá: etiqueta de horarios, reglas de cambios y tiempos para pedir días libres vienen en camino.',
  10, true
from menu_categories c
where c.restaurant_id is null and c.name = '7shifts'
  and not exists (
    select 1 from menu_items i
     where i.category_id = c.id and i.name = 'What Is 7shifts?');

insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, sort_order, active)
select c.id, null, 'What Is Paychex Flex?', '¿Qué es Paychex Flex?',
  'Paychex Flex is where your pay lives. See your paystubs, set up or change direct deposit, download your W-2 at tax time, and keep your address and contact info current. If your address is wrong at year-end, your tax forms go to the wrong place — update it here, not just with a manager.

This section will grow: reading your paystub, direct deposit setup, and year-end forms are coming.',
  'Paychex Flex es donde vive tu pago. Consulta tus talones de pago, configura o cambia tu depósito directo, descarga tu W-2 en tiempos de impuestos y mantén tu dirección y datos de contacto al día. Si tu dirección está mal al fin de año, tus formularios de impuestos llegan al lugar equivocado — actualízala aquí, no solo con un gerente.

Esta sección crecerá: cómo leer tu talón de pago, configurar depósito directo y formularios de fin de año vienen en camino.',
  10, true
from menu_categories c
where c.restaurant_id is null and c.name = 'Paychex Flex'
  and not exists (
    select 1 from menu_items i
     where i.category_id = c.id and i.name = 'What Is Paychex Flex?');

-- 5) TRACK MODULES -------------------------------------------

-- Retitle the modules that point at the renamed sections.
update track_modules
   set title = 'Study: OpenTable', title_es = 'Estudiar: OpenTable'
 where module_type = 'menu_category'
   and ref_id = (select id from menu_categories
                  where restaurant_id is null and name = 'OpenTable');

update track_modules
   set title = 'Study: Toast POS', title_es = 'Estudiar: Toast POS'
 where module_type = 'menu_category'
   and ref_id = (select id from menu_categories
                  where restaurant_id is null and name = 'Toast POS');

-- Every track that studies OpenTable (FOH management) also studies
-- Table Management — the split must not drop the card they already had.
insert into track_modules (track_id, title, title_es, module_type, ref_id, completion, required, sort_order)
select tm.track_id, 'Study: Table Management', 'Estudiar: Manejo de Mesas',
       'menu_category', tmc.id, 'self', true, 76
  from track_modules tm
  join menu_categories tmc
    on tmc.restaurant_id is null and tmc.name = 'Table Management'
 where tm.module_type = 'menu_category'
   and tm.ref_id = (select id from menu_categories
                     where restaurant_id is null and name = 'OpenTable')
   and not exists (
     select 1 from track_modules x
      where x.track_id = tm.track_id
        and x.module_type = 'menu_category'
        and x.ref_id = tmc.id);

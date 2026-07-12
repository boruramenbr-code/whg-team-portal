-- ============================================================
-- WHG TEAM PORTAL — ICHIBAN: ALL POSITION TRACKS (draft structure)
--
-- Randy's directive (2026-07-12): build the full hierarchy with sound
-- placeholder structures for every Ichiban position; he refines one
-- position at a time. Every track follows the Journey template:
--   Floor Training (shadow, manager-signed) → core skills → study/exams.
--
-- These are Ichiban-scoped (restaurant-specific tracks beat the global
-- skeletons, which stay empty for Boru's very different lineup later).
-- Modules are restaurant-standard and safe as written — refinement
-- sessions with Randy tighten each one to house specifics.
--
-- Idempotent — safe to re-run. Skips any track that already has modules.
-- ============================================================

do $$
declare
  ichiban_id uuid;
  t_id uuid;
  mc_rolls uuid; mc_specialty uuid; mc_nigiri uuid;
  pos record;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  if ichiban_id is null then return; end if;
  select id into mc_rolls     from menu_categories where restaurant_id = ichiban_id and name = 'Sushi Rolls' limit 1;
  select id into mc_specialty from menu_categories where restaurant_id = ichiban_id and name = 'Specialty Rolls' limit 1;
  select id into mc_nigiri    from menu_categories where restaurant_id = ichiban_id and name = 'Sushi & Sashimi' limit 1;

  for pos in select slug, name, department from positions where active
             and slug not in ('server', 'busser', 'sushi_chef', 'dish') loop

    -- Find or create the Ichiban-scoped track for this position.
    select id into t_id from training_tracks
      where level = 'position' and restaurant_id = ichiban_id and position_slugs = array[pos.slug] limit 1;
    if t_id is null then
      insert into training_tracks (restaurant_id, title, emoji, level, applies_to, position_slugs, sort_order, description)
      values (ichiban_id, pos.name || ' Track', '🎯', 'position',
              case when pos.department = 'FOH' then 'foh' when pos.department = 'BOH' then 'boh' else 'mgmt' end,
              array[pos.slug], 300, 'Everything a ' || pos.name || ' needs to earn the floor at Ichiban.')
      returning id into t_id;
    end if;
    if exists (select 1 from track_modules where track_id = t_id) then
      continue;
    end if;

    -- ── FOH ──────────────────────────────────────────────────
    if pos.slug = 'host' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow the host stand (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts beside an experienced host — the greet, the book, the pace of the door.'),
        (t_id, 'Skill: The greet & first impression', 'skill', null, 'manager', true, 100, 'Demonstrate: every guest greeted warmly within seconds of the door — you are the first taste of the 30% Rule.'),
        (t_id, 'Skill: Seating & section rotation', 'skill', null, 'manager', true, 200, 'Demonstrate fair rotation, pacing the kitchen, and reading which tables fit which parties.'),
        (t_id, 'Skill: Phone & waitlist management', 'skill', null, 'manager', true, 300, 'Demonstrate: phone answered the house way, accurate quotes, waitlist kept honest on a rush.'),
        (t_id, 'Menu awareness (optional)', 'menu_category', mc_rolls, 'self', false, 400, 'Hosts who can answer "what''s good here?" turn waits into orders.');
    elsif pos.slug = 'togo' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow the to-go station (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts on the station — phones, packaging flow, pickup handoffs.'),
        (t_id, 'Skill: Phone order accuracy', 'skill', null, 'manager', true, 100, 'Demonstrate: order read back every time, mods captured, name + time confirmed.'),
        (t_id, 'Skill: Packaging & the final check', 'skill', null, 'manager', true, 200, 'Demonstrate the bag check: every item, sauces, chopsticks, utensils — nothing leaves incomplete.'),
        (t_id, 'Study: Sushi Rolls', 'menu_category', mc_rolls, 'self', true, 300, 'You sell the menu over the phone — know what''s in it.'),
        (t_id, '📸 Menu Photo Test (optional)', 'photo_test', null, 'exam', false, 400, 'Recognizing dishes on sight makes the bag check twice as fast.');
    elsif pos.slug = 'expo' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow the expo window (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts at the window — ticket flow, table numbers, runner routes.'),
        (t_id, 'Study: Sushi Rolls', 'menu_category', mc_rolls, 'self', true, 100, 'Expo knows every dish by sight — this is your job description.'),
        (t_id, 'Study: Specialty Rolls', 'menu_category', mc_specialty, 'self', true, 200, 'The toppings and finishes are how you tell lookalike rolls apart at the window.'),
        (t_id, '📸 Pass the Menu Photo Test', 'photo_test', null, 'exam', true, 300, 'Non-negotiable for expo — you are the last set of eyes before the guest.'),
        (t_id, 'Skill: Plate check & ticket timing', 'skill', null, 'manager', true, 400, 'Demonstrate: wrong or incomplete plates caught at the window, courses fired and delivered in order.');
    elsif pos.slug = 'bartender' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow the bar (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts behind the bar — setup, service well flow, close-down.'),
        (t_id, 'Skill: Drink build consistency', 'skill', null, 'manager', true, 100, 'Demonstrate house builds made the same way every time — consistency is the brand behind the bar too.'),
        (t_id, 'Skill: Bar stocking & cleanliness', 'skill', null, 'manager', true, 200, 'Demonstrate opening stock, par awareness, and a bar top that never looks worked-over.'),
        (t_id, 'Menu awareness (optional)', 'menu_category', mc_rolls, 'self', false, 300, 'Bar seats order food too — know what you''re recommending.');
    elsif pos.slug = 'shift_leader' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow a lead (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts beside a current lead — see the floor the way a leader sees it.'),
        (t_id, 'Skill: Running the floor', 'skill', null, 'manager', true, 100, 'Demonstrate a full shift as floor point: sections balanced, breaks managed, wheels never squeaking.'),
        (t_id, 'Skill: Guest recovery', 'skill', null, 'manager', true, 200, 'Demonstrate handling a real complaint: listen, own it, fix it, follow up — without needing a manager.'),
        (t_id, 'Skill: Coaching in the moment', 'skill', null, 'manager', true, 300, 'Demonstrate correcting a teammate mid-shift so they''re better AND still confident.');
    elsif pos.slug = 'asst_mgr_pt' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow a manager (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts beside a manager — opens, closes, and the decisions between them.'),
        (t_id, 'Read the Manager Bible', 'note', null, 'self', true, 100, 'Admin → Standards → Manager Bible. Read it end to end.'),
        (t_id, 'Skill: Pre-shift huddle', 'skill', null, 'manager', true, 200, 'Run a real pre-shift: today''s 86s, specials, focus — short, clear, energizing.'),
        (t_id, 'Skill: Cash handling & shift notes', 'skill', null, 'manager', true, 300, 'Demonstrate drawer counts, drops, and a shift note the next manager can actually use.');

    -- ── BOH ──────────────────────────────────────────────────
    elsif pos.slug = 'sushi_helper' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Station shadow with the sushi lead (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts at the bar — station layout, rice standards, how the lead wants things stocked.'),
        (t_id, 'Skill: Rice prep & holding', 'skill', null, 'manager', true, 100, 'Demonstrate sushi rice made and held to the house standard — the foundation of everything on the bar.'),
        (t_id, 'Skill: Stock, wrap, label, date', 'skill', null, 'manager', true, 200, 'Demonstrate station stocking and FIFO labeling — nothing unlabeled, nothing out of rotation.'),
        (t_id, 'Study: Sushi Rolls builds', 'menu_category', mc_rolls, 'self', true, 300, 'Learn the builds now — this is the road to the sushi chef track.'),
        (t_id, '📸 Menu Photo Test (optional)', 'photo_test', null, 'exam', false, 400, 'Helpers who can name every roll on sight get handed knives sooner.');
    elsif pos.slug = 'prep_cook' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Prep shadow (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts with an experienced prep cook — the list, the pace, where everything lives.'),
        (t_id, 'Skill: Knife safety & house cuts', 'skill', null, 'manager', true, 100, 'Demonstrate safe technique and the standard cuts used across the kitchen.'),
        (t_id, 'Skill: Prep list execution', 'skill', null, 'manager', true, 200, 'Demonstrate a full prep list completed to spec and on time — quantities right, no shortcuts.'),
        (t_id, 'Skill: Label, date, rotate (FIFO)', 'skill', null, 'manager', true, 300, 'Demonstrate: everything labeled and dated, oldest first, walk-in kept inspection-ready.');
    elsif pos.slug = 'fry_cook' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Fry station shadow (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts on the station — tempura flow, timing against the rest of the kitchen.'),
        (t_id, 'Skill: Fryer safety & oil care', 'skill', null, 'manager', true, 100, 'Demonstrate safe fryer operation, oil checks and changes, and what to do if something goes wrong.'),
        (t_id, 'Skill: Tempura standards', 'skill', null, 'manager', true, 200, 'Demonstrate batter, fry times, and plating that match the house standard every basket.'),
        (t_id, 'Skill: Station close-down', 'skill', null, 'manager', true, 300, 'Demonstrate a full close: filtered, wiped, stocked for tomorrow''s open.');
    elsif pos.slug = 'line_cook' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Line shadow (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts on the line — station setup, ticket rhythm, working clean under pressure.'),
        (t_id, 'Skill: Mise en place', 'skill', null, 'manager', true, 100, 'Demonstrate a station fully set before service — everything in reach, everything labeled.'),
        (t_id, 'Skill: Ticket reading & timing', 'skill', null, 'manager', true, 200, 'Demonstrate firing courses so a full table''s food lands together, hot.'),
        (t_id, 'Skill: Temps & doneness', 'skill', null, 'manager', true, 300, 'Demonstrate safe internal temps and consistent doneness — every protein, every time.');
    elsif pos.slug = 'kitchen_lead' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Lead shadow (2 shifts)', 'skill', null, 'manager', true, 10, 'Two shifts beside the current lead — see the kitchen as a system, not a station.'),
        (t_id, 'Skill: Running the line through a rush', 'skill', null, 'manager', true, 100, 'Demonstrate calling the board through a full rush — calm, loud enough, never behind.'),
        (t_id, 'Skill: Open & close checklists', 'skill', null, 'manager', true, 200, 'Demonstrate a full open and a full close, checklist-complete, no manager rescue.'),
        (t_id, 'Skill: Coaching your stations', 'skill', null, 'manager', true, 300, 'Demonstrate raising the cook next to you — correction that teaches, not stings.');

    -- ── MANAGEMENT ───────────────────────────────────────────
    elsif pos.department = 'Management' then
      insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
        (t_id, 'Floor Training: Shadow ' ||
           case when pos.slug in ('kitchen_mgr','asst_kitchen_mgr') then 'the Kitchen Manager'
                when pos.slug in ('sushi_mgr','sushi_lead') then 'the Sushi Manager'
                when pos.slug = 'bar_mgr' then 'the Bar Manager'
                else 'the General Manager' end || ' (3 shifts)',
           'skill', null, 'manager', true, 10,
           'Three shifts beside the person who holds this role today — opens, closes, and every decision between.'),
        (t_id, 'Read the Manager Bible', 'note', null, 'self', true, 100, 'Admin → Standards → Manager Bible. Read it end to end — it is the operating manual.'),
        (t_id, 'Skill: Open & close solo', 'skill', null, 'manager', true, 200, 'Demonstrate a complete open and a complete close of your area with no rescue.'),
        (t_id, 'Skill: Run the shift', 'skill', null, 'manager', true, 300, 'Demonstrate a full shift in charge of your area — staffing calls, guest recovery, the pre-shift huddle.');
    end if;
  end loop;
end $$;

-- ============================================================
-- Done. 18 draft tracks live at Ichiban. Refinement happens position
-- by position with Randy — titles/skills tighten to house specifics.
-- ============================================================

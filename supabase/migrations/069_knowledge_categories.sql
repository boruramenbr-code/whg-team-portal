-- ============================================================
-- WHG TEAM PORTAL — KNOWLEDGE CATEGORIES FLAG
--
-- Randy's call: separate the study sections (Fundamentals, Sushi 101,
-- Oh I Didn't Know That) from the sellable food sections in the Menu
-- tab. The flag also excludes knowledge cards from the auto-generated
-- Menu Photo Test (no "name this dish" questions about a soy bottle).
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table menu_categories add column if not exists is_knowledge boolean not null default false;

update menu_categories
   set is_knowledge = true
 where name in ('Fundamentals', 'Sushi 101', 'Oh, I Didn’t Know That');

-- ============================================================
-- Done.
-- ============================================================

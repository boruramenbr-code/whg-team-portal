-- ============================================================
-- WHG TEAM PORTAL — MENU TRAINING FIELDS + PHOTO QUESTIONS
--
-- Three small additions driven by Randy's training review:
--
-- 1) menu_items.pronunciation — phonetic guide for tough names
--    ("GYOH-zah"). Shown under the item name on the training card.
-- 2) menu_items.is_raw + spice_level — the two questions guests ask
--    most. NULL = not yet entered (card shows nothing until set).
--    Data source: Randy's printed sushi sheet (cooked/raw + spicy
--    markers) — entered when he provides it.
-- 3) quiz_questions.image_url — lets a question show a photo. Powers
--    the auto-generated "Menu Photo Test" (name-that-dish exam built
--    from menu_items photos).
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table menu_items add column if not exists pronunciation text;
alter table menu_items add column if not exists is_raw boolean;
alter table menu_items add column if not exists spice_level int
  check (spice_level between 0 and 3);

alter table quiz_questions add column if not exists image_url text;

-- ============================================================
-- Done.
-- ============================================================

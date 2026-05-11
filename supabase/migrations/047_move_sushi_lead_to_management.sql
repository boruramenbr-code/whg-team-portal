-- ============================================================
-- WHG TEAM PORTAL — MOVE SUSHI LEAD TO MANAGEMENT
-- Sushi Lead is the BOH/sushi-side counterpart to Assistant
-- Kitchen Manager. Originally placed in BOH (sort 175); moving
-- to Management (sort 205) so it sits between Asst Kitchen Mgr
-- (200) and Kitchen Manager (210) in the leadership ladder.
--
-- Idempotent.
-- ============================================================

update positions
set department = 'Management',
    sort_order = 205
where slug = 'sushi_lead';

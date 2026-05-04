-- ============================================================
-- WHG TEAM PORTAL — ADD ASSISTANT KITCHEN MANAGER POSITION
-- Boru's official position list includes Assistant Kitchen Manager
-- (between Kitchen Lead and Kitchen Manager). Adding it to the
-- positions catalog so the description can be attached.
--
-- Idempotent — uses on conflict.
-- ============================================================

insert into positions (slug, name, emoji, department, sort_order, description) values
  ('asst_kitchen_mgr', 'Assistant Kitchen Manager', '🥈', 'Management', 200, null)
on conflict (slug) do update set
  name       = excluded.name,
  emoji      = excluded.emoji,
  department = excluded.department,
  sort_order = excluded.sort_order;

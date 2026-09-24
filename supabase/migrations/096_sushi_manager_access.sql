-- ============================================================
-- 096 — Sushi Managers join the manager zone (Randy, Sept 24 2026)
--
-- Randy: Sushi Manager counts as KM-level. Same fix as 095 — people in
-- the Sushi Manager position who were set up as 'employee' get the
-- 'manager' role, so they see the Managers button (Mission Control +
-- Manager Resources).
--
-- Only raises 'employee' rows; never lowers anyone. Safe to run again.
-- Going forward, set the role when you assign the position (People → Staff).
-- ============================================================

update profiles
   set role = 'manager', updated_at = now()
 where status = 'active' and role = 'employee' and position_slug = 'sushi_mgr';

-- ── Result: everyone in a kitchen-manager-level position and their role now ──
select p.full_name, r.name as restaurant, p.position_slug, p.role
  from profiles p
  left join restaurants r on r.id = p.restaurant_id
 where p.status = 'active' and p.position_slug in ('kitchen_mgr', 'asst_kitchen_mgr', 'sushi_mgr')
 order by r.name, p.position_slug, p.full_name;

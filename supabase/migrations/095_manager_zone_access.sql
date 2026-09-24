-- ============================================================
-- 095 — Manager zone access (Randy, Sept 24 2026)
--
-- "Managers is for managers and AM's, KM's and Assistant KM's."
--
-- The Managers button (Mission Control + Manager Resources) follows each
-- person's role: manager / assistant_manager (and admin for ownership).
-- Kitchen Managers and Assistant Kitchen Managers were set up as
-- 'employee', so they couldn't get in. This gives them the manager roles:
--   • Kitchen Manager            → manager
--   • Assistant Kitchen Manager  → assistant_manager
--
-- One-time fix for people already in those positions. Going forward, set
-- the role when you assign the position (People → Staff).
-- Only raises 'employee' rows; never lowers anyone. Safe to run again.
-- ============================================================

update profiles
   set role = 'manager', updated_at = now()
 where status = 'active' and role = 'employee' and position_slug = 'kitchen_mgr';

update profiles
   set role = 'assistant_manager', updated_at = now()
 where status = 'active' and role = 'employee' and position_slug = 'asst_kitchen_mgr';

-- ── Result: everyone in a KM / Assistant KM position and their role now ──
select p.full_name, r.name as restaurant, p.position_slug, p.role
  from profiles p
  left join restaurants r on r.id = p.restaurant_id
 where p.status = 'active' and p.position_slug in ('kitchen_mgr', 'asst_kitchen_mgr')
 order by r.name, p.full_name;

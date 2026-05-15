-- ============================================================
-- WHG TEAM PORTAL — REMOVE "ASSIGNED TO A SECTION OR STATION"
-- This First-Week checklist item doesn't fit either restaurant's
-- floor model:
--   • Ichiban rotates section assignments every shift
--   • Boru runs an open floor and rarely uses sections
--
-- It was framed as a one-time onboarding milestone, which is wrong.
-- Deactivating instead of deleting preserves audit trail for any
-- existing progress rows.
--
-- Idempotent.
-- ============================================================

update onboarding_checklist_items
set active = false
where title = 'Assigned to a section or station'
  and restaurant_id is null;

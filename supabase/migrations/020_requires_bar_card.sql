-- profiles.requires_bar_card flag + backfill of bar_cards.profile_id
--
-- Pieces:
--   1) Add boolean profiles.requires_bar_card (default false). Manager toggles
--      this when adding/editing staff who handle alcohol (servers, bartenders).
--   2) Backfill existing bar_cards.profile_id where the employee_name uniquely
--      matches an active profile in the same restaurant. Ambiguous matches stay
--      NULL so a manager can resolve them in the BarCardsTab.
--
-- bar_cards.profile_id and the auto-archive trigger were added in migration 015.
-- The upload API in /api/bar-cards/route.ts already auto-links new uploads.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS requires_bar_card boolean NOT NULL DEFAULT false;

-- One-shot backfill: link existing bar_cards.profile_id where there's an
-- unambiguous match. Match rule: same restaurant + case-insensitive trimmed
-- name match against an ACTIVE profile.
WITH matches AS (
  SELECT
    bc.id AS bc_id,
    array_agg(p.id) AS profile_ids
  FROM bar_cards bc
  JOIN profiles p
    ON p.restaurant_id = bc.restaurant_id
   AND lower(trim(p.full_name)) = lower(trim(bc.employee_name))
   AND p.status = 'active'
  WHERE bc.profile_id IS NULL
  GROUP BY bc.id
)
UPDATE bar_cards bc
SET profile_id = m.profile_ids[1],
    updated_at = now()
FROM matches m
WHERE bc.id = m.bc_id
  AND array_length(m.profile_ids, 1) = 1;

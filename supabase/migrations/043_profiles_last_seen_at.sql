-- ============================================================
-- WHG TEAM PORTAL — PROFILES.LAST_SEEN_AT
-- Adds a last_seen_at timestamp to profiles, used by the
-- Adoption Tracker on Mission Control.
--
-- Pinged from /api/preshift-notes and /api/mission-control on
-- each authenticated request — cheap UPDATE (single row by id),
-- gives us "have they opened the app today" granularity.
--
-- Backfill from existing signals so staff who've already engaged
-- aren't falsely marked as "never seen":
--   • profiles.welcome_dismissed_at — first-login proxy
--   • policy_signatures.created_at  — Randy's observation: anyone
--     with a signature has definitely been on the app
-- Take the most recent of those as their backfill last_seen_at.
--
-- Idempotent — column add and backfill are both safe to re-run.
-- Postgres doesn't allow aggregate functions in correlated subqueries
-- inside UPDATE SET, so the backfill is split into two passes.
-- ============================================================

alter table profiles add column if not exists last_seen_at timestamptz;

create index if not exists profiles_last_seen_at_idx on profiles (last_seen_at);

-- ── Pass 1: backfill from welcome_dismissed_at ─────────────────
-- For profiles that have never been seen but have dismissed the
-- welcome modal, set last_seen_at = welcome_dismissed_at.
update profiles
set last_seen_at = welcome_dismissed_at
where last_seen_at is null
  and welcome_dismissed_at is not null;

-- ── Pass 2: bump up to most recent policy signature if later ───
-- Anyone who's signed a policy has definitely been on the app.
-- If their signature is more recent than the welcome dismissal
-- (or they never dismissed welcome), use that as last_seen_at.
with recent_sigs as (
  select user_id, max(signed_at) as last_sig
  from policy_signatures
  group by user_id
)
update profiles p
set last_seen_at = rs.last_sig
from recent_sigs rs
where p.id = rs.user_id
  and (p.last_seen_at is null or p.last_seen_at < rs.last_sig);

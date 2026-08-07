-- ============================================================
-- 073 — Manager Training
--
-- Randy's call (2026-08-07): a training area for MANAGERS ONLY,
-- built exactly like staff video training — series of videos —
-- but visible only to management. He'll grow it over time with
-- curated YouTube picks and videos he records himself.
--
-- Mechanism: training_series.audience ('all' | 'mgmt').
--   • 'all'  — every employee sees it (today's behavior, default)
--   • 'mgmt' — only management sees it (role admin/manager/
--              assistant_manager, or onboarding_category = 'mgmt')
-- The /api/training route filters by the caller's profile; the
-- staff Training → Videos view shows manager series in their own
-- "Manager Training" band, on top, for those who qualify.
--
-- Also seeds the starter series Randy will drop his first 4
-- YouTube links into.
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table training_series
  add column if not exists audience text not null default 'all';

alter table training_series drop constraint if exists training_series_audience_check;
alter table training_series
  add constraint training_series_audience_check check (audience in ('all', 'mgmt'));

create index if not exists training_series_audience_idx
  on training_series (active, audience, sort_order);

-- Starter series for Randy's first manager videos.
insert into training_series (title, blurb, sort_order, audience)
select 'Manager Training',
       'Leadership, systems, and running the floor — for the management team.',
       900, 'mgmt'
 where not exists (
   select 1 from training_series where title = 'Manager Training' and audience = 'mgmt');

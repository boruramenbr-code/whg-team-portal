-- ============================================================
-- 091 — Publish the Quick Guide to staff, first 8 topics (Sept 23 2026)
--
-- Randy approved the infographics and said "let's move forward." These
-- 8 topics have no open handbook questions, so staff see them now. The
-- Quick Guide sub-tab appears in Start Here the moment one topic is
-- published.
--
-- Held for Randy's answers on the handbook inconsistencies found while
-- converting (break pay, time-fraud wording, early clock-ins, protected
-- categories, Bar Card wording, benefits eligibility):
--   Clocking In & Out · Pay & Payroll · Phones, Breaks & Daily Conduct ·
--   Things Most People Don't Know · Drugs & Alcohol · Job Basics
--
-- Safe to run more than once. The last statement prints the result.
-- ============================================================

update handbook_card_sections
set published = true, updated_at = now()
where active = true
  and title in (
    'Lates, Call-Outs & Time Off',
    'Meals & Perks',
    'Dress Code & Appearance',
    'Your Schedule & Team Apps',
    'Raises & Growth',
    'Harassment & Conduct',
    'Safety & Emergencies',
    'Who We Are'
  );

-- ── Result (should read 8 published, 6 still preview) ─────────────
select
  count(*) filter (where published) as published_topics,
  count(*) filter (where not published) as preview_only_topics
from handbook_card_sections
where active = true;

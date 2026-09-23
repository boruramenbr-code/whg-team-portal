-- ============================================================
-- 085 — The Managers Log moves to 7shifts (Randy, Sept 22 2026)
--
-- WHG is weaning off Restaurant365. 7shifts becomes the app for manager
-- activity: the Managers Log, the shift handoff, and comp/void logging.
-- The daily sales number now comes from the POS (Toast at Ichiban, Shift4
-- at Boru) with labor % from 7shifts.
--
-- Boundary this keeps clear:
--   • 7shifts       — manager activity: schedule, time, the Managers Log
--   • This app      — standards, training, the handbook, Mission Control
--
-- Ten lines across four manager-only handbook sections. Each replace is a
-- whole line, matched exactly, so nothing around it shifts. Safe to run
-- more than once; the last statement should come back 0.
-- ============================================================

-- ── Financial Awareness for Managers ───────────────────────────────
update handbook_sections
set body = replace(body,
      'Every opening manager pulls the Daily Sales Summary from Restaurant365 as part of the',
      'Every opening manager pulls the daily sales summary from the POS — Toast at Ichiban, Shift4 at Boru — with labor % from 7shifts, as part of the'),
    updated_at = now()
where title = 'Financial Awareness for Managers' and active = true;

-- ── Manager Communication Cadence ──────────────────────────────────
update handbook_sections
set body = replace(body,
      '- Pull the Daily Sales Summary from R365 — review net sales, labor %, and any',
      '- Pull the daily sales summary from the POS and labor % from 7shifts — review net sales, labor, and any'),
    updated_at = now()
where title = 'Manager Communication Cadence' and active = true;

update handbook_sections
set body = replace(body,
      '- Restaurant365 Managers Log — the official record, primary communication tool between',
      '- The 7shifts Managers Log — the official record, primary communication tool between'),
    updated_at = now()
where title = 'Manager Communication Cadence' and active = true;

-- ── Voids & Comps ──────────────────────────────────────────────────
update handbook_sections
set body = replace(body, ' the R365 Managers Log with reason', ' the 7shifts Managers Log with reason'),
    updated_at = now()
where title = 'Voids & Comps' and active = true;

update handbook_sections
set body = replace(body, 'How to Record in the R365 Managers Log', 'How to Record in the 7shifts Managers Log'),
    updated_at = now()
where title = 'Voids & Comps' and active = true;

update handbook_sections
set body = replace(body,
      'Every void and comp must be logged in Restaurant365 the same shift it occurs. This is not',
      'Every void and comp must be logged in the 7shifts Managers Log the same shift it occurs. This is not'),
    updated_at = now()
where title = 'Voids & Comps' and active = true;

update handbook_sections
set body = replace(body,
      '- Cross-reference every line item against the R365 Managers Log entries from the',
      '- Cross-reference every line item against the 7shifts Managers Log entries from the'),
    updated_at = now()
where title = 'Voids & Comps' and active = true;

-- The daily audit line added in 084 — name the app it happens in.
update handbook_sections
set body = replace(body,
      'cross-referenced against the Managers Log before the next service',
      'cross-referenced against the 7shifts Managers Log before the next service'),
    updated_at = now()
where title = 'Voids & Comps' and active = true;

-- ── The Managers Log ───────────────────────────────────────────────
update handbook_sections
set body = replace(body,
      'The Managers Log in Restaurant365 is the official daily record of everything that happens at',
      'The Managers Log in 7shifts is the official daily record of everything that happens at'),
    updated_at = now()
where title = 'The Managers Log' and active = true;

update handbook_sections
set body = replace(body,
      '- Shift Leader — logs their shift before clocking out, under their own R365 access',
      '- Shift Leader — logs their shift before clocking out, under their own 7shifts access'),
    updated_at = now()
where title = 'The Managers Log' and active = true;

update handbook_sections
set body = replace(body,
      'Shift leaders have R365 access for log entry purposes. Their authority is documentation only —',
      'Shift leaders have 7shifts log book access for log entry purposes. Their authority is documentation only —'),
    updated_at = now()
where title = 'The Managers Log' and active = true;

-- ── Result (should be 0) ───────────────────────────────────────────
select count(*) as sections_still_naming_r365
from handbook_sections
where active = true and (body like '%R365%' or body like '%Restaurant365%');

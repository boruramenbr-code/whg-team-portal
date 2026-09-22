-- ============================================================
-- 084 — Tipped rate + the daily comp/void audit (Randy, Sept 22 2026)
--
--   1) Servers show $2.13/hr on the manager Pay Rates screen — the same
--      federal tipped minimum the app already teaches staff in "Know Your
--      Pay" and uses in the manager calculators. (WHG actually starts
--      servers two cents above it; Randy's call is to publish one number.)
--
--   2) The Restaurant Manager audits comps and voids daily. The handbook
--      already had the opening manager pulling the reports; this states
--      who owns it and what a missing log entry means.
-- ============================================================

-- ── 1) One tipped number everywhere ────────────────────────────────
update position_pay_rates
set pay_rate = '$2.13/hr + tips',
    updated_at = now()
where position_id = (select id from positions where slug = 'server');

-- ── 2) Daily comp & void audit, owned by the RM ────────────────────
update handbook_sections
set body = replace(
      body,
      $ANCHOR$- Servers, bartenders, and all other staff — zero void or comp authority
$ANCHOR$,
      $NEW$- Servers, bartenders, and all other staff — zero void or comp authority

The Restaurant Manager audits every void and comp daily — pulled from the POS reports and cross-referenced against the Managers Log before the next service. A void or comp with no matching log entry is a documentation failure, and it is addressed with the manager who worked that shift.
$NEW$
    ),
    updated_at = now()
where title = 'Voids & Comps'
  and active = true
  and body like '%zero void or comp authority%'
  and body not like '%audits every void and comp daily%';

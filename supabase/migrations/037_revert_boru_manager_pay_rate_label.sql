-- ============================================================
-- WHG TEAM PORTAL — REVERT PAY RATES TABLE LABEL FOR BORU MGR + KM
-- Migrations 034 and 036 incorrectly modified the Pay Rates table
-- (Mission Control / admin dashboard) when the user was actually
-- referring to the Position Descriptions area on the staff portal.
--
-- This migration restores the original "Salary + benefits" label
-- for Boru's General Manager and Kitchen Manager so the Pay Rates
-- table reads as it did out of migration 029.
--
-- Migration 035 (Position Descriptions redaction) is correct and
-- stays in place — that's the actual area the user was asking about.
--
-- Idempotent.
-- ============================================================

insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select p.id, r.id, 'Salary + benefits', null
from positions p
cross join restaurants r
where p.slug in ('gen_mgr', 'kitchen_mgr')
  and lower(r.name) like 'boru%'
on conflict (position_id, restaurant_id)
do update set
  pay_rate = excluded.pay_rate,
  notes    = excluded.notes;

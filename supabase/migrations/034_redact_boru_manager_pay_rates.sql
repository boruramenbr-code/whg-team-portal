-- ============================================================
-- WHG TEAM PORTAL — REDACT BORU MANAGER + KM PAY RATES
-- The General Manager and Kitchen Manager at Boru are salaried.
-- Until Randy publishes the actual rates, replace the rates with
-- an em-dash placeholder and a note explaining they're pending.
--
-- Pay Rates table is manager+ visible. Other managers (GM/KM/AM)
-- viewing this page will see "—" with a "Salaried — rate pending"
-- note instead of the prior "Salary + benefits" line, keeping the
-- actual numbers private until ready to publish.
--
-- Idempotent — safe to re-run.
-- ============================================================

insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select p.id, r.id, '—', 'Salaried — rate pending'
from positions p
cross join restaurants r
where p.slug in ('gen_mgr', 'kitchen_mgr')
  and lower(r.name) like 'boru%'
on conflict (position_id, restaurant_id)
do update set
  pay_rate = excluded.pay_rate,
  notes    = excluded.notes;

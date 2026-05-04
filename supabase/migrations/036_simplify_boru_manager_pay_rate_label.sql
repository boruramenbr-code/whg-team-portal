-- ============================================================
-- WHG TEAM PORTAL — SIMPLIFY BORU MANAGER + KM PAY RATE LABEL
-- Migration 034 set Manager + KM rates to "—" with note
-- "Salaried — rate pending". Per Randy's direction, simplify to
-- just "Salary" with no notes — clean and consistent with how
-- the description's [POS_INFO] block now reads.
--
-- Idempotent — uses upsert.
-- ============================================================

insert into position_pay_rates (position_id, restaurant_id, pay_rate, notes)
select p.id, r.id, 'Salary', null
from positions p
cross join restaurants r
where p.slug in ('gen_mgr', 'kitchen_mgr')
  and lower(r.name) like 'boru%'
on conflict (position_id, restaurant_id)
do update set
  pay_rate = excluded.pay_rate,
  notes    = excluded.notes;

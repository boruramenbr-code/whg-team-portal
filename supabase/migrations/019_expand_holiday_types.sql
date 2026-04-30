-- Expand holidays.type from 2 values to 5 — gives operators a more nuanced
-- way to flag what kind of day it is.
--
-- Old types:  closed | all_hands
-- New types:  closed | slow | normal | busy | all_hands
--
-- closed     — we shut, staff rests
-- slow       — likely lighter than normal traffic
-- normal     — date worth knowing about, no traffic implication
-- busy       — heads up, expect more guests than usual
-- all_hands  — busiest day, no PTO requests, plan to work

ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_type_check;

ALTER TABLE holidays
  ADD CONSTRAINT holidays_type_check
  CHECK (type IN ('closed', 'slow', 'normal', 'busy', 'all_hands'));

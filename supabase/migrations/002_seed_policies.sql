-- ============================================================
-- WHG TEAM PORTAL — POLICIES SEED
-- Seeds:
--   1 Handbook master acknowledgment (kind = 'handbook')
--   9 Employee policies (kind = 'policy', role_required = 'employee')
--   7 Manager policies  (kind = 'policy', role_required = 'manager')
--
-- Manager policies are seeded with FINAL locked v1 text (MANAGER_POLICIES_DRAFT.md).
-- Employee policies and the Handbook master ack are seeded with structural fields only.
-- An admin must paste the final body text (purpose, details, consequences)
-- from WHG Team Handbook v4.0 before activating them in the UI.
--
-- Idempotent: uses ON CONFLICT on (title, version) so a re-run updates in place.
-- Requires a unique constraint — added below before the inserts.
-- ============================================================

-- Ensure we can UPSERT on (title, version) for WHG-wide policies.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'policies_title_version_unique'
  ) then
    alter table policies
      add constraint policies_title_version_unique unique (title, version);
  end if;
end $$;

-- ============================================================
-- 0. HANDBOOK MASTER ACKNOWLEDGMENT
-- ============================================================

insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences,
  acknowledgment_text,
  version, sort_order, active
) values (
  null, 'all', 'handbook',
  'WHG Team Handbook',
  'The foundational employee handbook for Wong Hospitality Group. Every team member — employee and manager — reads and signs this on hire and whenever a new version is published.',
  null, -- The handbook body lives in handbook_chunks; this record only holds the acknowledgment.
  null,
  $$I have received Wong Hospitality Group's employee handbook and had a chance to read it. I agree to follow all policies and ask questions if I'm unclear. I understand that breaking these rules may lead to discipline, up to and including termination. Policies may be updated, and management will notify me of changes.$$,
  1, 0, true
)
on conflict (title, version) do update set
  acknowledgment_text = excluded.acknowledgment_text,
  role_required       = excluded.role_required,
  kind                = excluded.kind,
  sort_order          = excluded.sort_order,
  active              = excluded.active,
  updated_at          = now();

-- ============================================================
-- 1–9. EMPLOYEE POLICIES
--
-- Structural stubs. Admin must populate purpose/details/consequences
-- from WHG Team Handbook v4.0 before marking active = true in production.
-- Left active = true here so they appear in dev; flip to false if you want
-- to hide until bodies are filled.
-- ============================================================

-- Helper inline: standard employee acknowledgment text
--   $$I have read and understand the [Policy Title]. I agree to follow it and
--   understand that violations may result in discipline up to and including termination.$$

-- 1. Cell Phone Use
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Cell Phone Use Policy',
  $$I have read and understand the Cell Phone Use Policy. I agree to follow it and understand that violations may result in discipline up to and including termination.$$,
  1, 1, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 2. Attendance & Punctuality
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Attendance and Punctuality Policy',
  $$I have read and understand the Attendance and Punctuality Policy. I agree to follow it and understand that violations may result in discipline up to and including termination.$$,
  1, 2, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 3. Dress Code & Hygiene
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Dress Code and Hygiene Policy',
  $$I have read and understand the Dress Code and Hygiene Policy. I agree to follow it and understand that violations may result in discipline up to and including termination. I understand that uniform specifics for my location are covered separately in my training manual.$$,
  1, 3, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 4. Confidentiality
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Confidentiality Agreement',
  $$I have read and understand the Confidentiality Agreement. I agree to protect WHG and guest information, and I understand that violations may result in discipline up to and including termination and potential legal action.$$,
  1, 4, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 5. Anti-Harassment & Respect
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Anti-Harassment and Respect Policy',
  $$I have read and understand the Anti-Harassment and Respect Policy. I agree to treat every team member and guest with respect and to report any violation I experience or witness. I understand that violations may result in discipline up to and including termination.$$,
  1, 5, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 6. Safety & Emergency Procedures
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Safety and Emergency Procedures Policy',
  $$I have read and understand the Safety and Emergency Procedures Policy. I agree to follow all safety procedures and report hazards immediately. I understand that violations may result in discipline up to and including termination.$$,
  1, 6, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 7. Food Handling & Sanitation
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Food Handling and Sanitation Policy',
  $$I have read and understand the Food Handling and Sanitation Policy. I agree to follow all food safety and sanitation standards. I understand that violations may result in discipline up to and including termination.$$,
  1, 7, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 8. Drug & Alcohol
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Drug and Alcohol Policy',
  $$I have read and understand the Drug and Alcohol Policy. I agree to report to work fit for duty and to comply with all provisions of this policy. I understand that violations may result in discipline up to and including termination.$$,
  1, 8, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- 9. Social Media
insert into policies (restaurant_id, role_required, kind, title, acknowledgment_text, version, sort_order, active)
values (null, 'employee', 'policy', 'Social Media Policy',
  $$I have read and understand the Social Media Policy. I agree to represent WHG professionally online and to never post confidential or disparaging content about the company, my coworkers, or our guests. I understand that violations may result in discipline up to and including termination.$$,
  1, 9, true)
on conflict (title, version) do update set sort_order = excluded.sort_order, updated_at = now();

-- ============================================================
-- 10–16. MANAGER POLICIES (FINAL v1 TEXT)
-- ============================================================

-- Standard manager acknowledgment prefix reused below:
--   "As a manager at Wong Hospitality Group, I am responsible for modeling,
--    enforcing, and upholding this standard. I accept a higher duty of care
--    than the employees I supervise."

-- 10. Leadership Standards & Code of Conduct
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Leadership Standards & Code of Conduct',
  $$To establish the standard of behavior expected of every manager at Wong Hospitality Group. Managers set the tone for the team through their own conduct, and the standards in this handbook cannot be enforced by someone who does not live by them.$$,
  $$- I will comply with every policy in the WHG Team Handbook and the individual employee policy sheets. The standards that apply to my team apply to me without exception.
- I will model the five WHG core values — Accountability, Urgency, Professionalism, Team First, and Growth — in every shift, every decision, and every interaction.
- I will communicate with team members, guests, and fellow managers in a manner that is respectful, professional, and consistent, regardless of stress level, time pressure, or personal circumstances.
- I will not use my position to receive personal benefits, preferential treatment, or favors that are not extended to the rest of the team.
- I will accept coaching and correction from ownership without defensiveness, and I will coach and correct my team with the same fairness and respect.
- I will lead by example at all times. Respect is earned by setting the standard, not demanded by the title. I understand that my team watches how I react more than they listen to what I say, and that my conduct sets the ceiling for the professionalism of the team I lead.
- I will give respect constantly and first, regardless of whether it is returned in the moment. An employee's poor attitude does not excuse mine. I will never stoop to or mirror an undesired attitude from a team member — as a manager, I am held to a higher standard and I am the one responsible for showing what good attitude, composure, and respect look like on the floor.
- I will correct in private and train in public. Discussions about a specific employee's attitude, performance, or mistake will be held privately and respectfully. Teaching moments, standards, and positive reinforcement of the right behavior are shared openly with the team so everyone learns from them.
- I will treat all employee feedback — including anonymous comments, complaints, and criticism directed at me personally — as a learning opportunity. I will not react with anger, defensiveness, sarcasm, public venting, or any form of retaliation. My response to feedback is itself a leadership moment, and I will handle it as one.
- I will represent Wong Hospitality Group with integrity at all times, including outside of scheduled work hours and in all public and private settings where I can reasonably be identified as a WHG manager.$$,
  $$Failure to meet these standards will result in documented coaching, retraining, demotion, or termination depending on the severity and frequency of the issue.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Leadership Standards & Code of Conduct.$$,
  1, 10, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- 11. Anti-Retaliation
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Anti-Retaliation Policy',
  $$To protect the integrity of WHG's feedback, complaint, and investigation processes, and to ensure every employee feels safe raising concerns without fear of consequences.$$,
  $$- I will not retaliate — directly or indirectly — against any employee who files a complaint, submits anonymous feedback, reports harassment or safety issues, or participates in an investigation.
- Retaliation includes, but is not limited to: reducing an employee's hours, changing their schedule unfavorably, assigning undesirable tasks or sections, excluding them from meetings, training, or team activities, disciplining them without documented cause, withholding earned recognition or promotion opportunities, or terminating them.
- If an employee I supervise files a complaint or submits feedback, I will continue to treat them professionally and fairly. Any subsequent performance or disciplinary concerns involving that employee will be documented in writing and reviewed with ownership before any action is taken.
- I understand that retaliation is prohibited by law and by company policy regardless of whether the original complaint is later substantiated, dismissed, or withdrawn.
- If I am the subject of a complaint, I will not attempt to identify the complainant, will not discuss the complaint with the employee or other team members, and will cooperate fully with any investigation.
- I will treat anonymous feedback and complaints about me as information to learn from, not as a personal attack. Becoming offended, angry, defensive, or dismissive — even privately — erodes the trust that makes the feedback channel work. A professional manager absorbs the feedback, reflects on it honestly, and improves.
- I will not make public, sarcastic, or passive-aggressive comments about complaints, feedback, or the people who might have raised them — on shift, off shift, in person, or on any messaging platform or social media.
- If I observe another manager engaging in retaliation, reacting unprofessionally to feedback, or attempting to identify an anonymous complainant, I will report it to ownership immediately.$$,
  $$Retaliation is a serious violation of law and company policy. Confirmed violations may result in immediate termination and may expose the company and the individual manager to civil and legal liability.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Anti-Retaliation Policy.$$,
  1, 11, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- 12. Employee Confidentiality & Privacy
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Employee Confidentiality & Privacy',
  $$To protect the personal, financial, and medical information of every WHG employee, and to preserve the trust that allows team members to work without fear of their private information being shared.$$,
  $$- I will keep all employee personal information confidential, including but not limited to: pay rates, wages, tips, compensation history, home address, phone number, emergency contacts, Social Security number, immigration status, bank account information, medical conditions, accommodations, disciplinary history, and performance reviews.
- I will not discuss any employee's personal information with other employees, guests, vendors, or any individuals outside of WHG management and ownership.
- I will not discuss one employee's pay, performance, or disciplinary record with another employee.
- I will only access employee records when I have a legitimate business reason to do so, and I will not share my access credentials with any other person.
- I will store physical documents containing employee information in secured locations, and I will log out of digital systems when I step away.
- If I suspect an unauthorized disclosure or data breach has occurred, I will notify ownership within 24 hours.
- This obligation applies during my employment with WHG and continues indefinitely after my employment ends.$$,
  $$Violations may result in immediate termination and may expose the company and the individual manager to civil and legal liability.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Employee Confidentiality & Privacy Policy.$$,
  1, 12, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- 13. Complaint Handling & Escalation
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Complaint Handling & Escalation',
  $$To ensure every employee complaint is received, documented, and acted on in a consistent, fair, and legally compliant manner.$$,
  $$- When an employee brings a complaint to me — verbally, in writing, or through the WHG anonymous feedback channel — I will take it seriously regardless of how minor it may initially appear.
- I will never dismiss a complaint, pressure the complainant to withdraw it, or attempt to resolve it by telling the employee it is not a real issue.
- I will not promise a specific outcome to the complainant before the complaint has been reviewed with ownership.
- For complaints involving harassment, discrimination, safety hazards, wage issues, or alleged illegal activity, I will escalate to ownership within 24 hours and will not attempt to investigate independently.
- For routine operational complaints (scheduling, communication, interpersonal conflict), I will document the complaint, attempt to resolve it directly and fairly, and notify ownership if it recurs or escalates.
- I will document every complaint I receive with the date, the general nature of the complaint (without breaching confidentiality), the action taken, and the outcome.
- I will not discuss the details of a complaint with anyone outside of ownership and parties directly involved in the investigation.
- I will cooperate fully with any investigation, including investigations in which I may be named.$$,
  $$Failure to properly receive, document, or escalate a complaint may result in documented discipline, demotion, or termination, and may expose the company to legal liability.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Complaint Handling & Escalation Policy.$$,
  1, 13, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- 14. Fair & Consistent Enforcement
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Fair & Consistent Enforcement',
  $$To ensure that WHG policies are applied to every employee in the same way, regardless of tenure, friendship, personal relationship, or any protected characteristic.$$,
  $$- I will enforce every WHG policy consistently across all employees I supervise. A rule that applies to one team member applies to all.
- I will not selectively enforce policies based on favoritism, personal relationships, tenure, or informal standing on the team.
- I will not enforce or overlook policies differently based on an employee's race, color, religion, sex, pregnancy, sexual orientation, gender identity, national origin, age, disability, genetic information, veteran status, or any other characteristic protected by law.
- When I issue discipline, I will follow the documented progressive discipline steps (verbal warning, written warning, final warning, termination) unless the severity of the violation justifies immediate escalation.
- Every disciplinary action I issue will be documented in writing with the date, the policy violated, the facts of the incident, the discipline issued, and the employee's acknowledgment.
- I will review documented discipline with ownership before termination actions, except in cases where immediate action is required to protect safety or the business.
- When two or more employees commit the same violation, I will apply the same level of discipline unless there is a documented, objective reason (prior history, severity, intent) that justifies a different response.$$,
  $$Inconsistent enforcement, discriminatory enforcement, or undocumented discipline may result in coaching, demotion, or termination, and may expose the company to legal liability.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Fair & Consistent Enforcement Policy.$$,
  1, 14, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- 15. Financial & Operational Integrity
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Financial & Operational Integrity',
  $$To protect the financial assets of Wong Hospitality Group and ensure that every cash, comp, discount, payroll, and inventory transaction is handled with full accountability.$$,
  $$- I will follow all documented procedures for cash handling, daily deposits, drawer counts, safe counts, and cash drops.
- I will not remove cash from any register, safe, or drop for personal use under any circumstance.
- I will not comp, discount, or void transactions for myself, my family, or my personal friends without documented prior approval from ownership.
- I will not edit my own time punches, adjust my own hours, or modify my own pay records in any system. All corrections to my own records must be requested in writing and processed by another authorized party.
- When editing another employee's time records, I will document the reason for every correction and notify the employee.
- I will follow FIFO and documented inventory procedures, and I will not remove inventory, food, or supplies from the restaurant for personal use without documented approval.
- I will accurately report guest counts, sales, voids, comps, and discounts in the POS and in R365 or the current accounting software in use at the time.
- If I observe or suspect financial misconduct by another manager or employee, I will report it to ownership immediately and in writing.
- I will not accept gifts, cash, or favors from vendors that could create or appear to create a conflict of interest. Any vendor gift over a nominal value must be disclosed to ownership.$$,
  $$Financial misconduct may result in immediate termination, may be reported to law enforcement, and may result in civil action to recover losses.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Financial & Operational Integrity Policy.$$,
  1, 15, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- 16. Fraternization & Boundaries
insert into policies (
  restaurant_id, role_required, kind, title,
  purpose, details, consequences, acknowledgment_text,
  version, sort_order, active
) values (
  null, 'manager', 'policy',
  'Fraternization & Boundaries',
  $$To maintain clear boundaries between managers and the team members they supervise, protect against conflicts of interest, and preserve the professional environment that allows WHG to operate fairly.$$,
  $$- I will not pursue or engage in a romantic or sexual relationship with any employee I directly or indirectly supervise.
- If a pre-existing relationship exists or a mutual relationship develops with a current employee, I will disclose the relationship to ownership immediately so that appropriate steps can be taken (reassignment, reporting line change, or other resolution). Failure to disclose will be treated as a violation of this policy.
- I will not consume alcohol with employees I supervise in a manner that compromises my authority, creates favoritism, or places the company at risk. Occasional team events where alcohol is served are permitted when conducted professionally and with reasonable limits.
- I will not use illegal substances in the presence of employees at any time, on or off duty.
- I will not borrow money from, lend money to, or enter into any personal financial arrangement with an employee I supervise.
- I will maintain appropriate boundaries on social media. Personal social media connections with employees I supervise are discouraged, and I will not post content about individual employees, their work, or their personal lives without their consent.
- I will not provide rides, housing, or other personal services to employees I supervise in a way that creates dependence, favoritism, or the appearance of impropriety.$$,
  $$Undisclosed relationships, compromised boundaries, or misconduct under this policy may result in documented discipline, demotion, or termination depending on the severity and impact.$$,
  $$As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise. I understand and agree to follow the WHG Fraternization & Boundaries Policy.$$,
  1, 16, true
)
on conflict (title, version) do update set
  purpose = excluded.purpose, details = excluded.details,
  consequences = excluded.consequences, acknowledgment_text = excluded.acknowledgment_text,
  sort_order = excluded.sort_order, updated_at = now();

-- ============================================================
-- DONE
-- Verify with:  select title, role_required, version, active from policies order by sort_order;
-- ============================================================

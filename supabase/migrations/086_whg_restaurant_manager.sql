-- ============================================================
-- 086 — WHG Restaurant Manager (Randy, Sept 22 2026)
--
--   1) Renames the catalog position "Manager" → "Restaurant Manager", the
--      title the handbook already uses.
--   2) Writes the WHG Restaurant Manager description and clears both local
--      copies, so every restaurant reads the same one.
--   3) Kitchen Managers report to the Restaurant Manager everywhere. Boru's
--      KM reporting to the owner was temporary.
--   4) One turnover standard: below 30% a year. The handbook's "monthly
--      attrition under 10%" worked out to over 100% a year, so it becomes
--      the monthly watch level that matches — under 3%.
--   5) Tidies the Ichiban AM comp sentence left double-dashed by 083.
--
-- Safe to run more than once. The last statement prints the result.
-- ============================================================

-- ── 1) The title the handbook already uses ─────────────────────────
update positions
set name = 'Restaurant Manager', updated_at = now()
where slug = 'gen_mgr' and name <> 'Restaurant Manager';

-- ── 2) The WHG Restaurant Manager description ──────────────────────
update positions
set description = $WHG$[POS_INFO]
Reports To: Owner / Operator
Status: Salaried, Exempt
Schedule: Full-time | Nights, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Restaurants do not last for decades on luck. They last because someone holds the standard on a slow Tuesday the same way they hold it on a packed Saturday. As Restaurant Manager, you are the operator in the building when the owner is not there. Every department runs through you, and the guest experience, the culture, and the profit all follow the standard you set and refuse to lower.

This is not a supervisory title. It is an ownership seat.

## THE STANDARD

**The restaurant runs the same way whether the owner is in the building or on the other side of the world.**

- Every department is guest-ready before the first table is seated.

- The numbers are known today, not discovered at month-end.

- Every leader under you knows their targets, where they stand, and what they are working toward.

- Guest problems are solved on the spot, by you, with no buck passed.

- Comps and voids are audited daily, against the log.

## CORE RESPONSIBILITIES

### 1. Own the Building, Open to Close

Walk every department before service. Confirm staffing, prep, and readiness. Stay visible on the floor during service and correct in real time rather than after. Debrief with your leads at close and confirm the building is secure.

> Standard: Every shift opens prepared and closes clean. No department goes unwalked before the first guest arrives.

### 2. Lead the Leaders

Your Assistant Manager, Kitchen Manager, and leads are your direct reports. Lead them — do not just schedule them. Hold a weekly check-in with each one, set measurable goals, and document what you discussed. Recognize great execution publicly, because your team performs at the level you celebrate.

> Standard: A structured check-in with every direct report each week, documented.

### 3. Know the Numbers Today

Pull the daily sales summary from the POS and labor percentage from 7shifts every morning. Food cost 30%, labor cost 30% — together that is your 60% prime cost. The remaining 40% covers rent, utilities, insurance, repairs, marketing, and whatever profit is left, which is why every point over target comes straight out of the future of this business. Schedule to the forecast, not to habit.

> Standard: Sales, labor, and prime cost reviewed daily. Any labor variance over target reported to ownership the same day.

### 4. Keep the Managers Log

The Managers Log in 7shifts is the official daily record. Log your shift before you clock out, not tomorrow morning. Acknowledge the previous shift's entries before you start yours. If it did not get logged, it did not happen.

> Standard: Your shift logged before you leave the building. Previous shift acknowledged before yours begins.

### 5. Audit Comps and Voids Daily

Pull the comp and void reports for the previous business day and cross-reference every line against the log. You and your Assistant Manager both carry full authority here — which is exactly why it gets audited. A comp with no log entry is a documentation failure, and you address it with the manager who worked that shift.

> Standard: Every comp and void reviewed daily. Any unlogged one addressed with that manager before the next service.

### 6. Set the Hospitality Standard

The floor standard holds because you hold it. Touch tables every shift — at least five. Review every recovery your managers log. When a guest problem reaches you, get on the guest's side of it: one apology, no detective work, fix it and move.

> Standard: 5+ personal table touches per shift. Every logged recovery reviewed within 24 hours.

### 7. Build and Keep the Team

Hiring is a leadership act, not an emergency. Start every new hire in the app's guided training, assign them a trainer, and sign them off yourself when they are floor-ready. Hold the 30-day check-in. Run the semi-annual evaluation — where improvement, correction, and pay get discussed — separately from the 90-day training path.

Nobody should be surprised by their own outcome. Document coaching as it happens and give people every chance to choose differently. When someone leaves, it should be because of choices they made, not because you lost patience.

> Standard: Every new hire has a trainer and a start date in the app. 30-day check-ins held. Annual turnover below 30%.

### 8. Protect the Business

Weekly compliance walkthrough — health, safety, equipment, uniform standards. Cash handled and audited nightly. Opening and closing checklists are the floor, not the goal.

> Standard: Weekly walkthrough completed. Zero health code violations. Nightly drop audited before close.

## YOUR FIRST SIX MONTHS

*A leadership seat ramps over six months. The 90-day path is the training window for the people you hire.*

**Month 1:** Every system, number, and team dynamic understood. Running daily operations without owner involvement.

**Month 3:** Targets met. Your leaders developing on a documented plan. Team stable, no open compliance issues.

**Month 6:** The operation fully owned — and you are a candidate for responsibility across more than one restaurant.

## HOW YOU CONTRIBUTE TO THE BUSINESS

- Labor and food are the two costs you touch every single shift. A point in either direction is real money, every week.

- Keeping a good employee costs a fraction of replacing one. Retention is leadership, not luck.

- Developing your leaders is the only thing that lets WHG open the next restaurant.

- Consistent standards drive the reviews and repeat visits that fill the dining room without a marketing budget.

**You do not just run a restaurant. You are the reason the standard holds when nobody is watching.**

## WHAT WE EXPECT

- Attitude: *Accountable, composed, decisive. You build trust by doing what you said you would do.*

- Presence: *On the floor, not in the office. Office work happens around service, not during it.*

- Grooming & Uniform: *Management presentation standard — immaculate, every shift.*

- Physical Requirements: *Able to stand 10+ hours, lift up to 50 lbs, move continuously through a full-service operation.*

- Availability: *Nights, weekends, and holidays required.*

- Experience: *2+ years of restaurant management or equivalent leadership, with budgeting and team development experience.*$WHG$,
    updated_at = now()
where slug = 'gen_mgr';

update position_descriptions
set description = null, updated_at = now()
where position_id = (select id from positions where slug = 'gen_mgr');

-- ── 3) Kitchen Managers report to the Restaurant Manager ───────────
update position_descriptions
set description = replace(description, 'Reports To: Owner / Operator', 'Reports To: Restaurant Manager'),
    updated_at = now()
where position_id = (select id from positions where slug = 'kitchen_mgr')
  and description like '%Reports To: Owner / Operator%';

-- Everyone who reported to "Manager" now reports to the Restaurant Manager
-- ("Reports To: Manager / Assistant Manager" picks up the new title too).
update position_descriptions
set description = replace(description, 'Reports To: Manager', 'Reports To: Restaurant Manager'),
    updated_at = now()
where description like '%Reports To: Manager%';

-- ── 4) One turnover standard ───────────────────────────────────────
update handbook_sections
set body = replace(body,
      'A healthy monthly attrition target is under 10%. That means retaining at least 90% of your team',
      'A healthy monthly attrition target is under 3% — roughly 30% a year, which is the WHG standard. That means retaining at least 97% of your team'),
    updated_at = now()
where title = 'Staff Retention & Cross-Training' and active = true;

-- ── 5) Punctuation left over from 083 ──────────────────────────────
update position_descriptions
set description = replace(description,
      'ownership — you carry full void and comp authority —',
      'ownership. You carry full void and comp authority —'),
    updated_at = now()
where description like '%ownership — you carry full void and comp authority —%';

-- ── Result ─────────────────────────────────────────────────────────
select
  (select name from positions where slug = 'gen_mgr') as catalog_title,
  (select length(description) from positions where slug = 'gen_mgr') as whg_rm_description_chars,
  (select count(*) from position_descriptions
     where position_id = (select id from positions where slug = 'gen_mgr')
       and description is not null) as local_rm_copies_left,
  (select count(*) from position_descriptions
     where position_id = (select id from positions where slug = 'kitchen_mgr')
       and description like '%Reports To: Restaurant Manager%') as km_reporting_to_rm,
  (select count(*) from handbook_sections
     where active = true and body like '%monthly attrition target is under 3%%') as handbook_turnover_fixed;

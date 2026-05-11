-- ============================================================
-- WHG TEAM PORTAL — ICHIBAN MANAGEMENT POSITIONS
-- 1) Adds three new role types to the global catalog:
--      sushi_lead   — BOH lead, parallel to Kitchen Lead
--      sushi_mgr    — BOH manager, parallel to Kitchen Manager
--      bar_mgr      — FOH manager, between Asst Mgr and Manager
-- 2) Seeds all 7 Ichiban management descriptions:
--      asst_mgr, bar_mgr, gen_mgr (Manager),
--      asst_kitchen_mgr, sushi_lead, sushi_mgr, kitchen_mgr
--
-- Idempotent. Re-running just refreshes content.
-- ============================================================

-- ── 1. New positions in the catalog ─────────────────────────────
insert into positions (slug, name, emoji, department, sort_order, description) values
  ('sushi_lead',  'Sushi Lead',     '🥢',  'BOH',        175, null),
  ('bar_mgr',     'Bar Manager',    '🍸',  'Management', 197, null),
  ('sushi_mgr',   'Sushi Manager',  '🎌',  'Management', 215, null)
on conflict (slug) do update set
  name = excluded.name,
  emoji = excluded.emoji,
  department = excluded.department,
  sort_order = excluded.sort_order;

-- ── 2. Ichiban descriptions ──────────────────────────────────────
do $$
declare ichiban_id uuid;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  if ichiban_id is null then return; end if;

  -- Assistant_Manager_Job_Description_Ichiban.md → positions.slug = 'asst_mgr'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Manager
Compensation: Hourly — commensurate with experience
Status: Full-Time, Hourly Non-Exempt
Schedule: Varies — includes nights, weekends, and peak service periods
[/POS_INFO]

## WHY THIS ROLE MATTERS

When the Manager is not on the floor, you are the Manager. That is not a figure of speech — it is the job. You own the shift: the team, the guests, the energy, and the execution. Ichiban's reputation is built one table at a time, and you are the person who makes sure every table gets it right. This role exists because the standard does not take nights off.

## THE STANDARD

**As Assistant Manager, you are the shift commander. The following standards define what it means to hold this role at Ichiban:**

- You are present and visible on the floor — not in the office — during peak service.

- Every shift opens with a proper pre-shift meeting and closes with a full team debrief.

- Guest issues are handled at the table, with authority, and with a resolution — not a callback.

- You monitor labor and pacing in real time — overstaffing and understaffing both cost the restaurant.

- You hold the team to the standard — with respect, with clarity, and without exception.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Shift Ownership & Floor Leadership

You own the shift from open to close. Assign sections, confirm sidework, verify restrooms, lighting, and ambiance before service. Run pre-shift meeting: cover specials, 86'd items, reservation notes, and nightly performance goals. Maintain constant floor presence during service — touch tables, monitor pace, observe team. Close the shift: cash out servers, verify sidework, confirm clean restrooms and dining room.

> Standard: Every shift opens prepared and closes clean. Your floor presence ensures the team performs at its best.

### 2. Guest Experience & Service Recovery

You are the highest point of escalation on the floor during your shift. Touch every table during service. Intercept problems before they become complaints — read the room, act proactively. Resolve guest complaints with empathy and ownership — you are authorized to comp up to $10 without manager approval. Escalate issues beyond your authority to the Manager immediately. Follow up with the table after resolution to confirm satisfaction.

> Standard: No guest leaves unhappy without an attempt to recover them. Your floor visibility prevents most issues before they start.

### 3. Team Coaching & Accountability

You are not just supervising — you are building habits. Provide real-time feedback during service that is specific, direct, and constructive in tone. Recognize great execution publicly — name it so the team knows what good looks like. Address performance issues directly and in private. Document when patterns emerge. Support server upsell training — check averages, beverage attachment, and dessert recommendations.

> Standard: Every shift, at least one team member receives specific, actionable feedback — positive or corrective.

### 4. Labor Monitoring & Scheduling Support

Check 7shifts at the start of every shift — know who is scheduled, who is clocked in, and who is on break. Cut staff early when volume does not support the schedule. Flag late call-ins, no-shows, and attendance issues to the Manager immediately. Track overtime exposure and report to the Manager before it becomes an issue.

> Standard: Labor stays within target on your shift. You do not let the clock run on staff that are not needed.

### 5. POS, OpenTable & Closing Procedures

Manage Toast POS shift settings and verify pricing accuracy before service. Handle voids, comps, and discounts according to established policy — document every one. Review OpenTable reservations at the start of each shift and communicate large party details to FOH team and kitchen. Process end-of-shift server checkout. Complete nightly manager log — sales summary, labor, incidents, guest feedback, and 86'd items. Secure the building before leaving.

> Standard: Every close balances. Every comp is documented. The manager log is complete and the building is secured before you leave.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Shadow Manager on shift operations, pre-shift execution, and guest recovery. Learn all Toast POS manager functions and closing procedures. Complete floor section mapping and team roster review. **Days 31--60** Run full shifts independently. Receive feedback from Manager on pre-shift meetings and floor coaching. Identify one recurring service gap and bring a solution to the Manager. **Days 61--90** Operate without daily oversight. Coaching conversations with FOH team are documented. Shift closes are accurate and complete. Ready for increased responsibility.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Assistant Manager is the highest-volume leadership position at Ichiban. Every decision you make during your shift has an immediate financial consequence:

- A well-run pre-shift meeting improves upsell execution — a $3 check average increase over 80 covers adds $240 per night

- Smart labor cuts on a slow shift save $150--300 in unnecessary wages — compounded weekly that is significant money

- Recovering one escalated complaint prevents a negative review that could cost dozens of future reservations

- Holding the team to service standards reduces mistakes, remakes, and comps — all of which hit food cost directly

- A tight close with accurate cash handling protects revenue and builds ownership trust in your reliability

**Your shift is the business. Run it like it is yours.**

## WHAT WE EXPECT

- Be on the floor: *Not in the office during peak service. Your presence is the job.*

- Know the reservation sheet: *Before the first guest walks in — every night.*

- Handle your own problems: *Escalate only what truly requires the Manager.*

- Treat people with respect: *Even when you are correcting someone. Especially then.*

- Document everything: *If it is not in the manager log, it did not happen.*

- Set the tone: *Your attitude is the team's ceiling.*$JD$
  from positions p where p.slug = 'asst_mgr'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Bar_Manager_Job_Description_Ichiban.md → positions.slug = 'bar_mgr'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Manager
Compensation: Hourly + Tips — commensurate with experience
Status: Full-Time, Hourly Non-Exempt
Schedule: Primarily evenings and weekends — aligned with bar service hours
[/POS_INFO]

## WHY THIS ROLE MATTERS

The bar at Ichiban is its own profit center. A well-run bar elevates the entire dining experience — guests stay longer, spend more, and come back because the drinks are right and the atmosphere is right. As Bar Manager, you own the beverage program end to end: the menu, the training, the inventory, the cost, and the experience behind the bar. The bar reflects your standards every single night.

## THE STANDARD

**As Bar Manager, your accountability runs from product quality to profitability. These standards are the floor, not the ceiling:**

- The bar is clean, fully stocked, and ready before service — no bartender scrambles to set up mid-rush.

- Every drink that leaves the bar meets the recipe and presentation standard — every time.

- Beverage cost is tracked weekly. Variance is investigated, not accepted.

- Your bartenders are trained, not just scheduled. They execute because you taught them how.

- You are visible to guests at the bar — you create the experience, not just the drinks.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Beverage Menu & Program Development

You own the drink menu. Build a beverage program that matches Ichiban's brand, moves product profitably, and gives guests a reason to order from the bar on every visit. Develop and maintain the cocktail, sake, beer, wine, and non-alcoholic menus. Create seasonal specials. Price all beverages with cost percentage in mind. Document recipes and build specs for every drink — no bartender improvises. Review menu performance quarterly and remove slow-moving, low-margin items.

> Standard: Every drink on the menu has a build spec, a cost card, and a margin rationale. Nothing is priced by gut feel.

### 2. Bar Inventory & Cost Control

Beverage cost is one of the most controllable expenses in the restaurant. Conduct weekly bar inventory — count spirits, sake, beer, wine, and mixers accurately. Place all beverage orders based on par levels and weekly usage. Receive and verify every delivery against the invoice. Monitor pour cost against sales and investigate any variance over 1%. Secure all spirits and high-value product after service.

> Standard: Beverage cost is counted every week. Variance is identified and explained within 48 hours — not carried into the next period.

### 3. Bartender Training & Standards Enforcement

Your bartenders perform at the level you train them to. Train all new bartenders on recipes, pour standards, guest interaction, and POS usage. Run menu training sessions when new specials launch. Observe bartender performance during service and provide specific, timely feedback. Hold bartenders accountable to cleanliness, setup, and sidework standards. Document performance issues and communicate them to the Manager.

> Standard: Every bartender can build every drink on the menu from memory, to spec, every time.

### 4. Shift Execution & Guest Experience

You are an active member of the bar team during service — not just a supervisor. Open the bar: verify stock, mise en place, glassware, garnish prep, and POS setup. Manage the bar in real time — pace with the kitchen, communicate with servers on drink timing. Engage bar guests with hospitality. Handle bar-level guest issues directly. Close the bar: clean, count, secure product, and complete the bar log.

> Standard: The bar opens ready and closes clean. Guests at the bar feel attended to — not just served.

### 5. Sake, Wine & Specialty Beverage Expertise

Ichiban's beverage identity is rooted in Japanese-inspired and Asian-fusion beverages. Know the sake menu — varieties, flavor profiles, service temperatures, and food pairings. Guide guests through sake and wine selections with confidence. Train bartenders and servers on how to sell sake, specialty cocktails, and beverage pairings. Collaborate with the Manager on sake and import beer selection during ordering cycles.

> Standard: Every bartender on your team can describe, recommend, and sell the sake menu without a cheat sheet.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Audit current bar inventory, pricing, and recipe documentation. Identify gaps and bring a priority list to the Manager. Observe bartender team performance and begin individual coaching notes. **Days 31--60** Run inventory and ordering independently. Complete first beverage cost analysis and present to Manager. Launch one new training session with the bar team. **Days 61--90** Full ownership of beverage program cost and performance. All bartenders trained to current menu spec. Deliver a beverage menu proposal or improvement recommendation to ownership.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The bar is one of the highest-margin areas of the restaurant. How it is managed directly determines profitability:

- A $2 increase in average bar tab across 40 bar guests per night adds over $28,000 in additional revenue annually

- Tight pour control at 1% improvement in beverage cost saves thousands per year across a full-service bar

- A well-trained bar team upsells sake pairings, premium spirits, and specialty cocktails without being pushy

- Bar regulars are among the most loyal and highest-spending guests in the restaurant — your relationships drive those visits

**The bar is a business within the business. Manage it like one.**

## WHAT WE EXPECT

- Know your cost numbers: *Not just the recipes — the margins too.*

- Train your team: *Do not just correct them after the fact. Teach before the shift.*

- Be behind the bar: *During peak service, not just observing from the side.*

- Keep inventory current: *Accurate records every week — no estimating, no skipping weeks.*

- Communicate proactively: *The Manager should not hear about product, cost, or team issues from someone else.*

- Represent Ichiban: *Every guest at your bar gets the full hospitality experience.*$JD$
  from positions p where p.slug = 'bar_mgr'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Manager_Job_Description_Ichiban.md → positions.slug = 'gen_mgr'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Owner / Operator
Compensation: Salaried — commensurate with experience
Status: Full-Time, Salaried Exempt
Schedule: Varies — includes nights, weekends, and peak service periods
[/POS_INFO]

## WHY THIS ROLE MATTERS

Ichiban Sushi has operated since 2003. That kind of longevity is not luck — it is the result of consistent standards, a team that cares, and leadership that shows up every day. As Manager, you are the operator in the building when the owner is not there. Your decisions shape the guest experience, protect our culture, and directly determine whether this restaurant is profitable. Every department — FOH, bar, sushi bar, kitchen, and hibachi — runs through you. This is not a title. It is a responsibility.

## THE STANDARD

**As Manager at Ichiban, you are expected to operate at the highest level across every department. The following are the non-negotiable standards for this role:**

- The restaurant is guest-ready before the first table is seated — every department, every shift.

- Every direct report is coached and developed, not just managed. You build leaders.

- Labor and food cost are monitored and managed each shift — not reviewed after the fact.

- Guest issues are resolved with urgency and ownership — no passing the buck, no delays.

- You communicate openly with ownership on financial performance, team issues, and operational status.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Full Restaurant Oversight

You own the operation from open to close. FOH, bar, sushi bar, and kitchen all report to you. Before service, confirm every department is staffed, prepped, and on-standard. During service, stay visible on the floor and course-correct in real time. At close, debrief with shift leads and confirm the building is secured.

> Standard: Every shift opens prepared and closes clean. No department goes unwalked, and no issue goes uncaught before the first guest arrives.

### 2. Team Leadership & Direct Report Development

Your direct reports are the Assistant Manager, Bar Manager, Kitchen Manager, Sushi Manager, and Hibachi Chefs. Your job is to lead them — not just manage them. Hold weekly check-ins with each department lead. Identify development opportunities for assistant-level staff. Document performance issues and follow through on accountability. Recognize excellent execution publicly — your team performs at the level you celebrate.

> Standard: Every manager and lead under you knows their targets, knows where they stand, and knows what they are working toward.

### 3. Financial Accountability & Labor Management

You are accountable for the financial performance of the restaurant shift by shift. Monitor labor in real time using 7shifts — cut or add hours based on actual volume. Review daily sales reports and compare against labor percentage targets. Track check averages and coach on upsell opportunities. Report weekly performance metrics to ownership with context and a correction plan when numbers are off.

> Standard: Labor stays within target. Food cost is tracked. Check averages trend in the right direction. You know your numbers before ownership asks.

### 4. Hibachi Program Coordination

Ichiban runs a dual hibachi model. The two hibachi table chefs handle 30% of hibachi production tableside — those chefs report directly to you. The remaining 70% of hibachi volume comes out of the main kitchen under the Kitchen Manager. Your job is to keep both sides coordinated so the guest experience is seamless. Brief hibachi chefs on nightly reservation details before service. Confirm the kitchen is prepped for hibachi volume. Monitor pacing throughout service and escalate timing issues before they become guest complaints.

> Standard: Hibachi runs on time every night. The table chefs and kitchen team both know the plan before service starts.

### 5. Guest Experience & Service Recovery

The guest experience is ultimately your responsibility. Touch tables during service, address escalated complaints directly, and resolve them on the spot with authority. Review online feedback weekly and coach the team based on recurring themes. Set the culture that every guest leaves better than they arrived.

> Standard: No guest complaint leaves the building unresolved. Your floor presence prevents most issues before they escalate.

### 6. Compliance, Safety & Closing Procedures

You are responsible for the physical safety of the team, health code compliance across all areas, and the proper closing of the building every night. Enforce food safety and sanitation standards. Complete nightly closing procedures including cash management, system close, and security check. Report any compliance concerns to ownership without delay.

> Standard: The restaurant closes clean, secure, and by the book every single night. No shortcuts, no exceptions.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Shadow ownership on financial reviews and operational decisions. Audit all current SOPs and establish baseline metrics for labor, food cost, and check averages. Build direct relationships with all department leads. **Days 31--60** Own all shift-level decisions independently. Run weekly manager meetings. Begin coaching direct reports on documented performance gaps. Present first financial summary to ownership. **Days 61--90** Full P&L accountability for your shifts. All direct reports have clear documented performance expectations. Identify one operational improvement and implement it with a measurable outcome.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Every decision a manager makes has a direct financial consequence. This is the highest-leverage position in the restaurant:

- Labor managed at 1% better across 300 weekly covers adds thousands of dollars back to the bottom line annually

- A $2 check average increase over 300 covers per night is $600 in recovered revenue — every single shift

- One recovered guest complaint turns a negative review into a loyal regular worth hundreds of dollars over time

- Developing one assistant into a shift leader reduces your daily workload and creates a scalable team

- Consistent clean financials give ownership the confidence to invest in growth — new concepts, new locations

**You do not just run shifts. You build the business.**

## WHAT WE EXPECT

- Lead by example: *You set the culture by how you show up every day — energy, standards, and attitude.*

- Transparency: *Operate with full transparency with ownership — no surprises, no delayed bad news.*

- Develop your team: *Every direct report should be growing. That is part of your job description.*

- Know your numbers: *Labor, food cost, and check average — before you are asked.*

- Handle conflict directly: *No gossip, no avoidance. Address issues with professionalism and clarity.*

- Protect the brand: *Ichiban was built over 20+ years. Hold the standard that earned that reputation.*$JD$
  from positions p where p.slug = 'gen_mgr'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Assistant_Kitchen_Manager_Job_Description_Ichiban.md → positions.slug = 'asst_kitchen_mgr'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Kitchen Manager
Compensation: Hourly — commensurate with experience
Status: Full-Time, Hourly Non-Exempt
Schedule: Varies — includes nights, weekends, and peak service periods
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Kitchen Manager sets the standard. Your job is to hold it when they are not on the line. As Assistant Kitchen Manager, you are the daily anchor of BOH execution — the person who makes sure prep is done right, the line runs clean, and the team performs at its best every single shift. This role is where kitchen leaders are made. If you want to run a kitchen one day, this is where you prove it.

## THE STANDARD

**As Assistant Kitchen Manager, you are the Kitchen Manager's operational right hand on the line. These are the standards that define this role:**

- Prep is complete and at par before service — you verify it, every shift, without being asked.

- Line execution meets the Ichiban standard — you monitor, correct, and coach in real time.

- When the Kitchen Manager is absent, you lead the kitchen as if it were your own.

- Food safety is non-negotiable — temperatures, labeling, and storage are correct on every shift you run.

- You communicate with the Kitchen Manager proactively — no issues go unreported.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Line Oversight & Service Execution

You are on the line during service. Call tickets, manage line pace, and make sure every station produces at the Ichiban standard — on time, on spec, and in the right order. Monitor all stations — fry, grill, sauté, and expo — and catch errors before the plate leaves the kitchen. Coordinate with expo and FOH on ticket timing, modifications, and delays. Re-fire any plate that does not meet standard — no compromised dish goes to a table. Adjust station assignments in real time based on volume and team availability.

> Standard: The line runs clean and on time. Every ticket is called, every plate is checked before it leaves your kitchen.

### 2. Prep Standards & Quality Verification

A great service starts in prep. Conduct a prep walkthrough at the start of every shift — verify quantities, quality, and labeling. Confirm all station mise en place is complete and correct before service begins. Taste and verify sauces, proteins, and house-made components against recipe standards. Flag shortages or quality issues to the Kitchen Manager before service — not during. Ensure all prep is properly dated, labeled, and stored per health code requirements.

> Standard: Service never starts with incomplete prep on your watch. If a station is not ready, you know about it before the doors open.

### 3. Team Support & Cook Training

You are closer to the line than the Kitchen Manager — which means you see the coaching moments first. Train new kitchen hires on station responsibilities, recipe execution, and safety standards. Provide real-time coaching during service — specific, direct, and constructive. Identify team members who are ready for more responsibility and communicate this to the Kitchen Manager. Reinforce the culture the Kitchen Manager is building. Document recurring performance issues and report to the Kitchen Manager with specifics.

> Standard: Every cook on the line knows what the standard is and receives feedback when they miss it — from you, in real time.

### 4. Inventory Support & Waste Management

You assist the Kitchen Manager in managing cost at the daily level. Monitor daily usage and flag over-usage or quality issues to the Kitchen Manager. Enforce proper portioning at every station — post visual portion guides where needed. Minimize waste through proper prep rotation — FIFO is enforced every shift. Assist with weekly inventory counts as scheduled. Report vendor delivery issues or damaged product to the Kitchen Manager immediately.

> Standard: Waste and portioning are managed daily, not discovered at month-end inventory.

### 5. Kitchen Opening, Closing & Sanitation

You are responsible for the physical state of the kitchen on every shift you lead. Open the kitchen: equipment checks, temperature logs, station setup, and mise en place verification. Close the kitchen: breakdown, deep clean, equipment shutdown, temperature check, and walk-in organization. Enforce sanitation standards throughout service — no shortcuts, no we will get it later. Maintain all temperature and cleaning logs accurately. Report any equipment failures or safety hazards to the Kitchen Manager immediately.

> Standard: The kitchen opens clean and closes cleaner. Temperature logs are complete and accurate every single day.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Learn all kitchen stations and the full menu to execution standard. Shadow Kitchen Manager on inventory, ordering, and food cost review. Build rapport with BOH team and identify key performers. **Days 31--60** Lead full shifts independently when Kitchen Manager is off. Run daily prep verification and station coaching without prompting. Assist with first solo inventory count. **Days 61--90** Full line ownership on assigned shifts. Identify one operational improvement — prep efficiency, waste reduction, or a training gap — and present the solution to the Kitchen Manager.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Assistant Kitchen Manager is the daily execution layer of BOH profitability. Your work translates directly into financial outcomes:

- Correct portioning enforced daily eliminates hidden food cost creep — small overages at volume add up fast

- A well-prepped kitchen reduces ticket times, which increases table turn and revenue per service period

- Proper FIFO and waste discipline can recover hundreds of dollars per week in otherwise discarded product

- Real-time coaching on the line reduces re-fires and remakes — both carry direct food cost consequences

- Running the kitchen at standard when the KM is absent means the restaurant never loses a shift

**You are the standard when no one is watching. That is what this role is built on.**

## WHAT WE EXPECT

- Verify prep before service: *Every shift, without being asked. That is the job.*

- Be on the line: *During service, not walking around supervising from the back.*

- Coach with specifics: *Tell cooks what is wrong and how to fix it — not just that it is wrong.*

- Communicate proactively: *The Kitchen Manager should not find out about problems from someone else.*

- Enforce food safety: *Temperatures, labeling, and storage — every single shift.*

- Own coverage shifts: *When the KM is out, you run the kitchen fully — not partially.*$JD$
  from positions p where p.slug = 'asst_kitchen_mgr'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Sushi_Lead_Job_Description_Ichiban.md → positions.slug = 'sushi_lead'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Sushi Manager
Compensation: Hourly — $16.00/hr + Tips
Status: Full-Time, Hourly Non-Exempt
Schedule: Varies — includes nights, weekends, and peak service periods
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Sushi Manager sets the standard for this bar. Your job is to hold it — every shift, whether the Sushi Manager is present or not. As Sushi Lead, you are the daily anchor of the sushi bar: the person who makes sure prep is right, the team is executing, and the quality never slips. This role is for someone who takes pride in their craft and understands that every piece of sushi that leaves this bar is a reflection of Ichiban's reputation.

## THE STANDARD

**As Sushi Lead, you are the operational bridge between the sushi chefs and the Sushi Manager. These standards define your role:**

- The sushi bar is prepped, clean, and organized before service — you verify it every shift.

- Quality control is your responsibility during service — every plate that leaves the bar meets the standard.

- When the Sushi Manager is absent, you are the Sushi Manager for that shift.

- You support and develop the sushi chef team — coaching is part of this job, not extra.

- You communicate every relevant issue to the Sushi Manager — proactively, accurately, and without delay.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Daily Sushi Bar Execution

You are on the bar. Open the bar: verify fish quality and quantity, rice production, station setup, and mise en place. Execute sushi production during service — maintain speed, accuracy, and presentation standard. Confirm all modifications and special requests are communicated and executed correctly. Monitor bar flow during service — pace sushi production to coordinate with kitchen ticket timing. Close the bar: fish storage, station breakdown, cleanliness check, and product labeling.

> Standard: Every piece that leaves your bar is correct, clean, and presented to standard — regardless of how busy it gets.

### 2. Quality Control & Recipe Adherence

Consistency is the bar's reputation. Conduct plate checks before and throughout service — portion, presentation, and temperature. Correct technique issues on the spot with direct, coaching-style feedback. Taste-check rice seasoning, sauces, and daily prep components against the recipe standard. Flag any fish quality concerns immediately to the Sushi Manager — do not use questionable product. Enforce recipe adherence across all sushi chefs — no improvisation without Sushi Manager approval.

> Standard: The sushi bar produces the same quality on your shift as it does when the Sushi Manager is present. That is the goal.

### 3. Team Coordination & Sushi Chef Development

You are a leader on the bar. Assign prep and station responsibilities clearly at the start of each shift. Provide real-time coaching during service — specific, skill-focused, and constructive. Identify training needs and communicate them to the Sushi Manager with specific observations. Model the work ethic and craft standard you expect from the team. Recognize strong execution from team members — reinforce the behavior you want to see repeated.

> Standard: Every sushi chef on your shift knows their assignment, receives feedback, and ends the shift better than they started.

### 4. Inventory Monitoring & Waste Awareness

You are the daily eyes on sushi bar inventory. Monitor fish usage throughout service — flag early when a product is running low. Enforce FIFO on all fish, rice, and garnish product — no older product hidden behind newer inventory. Manage rice production carefully — over-production is a common and avoidable cost. Report any trim waste, overproduction, or portioning drift to the Sushi Manager. Assist with weekly inventory counts as directed.

> Standard: Waste on your shift is monitored and reported — not silently discarded. You know what went out and why.

### 5. Shift Coverage When Sushi Manager is Absent

When the Sushi Manager is not present, you are responsible for the bar — decisions, quality, team management, and communication. Lead the full bar operation on coverage shifts. Make quality and execution decisions without escalating routine bar issues to the floor manager. Communicate any significant concerns — product issues, team incidents, guest complaints — to the Manager on duty. Do not make vendor or menu changes without Sushi Manager approval. Brief the Sushi Manager on coverage shifts upon their return.

> Standard: The bar performs at standard without the Sushi Manager present. If that is not happening, this role is not being fully executed.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Execute all sushi bar functions to current standard. Shadow Sushi Manager on ordering, receiving, and cost review. Identify one skill gap in the current sushi team and communicate to Sushi Manager. **Days 31--60** Run full bar operations independently on coverage shifts. Assist with inventory count and review. Deliver quality feedback to at least two sushi chefs per week — documented. **Days 61--90** Bar executes at standard on all assigned shifts. Sushi Manager trusts you for full coverage. Identify one improvement to bar efficiency or quality and present it to the Sushi Manager with a recommendation.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Sushi Lead is the daily execution layer of one of Ichiban's most important and margin-sensitive stations:

- Consistent quality on every shift builds the bar reputation that drives repeat sushi bar guests — among Ichiban's highest-spending customers

- Proper daily FIFO and fish monitoring prevents costly waste that compounds quickly at raw fish price points

- Rice and prep discipline on your shift eliminates overproduction — one of the most common hidden cost drivers at any sushi bar

- Coaching sushi chefs to execute correctly reduces re-fires and remakes, both of which carry direct food cost consequences

- Coverage shifts that hold to standard mean the restaurant never loses a sushi bar shift when the Sushi Manager is out

**The craft is the business. Protect it every shift.**

## WHAT WE EXPECT

- Know the menu: *Every roll, every cut, every modifier — from memory.*

- Hold the quality standard: *Even when it is busy. Especially when it is busy.*

- Communicate proactively: *No surprises, no silent problems. The Sushi Manager should not find out from someone else.*

- Coach with specifics: *Not correction by silence — name what is wrong and how to fix it.*

- Monitor usage every shift: *Flag fish and rice issues early, not after the fact.*

- Lead fully on coverage shifts: *Not partially. Own the bar when the Sushi Manager is out.*$JD$
  from positions p where p.slug = 'sushi_lead'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Sushi_Manager_Job_Description_Ichiban.md → positions.slug = 'sushi_mgr'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Manager
Compensation: Salaried — commensurate with experience
Status: Full-Time, Salaried Exempt
Schedule: Varies — includes nights, weekends, and peak service periods
[/POS_INFO]

## WHY THIS ROLE MATTERS

Sushi is Ichiban's identity. It has been since 2003. Guests come specifically for the sushi bar — the quality, the craft, the experience. As Sushi Manager, you are the keeper of that standard. Your sushi bar must deliver at a level that honors over 20 years of reputation and justifies why guests choose Ichiban over every other option in Baton Rouge. This is not just a culinary role — it is a leadership role with a financial responsibility attached to every roll you send out.

## THE STANDARD

**As Sushi Manager, you hold one of the most specialized and brand-critical positions at Ichiban. These are the standards you are held to:**

- Every piece of sushi that leaves your bar meets the presentation, portion, and quality standard — no exceptions.

- Fish and seafood are sourced from trusted vendors, received with personal inspection, and stored correctly every day.

- Sushi cost is tracked weekly. Yield, waste, and over-ordering are managed proactively — not discovered at month-end.

- The Sushi Lead and sushi chefs are trained, developed, and held to your standard whether you are present or not.

- The sushi bar is an experience, not just a station. Guests who sit at the bar should feel that difference.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Sushi Bar Ownership & Daily Execution

You own everything that comes out of the sushi bar. Open the bar: verify fish quality, mise en place, rice, and station readiness before service. Execute or directly supervise all sushi production during service — maintain speed without sacrificing quality. Conduct plating checks throughout service — presentation, portion, and temperature must meet standard. Manage communication between the sushi bar, expo, and kitchen for coordinated delivery. Close the bar: properly store fish, clean stations, wrap equipment, and label all product.

> Standard: Every piece of sushi is intentional. Every plate that leaves your bar looks like Ichiban at its best.

### 2. Fish Sourcing, Vendor Relations & Receiving

The quality of your sushi starts before it arrives. Maintain active relationships with all fish and seafood vendors — know the product and know the reps. Place fish orders based on projected volume, current inventory, and freshness windows. Inspect every delivery personally — verify freshness, grade, temperature, and invoice accuracy. Reject any product that does not meet Ichiban's quality standard. Evaluate vendor performance over time and communicate sourcing concerns or opportunities to the Manager.

> Standard: No fish goes on a plate that you would not eat yourself. Every delivery is inspected — not assumed to be correct.

### 3. Menu Development & Pricing

You are the culinary voice of the sushi bar. Develop new rolls, nigiri, and sashimi offerings with cost and margin in mind. Create seasonal or specialty sushi specials that drive check average and repeat visits. Calculate cost per roll and cost per piece for all menu items — price with margin discipline. Present new menu ideas to the Manager with a cost card and a business rationale. Refresh the sushi menu when items underperform — dead menu weight hurts margin and guest attention.

> Standard: Every item on the sushi menu has a documented cost card. No item is priced without knowing the margin first.

### 4. Sushi Lead Development & Team Standards

The Sushi Lead is your right hand. Develop them into someone who can run the bar at your standard when you are not present. Train the Sushi Lead on all bar functions — sourcing, ordering, execution, and team management. Conduct regular feedback sessions with sushi chefs — specific, skill-focused, and encouraging. Set clear expectations for technique, cleanliness, and guest interaction. Identify skill gaps in the sushi team and build a training plan to address them.

> Standard: The Sushi Lead can run the bar without you present and the quality holds. If it does not, training is not complete.

### 5. Sushi Cost, Yield & Waste Management

Sushi is among the highest food cost items on the menu — yield management and waste control are essential. Track yield on all fish — weight received versus weight used must match within acceptable variance. Minimize trim waste through proper butchering technique and full-product utilization. Monitor rice production carefully — over-production is one of the most common and avoidable waste sources in a sushi bar. Review sushi cost weekly against sales and investigate any variance over 1%. Adjust ordering based on sales data, not habit.

> Standard: Sushi cost is reviewed every week. Waste is tracked at the source, not discovered at month-end.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Audit all current sushi recipes, cost cards, and vendor relationships. Identify gaps and bring a priority list to the Manager. Observe and assess the current sushi team — document skill levels and development needs. **Days 31--60** Own all fish ordering and receiving independently. Run first full sushi cost analysis and present findings to the Manager. Begin a formal development plan with the Sushi Lead. **Days 61--90** Full sushi bar ownership — cost in target, team trained, bar executing at standard. Present one menu development proposal or cost improvement to ownership with supporting data.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The sushi bar drives some of the highest check averages and most brand-loyal guests at Ichiban. As Sushi Manager, your financial impact is significant:

- A sushi bar running at proper yield can recover thousands of dollars annually in otherwise lost fish cost

- Specialty rolls priced with strong margins — and promoted effectively — directly lift check averages without adding volume

- Bar guests who become regulars visit more frequently and at higher spend than the typical dining room guest

- A Sushi Lead who can run the bar independently gives you scheduling flexibility and reduces operational risk

- Menu items developed with cost discipline generate revenue that does not require more covers to be profitable

**The sushi bar is Ichiban's signature. Make sure it earns that every single night.**

## WHAT WE EXPECT

- Know your fish: *Quality, sourcing, and freshness standards — and never compromise them.*

- Know your cost: *Every roll has a margin, and you are responsible for it.*

- Develop your Sushi Lead: *The bar should not require your presence to perform at standard.*

- Build the experience: *Not just the food. The bar is a destination — treat it like one.*

- Communicate proactively: *Sourcing changes, cost variances, and team issues go to the Manager before they escalate.*

- Hold your team to your standard: *With skill, clarity, and respect — every shift.*$JD$
  from positions p where p.slug = 'sushi_mgr'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Kitchen_Manager_Job_Description_Ichiban.md → positions.slug = 'kitchen_mgr'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Manager
Compensation: Salaried — commensurate with experience
Status: Full-Time, Salaried Exempt
Schedule: Varies — includes nights, weekends, and peak service periods
[/POS_INFO]

## WHY THIS ROLE MATTERS

Your kitchen produces 100% of Ichiban's non-sushi food — and 70% of every hibachi order that goes out. That is the engine of this restaurant. When your kitchen runs right, the whole house runs right. When it does not, every other department feels it. As Kitchen Manager, you own the food — the quality, the consistency, the cost, and the team that makes it happen. The same standard is expected on a Tuesday as it is on a Friday at full capacity.

## THE STANDARD

**As Kitchen Manager, consistent execution at every station, every shift is the baseline expectation. These standards define the role:**

- Every station is prepped, clean, and ready before service — no exceptions, no excuses.

- Food cost is tracked and managed actively — variance is investigated and corrected, not accepted.

- Recipes and sauces are made to spec every time. There is no close enough in this kitchen.

- Your team knows the standards and is trained to execute them without your constant supervision.

- The hibachi kitchen is coordinated and ready for every reservation — timing and volume are your responsibility.

## CORE RESPONSIBILITIES & ACCOUNTABILITY

### 1. Kitchen Operations & Line Leadership

You run the kitchen. From prep to close, every station under your watch executes to the Ichiban standard. Walk the kitchen at the start of every shift — verify prep, temperatures, cleanliness, and staffing. Manage the line during service: call tickets, monitor pace, ensure quality at every station. Coordinate communication between kitchen, expo, and FOH. Address quality issues immediately — re-fire if necessary, no compromised plate goes out. Close the kitchen to health code standards.

> Standard: Every plate that leaves your kitchen is correct, clean, and on time. If it is not, it does not go.

### 2. Hibachi Kitchen Coordination

70% of Ichiban's hibachi volume comes out of your kitchen — not from the tableside chefs. This is a significant production responsibility that requires dedicated coordination every service. Review hibachi reservations daily. Ensure hibachi-specific prep is complete before every service: proteins, vegetables, sauces, and rice. Coordinate with the Manager on timing for large hibachi parties. Monitor hibachi ticket flow throughout service — your kitchen and the tableside chefs must be synchronized.

> Standard: Hibachi kitchen production is prepped, timed, and executed to match every reservation. No hibachi table waits on your kitchen.

### 3. Food Cost, Ordering & Inventory

Food cost is one of the most direct levers on restaurant profitability — and it is yours to manage. Conduct weekly food inventory with accurate counts. Place all food orders based on par levels and weekly usage. Receive deliveries and verify against the invoice — reject incorrect or substandard product. Monitor daily waste and direct the team on proper portioning. Review weekly food cost reports with the Manager and correct variance within 48 hours.

> Standard: Food cost is inventoried weekly, ordered to par, and variance is explained with a correction plan — not a shrug.

### 4. Recipe Standards, Sauce Production & Consistency

Ichiban's food identity is built on consistency. Guests who return expect the same dish they loved last time. Maintain written recipes and build specs for every menu item — laminated and posted at each station. Produce all house sauces and marinades to recipe with no improvisation. Conduct regular line checks during service to verify portion sizes, presentation, and temperature. Train new cooks on recipe execution before they work the station independently.

> Standard: Every dish tastes the same on Monday as it does on Saturday. Consistency is not optional — it is the brand.

### 5. BOH Team Development & Scheduling

Build a kitchen team that executes at a high level with or without you watching. Train new hires on stations, safety, sanitation, and recipe standards. Identify high-potential cooks and build a clear path toward advancement. Build the BOH schedule using 7shifts — balance labor cost against projected volume. Address performance issues directly and document them. Run a kitchen culture that is demanding but fair.

> Standard: Your kitchen team can execute the full menu without you on the line. If it falls apart when you are gone, training is incomplete.

### 6. Sanitation, Safety & Health Code Compliance

A clean kitchen is a safe kitchen. Enforce food safety standards at every station: temperature control, cross-contamination prevention, labeling, and storage. Maintain temperature logs for all walk-ins and refrigeration units. Ensure the kitchen would pass a health inspection at any moment. Train all BOH staff on food handler requirements. Report equipment failures, pest concerns, or safety hazards to the Manager immediately.

> Standard: This kitchen would pass a health inspection at any moment of any day. That standard is set and maintained by you.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Days 1--30** Audit current recipe documentation, inventory system, and food cost performance. Identify the top 3 gaps and present a correction plan to the Manager. Shadow current BOH team to assess skills. **Days 31--60** Own food ordering and inventory independently. Run first full food cost analysis and present findings. Begin individual coaching with BOH team — document performance baseline for each cook. **Days 61--90** Full BOH ownership — cost in target, team trained to spec, recipes documented at every station. Deliver one menu or process improvement recommendation with financial justification.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The kitchen is where profitability is made or lost. As Kitchen Manager, your decisions have direct and immediate financial impact:

- A 1% reduction in food cost across Ichiban's annual food spend represents thousands of dollars in recovered margin

- Consistent portioning eliminates hidden loss — small overages on 200 covers per night compound quickly into real money

- Hibachi kitchen execution at full volume drives some of Ichiban's highest per-table revenue nights

- Reducing prep waste by 10% through tighter ordering and recipe discipline adds directly to the bottom line

- A trained, stable BOH team reduces turnover costs — recruiting, onboarding, and errors from new hires are expensive

**Your kitchen is the engine. Keep it running at full capacity — efficiently, consistently, profitably.**

## WHAT WE EXPECT

- Know your food cost: *Not at month-end — every single week.*

- Build the recipes: *Document them, post them, train to them. Consistency starts with you.*

- Be on the line: *During peak service, not in the office during crunch.*

- Hold your team accountable: *With clarity and respect — every time.*

- Coordinate hibachi production: *With the same precision as everything else on the menu.*

- Report early: *Problems get to the Manager before they become crises.*$JD$
  from positions p where p.slug = 'kitchen_mgr'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

end $$;
-- ============================================================
-- WHG TEAM PORTAL — SEED ICHIBAN POSITION DESCRIPTIONS
-- Inserts/updates position_descriptions rows scoped to Ichiban
-- Sushi for all 12 non-management staff positions.
--
-- Management roles (Asst Manager, Manager, Asst Kitchen Mgr,
-- Kitchen Mgr) intentionally excluded — Randy will provide those
-- separately.
--
-- Idempotent: upserts on (position_id, restaurant_id).
-- ============================================================

do $$
declare ichiban_id uuid;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  if ichiban_id is null then return; end if;

  -- Server_Job_Description_Ichiban.md → positions.slug = 'server'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Assistant Manager / FOH Manager
Pay Type: Tipped Hourly | $2.15/hr + tips
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Servers at Ichiban carry a responsibility that goes beyond taking orders — you are guiding guests through both a sushi experience and a hibachi experience, often in the same visit. Your ability to navigate that dual menu with confidence, upsell intelligently, and build genuine connections determines not just your income but Ichiban's reputation. The experience guests remember — and whether they come back — depends almost entirely on you.

## THE STANDARD

**Every guest welcomed within 2 minutes. Every table receives a genuine upsell recommendation. Every check processed accurately.**

- Guests greeted within 2 minutes of being seated — every time.

- Food delivered within 10 minutes of ordering — every time.

- Every table receives at least one upsell recommendation.

- Hot food hot. Cold food cold. Always.

## CORE RESPONSIBILITIES

### 1. Greet and Connect

Welcome guests within 2 minutes with warmth and attention — not a script. Introduce yourself. Ask if they have been to Ichiban before — it tells you how much guidance they need. Earn their trust before they make a single decision.

> Standard: 100% of tables greeted within 2 minutes. Missed greetings reported to AM on duty immediately.

### 2. Guide the Order with Expertise

Know the full menu — every sushi roll, every hibachi combo, every appetizer and drink — by the end of Week 2. Recommend with confidence. Suggest sake or Japanese cocktails with sushi. Recommend the hibachi combo that fits the guest's appetite. You are not just taking orders — you are the expert guide they chose to trust.

> Standard: Menu mastered by end of Week 2. Every table receives at least one recommendation or pairing suggestion.

### 3. Enter Orders with 100% Accuracy

All orders entered into Toast POS with 100% accuracy. Special requests captured and confirmed — no wasabi, extra yum yum sauce, gluten-free soy sauce. Errors at order entry cost food, time, and trust. Get it right the first time.

> Standard: Zero order entry errors per shift. All modifications confirmed with guest before submission.

### 4. Deliver Food and Provide Post-Entree Care

Deliver food within 10 minutes. Check back within 2 minutes of the first bite. 'Enjoying your hibachi chicken?' is not a formality — it is your chance to catch a problem before it becomes a complaint. Use every table touch to deepen the connection and confirm satisfaction.

> Standard: 10-minute food delivery from ticket. Post-entree check within 2 minutes of delivery.

### 5. Maintain a Clean, Organized Section

Clear plates within 5 minutes of finishing. Tables reset immediately. Chopsticks, condiments, and napkins restocked without being asked. A clean section is a professional section — and it directly impacts how quickly the next guest can be seated.

> Standard: Tables cleared within 5 minutes. Condiments and napkins restocked each visit. No unset or cluttered tables during service.

### 6. Handle Payments with Accuracy

Process all payments through Toast POS with 100% accuracy. Split checks confidently — a 10-person hibachi party split 10 ways is part of the job. Flag any discrepancy to the AM. Submit cash drops per shift-end procedure.

> Standard: Zero uncorrected payment errors per shift. All discrepancies escalated to AM. Cash drops submitted per procedure.

### 7. Support the Team

Run food for teammates during rushes. Help clear tables when bandwidth allows. Relay urgent guest needs to expo or the sushi bar. No phones, no headphones. Ichiban operates as a team — not as individual sections.

> Standard: Minimum 2 visible team assists per shift during peak periods.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Toast POS operational. Sushi and hibachi menu items learned. Completing full shifts with AM support.

**End of Week 2:** Full menu mastered. Independent table management. Upsell on every table. No open coaching issues.

**End of Month 1:** Check average meeting shift target. Guest satisfaction consistent. Zero uncorrected payment errors.

**End of Month 3:** Trusted floor anchor. Eligible for cross-training toward a server leadership or specialty role.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Servers sit at the intersection of hospitality and profitability. Your performance directly determines whether Ichiban hits its revenue targets, earns the reviews that bring new guests in, and keeps existing guests coming back.

- Every $8 upsell across 15 tables = $120 in additional revenue per shift

- Accurate orders mean zero remakes — which means lower food cost and faster ticket times

- Genuine connections with guests drive repeat visits — the most cost-effective form of revenue growth

- Clean, efficient sections allow faster table turns — which increases covers and revenue per labor hour

**You are not just serving food. You are the reason guests choose Ichiban again.**

## WHAT WE EXPECT

- Grooming & Uniform: *All-black dress code. Clean, professional appearance at all times. Ichiban uniform standards enforced.*

- Attitude: *Warm, composed under pressure, coachable. We train skills — we cannot train character.*

- Physical Requirements: *Able to stand 8+ hours, carry trays up to 20 lbs, bend, reach, and move through a busy floor quickly.*

- Availability: *Evenings, weekends, and holidays required. Full-time preferred (30-40 hrs/week).*

- Experience: *None required — we train from the ground up. The right attitude is the only starting requirement.*$JD$
  from positions p where p.slug = 'server'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Hostess_Job_Description_Ichiban.md → positions.slug = 'host'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Assistant Manager / FOH Manager
Pay Type: Hourly + Tips | Starting $11.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

For many guests, Ichiban is not just dinner — it is a celebration, a first hibachi experience, a birthday with family. Your greeting is the first moment of that experience. How you welcome, seat, and manage flow sets the emotional tone before they see a single menu item. A great Host does not just fill seats — they create an arrival experience that makes every guest feel like Ichiban is glad they chose us tonight.

## THE STANDARD

**Every guest is acknowledged within 30 seconds of walking in. No party waits more than 5 minutes without a personal status update.**

- All guests greeted within 30 seconds of arrival — every time.

- Waitlist parties updated every 5 minutes. No guest has to come ask where they stand.

- Server sections balanced — no server overloaded while another section is light.

- Host stand inspection-ready before every service open.

## CORE RESPONSIBILITIES

### 1. Greet and Welcome Every Guest

Welcome every guest within 30 seconds with genuine warmth and attentiveness. Read the party — a couple on a date, a birthday group of 12, a family with young kids — and respond accordingly. Ask about reservations or preferences. Guide them with intention, not just efficiency.

> Standard: 100% of guests acknowledged within 30 seconds. Greeting energy consistent regardless of shift volume or wait times.

### 2. Manage Reservations and Waitlists

Use OpenTable to confirm reservations, note special requests (birthday setups, hibachi preference, dietary needs), and manage walk-in waitlists during peak periods. Give accurate wait time estimates — never over-promise. Update waiting guests every 5 minutes without being asked.

> Standard: OpenTable reservations confirmed and noted before service open. Waitlist guests updated every 5 minutes. Zero guests left to approach the stand for a status update.

### 3. Coordinate Seating with Servers and Bussers

Know every server's section, current table count, and capacity. Seat strategically — no server gets triple-sat while another section is empty. Confirm with Bussers that tables are fully reset before seating the next party. A table that is not ready is not a table.

> Standard: Section rotation followed unless directed otherwise by AM. No party seated at an unconfirmed reset table.

### 4. Handle Phone Inquiries Professionally

Answer all calls within 3 rings. Know the menu well enough to answer basic questions about hibachi options, roll ingredients, and reservation availability. Capture large party inquiries and relay to AM immediately. Record all phone reservations in OpenTable accurately.

> Standard: All calls answered within 3 rings. Large party inquiries escalated to AM within 5 minutes. Zero missed reservation entries.

### 5. Maintain the Host Stand and Lobby

Keep the stand organized, menus wiped and fully stocked, tablet charged and operational, and the lobby area clean. The host stand and entry are the first physical impression of Ichiban — they must reflect our standards at all times.

> Standard: Host stand and lobby inspection-ready before service open. Menus checked and restocked at start of every shift.

### 6. Support the Floor During Peak Periods

When the floor needs it, be part of the solution. Deliver water, bring menus to seated guests, relay server requests, help with bussing during a surge. Your post is not a podium — it is wherever the guest experience needs you.

> Standard: Minimum 2 visible floor assists per rush period. Host stand never left unattended without AM or designee coverage.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** OpenTable operational. All section layouts and server assignments learned. Greeting protocol consistent.

**End of Week 2:** Independent waitlist and reservation management. Balanced seating without prompting. No missed greetings.

**End of Month 1:** Rush management confident. Wait time accuracy consistent. Zero service complaints tied to seating flow.

**End of Month 3:** Trusted to run the host stand independently on high-volume nights. Eligible for server cross-training.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Host is the first and last person every guest interacts with at Ichiban. That bookend defines the overall experience — and the overall experience determines whether they return.

- Efficient, balanced seating prevents service breakdowns that damage guest satisfaction and server tip averages

- Accurate wait time management reduces walkouts — every walkout is lost revenue and a lost future guest

- A warm, organized arrival experience is one of the most frequently cited reasons guests choose a restaurant again

- Proactive floor support during rushes protects service quality during the highest-revenue periods of the night

**You do not manage a door. You manage the start — and often the memory — of every guest's experience.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban uniform standards. Polished, professional appearance at all times — the host stand is always on display.*

- Attitude: *Warm, composed, and adaptable. Every guest deserves your best energy, even at the end of a busy Saturday.*

- Physical Requirements: *Able to stand 8+ hours, carry menus and light supplies up to 10 lbs, move quickly through a busy lobby.*

- Availability: *Evenings, weekends, and holidays required. Full-time preferred (30-40 hrs/week).*

- Experience: *None required — we train from the start. Natural hospitality instincts are the most important qualification.*$JD$
  from positions p where p.slug = 'host'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Bartender_Job_Description_Ichiban.md → positions.slug = 'bartender'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Assistant Manager / FOH Manager
Pay Type: Tipped Hourly | $4.00/hr + tips
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The bar at Ichiban is both a dining destination and the social hub of the restaurant. Guests who sit at the bar are not waiting for a table — they are choosing an experience. A skilled Bartender at Ichiban does not just pour drinks — they build the atmosphere, create regulars, and directly drive check averages at one of our highest-revenue-per-seat areas. Every drink, every interaction, and every recommendation is a reflection of this restaurant.

## THE STANDARD

**Every drink is built to spec. Every bar guest is acknowledged within 60 seconds of sitting down.**

- All drinks crafted to Ichiban's recipe standards — no improvised portions.

- Bar guests receive full server treatment: greet, recommend, upsell, check back.

- Bar surface clean, organized, and guest-ready throughout the entire shift.

- Drink orders for dining room tables completed within 5 minutes of ticket.

## CORE RESPONSIBILITIES

### 1. Craft Every Drink to Spec

Build every Ichiban signature drink to recipe: lychee martini, sake cocktails, mango mojito, hot sake pours, beer service — all to standard, every time. Guests who loved a drink last Saturday expect the same drink this Saturday. Consistency is your most critical skill.

> Standard: Zero off-spec drinks leaving the bar. Portions measured, not estimated. Presentation meets Ichiban visual standards every pour.

### 2. Own the Bar Guest Experience

Bar guests receive the full Ichiban experience — warm greeting, menu guidance, honest recommendations, and genuine engagement. Suggest sake pairings with sushi rolls, recommend cocktails that complement hibachi. The bar is not a service counter — it is Ichiban's most intimate dining seat.

> Standard: Every bar guest receives a personalized drink or pairing recommendation. Bar check averages meet or exceed dining room average.

### 3. Support Dining Room Drink Orders

During service, servers will call in drink orders for their tables. Build these efficiently without disrupting bar guests. Communicate any delays immediately — never let a drink ticket sit unacknowledged for more than 2 minutes.

> Standard: All dining room drink tickets acknowledged within 2 minutes. Orders completed within 5 minutes of ticket.

### 4. Manage Bar Inventory

Count bar stock at the start of every shift. Restock proactively before you run short. Flag shortages to the AM before service begins. A bar that runs out of sake on a Friday night is a planning failure — not a vendor problem.

> Standard: Pre-shift inventory completed every shift. Shortages flagged to AM before doors open.

### 5. Keep the Bar Spotless

Clean as you go — every time. Sanitized surfaces, polished glassware, organized mise en place. Guests at the bar watch you work. What they see is the experience. A messy bar signals a lack of care, and that reflects on every dish we serve.

> Standard: Bar surface wiped after every order. Glassware polished and properly staged. Bar passes visual inspection at any point during service.

### 6. Handle All Payments Accurately

Manage all bar tabs through Toast POS with 100% accuracy. Split checks confidently. Never let a discrepancy go unresolved at close — flag all cash or POS errors to the AM before end of shift. Submit all cash drops on time.

> Standard: Zero uncorrected payment errors per shift. All discrepancies reported to AM before close. Cash drops submitted per shift-end procedure.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All Ichiban drinks memorized and built to spec. Toast POS operational. Bar setup and breakdown owned independently.

**End of Week 2:** Independent bar management. Pairing recommendations on every guest interaction. No speed or quality issues flagged by AM.

**End of Month 1:** Consistent inventory management. Regular bar guests forming. Bar check averages meeting target.

**End of Month 3:** Trusted to train new bartenders on Ichiban drink program. Eligible for cross-training on FOH leadership duties.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The bar is one of the highest-margin areas in the restaurant. Your performance directly drives beverage revenue, guest loyalty, and check averages — all of which flow straight to the bottom line.

- Cocktails and sake carry strong margins — every drink upsold is a direct profit driver

- Bar regulars visit more frequently and spend more per visit than one-time dining room guests

- Accurate portioning protects beverage cost — over-pouring is invisible waste that compounds fast

- A well-run bar creates an energy that elevates the entire dining room's experience

**You are not pouring drinks. You are building one of the most profitable and visible spaces in this restaurant.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban uniform standards. Clean, professional appearance behind the bar at all times.*

- Attitude: *Warm, naturally hospitable, and composed under pressure. The bar is a stage — your energy sets the vibe.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (liquor cases, ice), move efficiently in a compact bar space.*

- Availability: *Evenings, weekends, and holidays required. Full-time strongly preferred (30-40 hrs/week).*

- Experience: *6+ months bartending experience preferred. Knowledge of cocktails and sake service required. Training provided for strong candidates.*$JD$
  from positions p where p.slug = 'bartender'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Busser_Job_Description_Ichiban.md → positions.slug = 'busser'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Assistant Manager / FOH Manager
Pay Type: Hourly + Tip Share | $5.00/hr + 10% server tipout
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

At a restaurant like Ichiban — with a full sushi bar, a dining room, and a hibachi section — table turnover is revenue. The Busser is the engine behind that turnover. How quickly and completely you reset a table directly determines how many guests we serve in a night. A 5-minute reset means another party seated. A 15-minute reset means a frustrated waitlist and lost revenue. Own this role with that understanding.

## THE STANDARD

**Tables reset within 5 minutes of guest departure. Every guest is greeted with water within 2 minutes of being seated.**

- Water served to newly seated guests within 2 minutes — every table.

- Tables fully reset within 5 minutes of the last guest leaving.

- Dining area floors and surfaces clean throughout service — not just at the end.

- Restrooms checked every 30 minutes during service.

## CORE RESPONSIBILITIES

### 1. Serve Water and Set Tables

Deliver water to every newly seated party within 2 minutes. Place chopsticks, napkins, and settings correctly for the party size — a hibachi table of 8 is set differently than a sushi bar table of 2. Get it right before the server arrives.

> Standard: Water delivered within 2 minutes of seating. Table settings correct for party size and section before server approach.

### 2. Clear Tableware During and After Meals

Remove empty plates, glasses, and bowls as courses finish — without disrupting the guest experience. Coordinate with servers so clearing happens smoothly. Deliver used items to the dish room and sort properly for the dish crew.

> Standard: Empty plates cleared within 5 minutes of finish. Used items sorted and delivered to dish room every run.

### 3. Reset Tables with Speed and Precision

A reset table is a revenue-ready table. Wipe surfaces thoroughly — no sauce streaks, no crumbs. Set chopsticks, napkins, and condiments to Ichiban's standard. Check against spec before signaling to the host that the table is ready.

> Standard: Full table reset completed within 5 minutes of guest departure. Reset confirmed with host before next seating.

### 4. Maintain the Dining Area Throughout Service

Sweep under tables and hibachi areas during service lulls. Keep the floor clean — soy sauce and rice spills are both a slip hazard and a guest experience issue. Check restrooms every 30 minutes and address anything that needs attention.

> Standard: Dining area floors swept every 45 minutes during service. Restrooms checked and documented every 30 minutes.

### 5. Support Servers During Rushes

When the floor is slammed, be a force multiplier. Help run food, deliver water, relay guest requests to the server. The Busser who helps a server during a rush is what allows that server to turn another table and keep guests happy.

> Standard: Minimum 3 visible server assists per rush period. Relay any guest request to server or AM within 2 minutes of noticing it.

### 6. Complete Side Work and Opening/Closing Tasks

Open by restocking dining supplies — napkin holders, soy sauce, chopstick dispensers — before first guests. Close by cleaning your sections thoroughly and restocking for the next day. These tasks are not optional, and they are not someone else's job.

> Standard: Opening side work complete before first guests seated. Closing tasks fully completed before punching out.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Water timing and table reset procedures mastered. Section assignments understood. Restroom check schedule followed.

**End of Week 2:** Consistent 5-minute resets. Server assist behavior natural and proactive. Side work completed without prompting.

**End of Month 1:** Trusted to manage assigned sections independently during rush periods. Zero reset or water timing issues flagged by AM.

**End of Month 3:** Eligible for cross-training as Expo/Food Runner or Server. Considered a reliable floor team anchor.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Table turnover is one of the most direct revenue levers in the restaurant. The Busser's pace and precision determine how many covers Ichiban serves in a night — and that number has a real dollar value.

- A 5-minute reset versus a 15-minute reset across 20 table turns can mean 4-6 additional covers per night

- Additional covers at Ichiban's average check translate directly to top-line revenue every shift

- Clean sections and fast resets create a guest experience that feels organized and professional — which drives return visits

- Proactive server support keeps service quality consistent even during peak volume — protecting tips and satisfaction

**You do not just clear tables. You create the next table — and that is where the next guest's experience begins.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban uniform standards. Clean, well-groomed appearance throughout every shift.*

- Attitude: *Fast, reliable, and team-first. The Busser who makes everyone else's job easier is irreplaceable.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (bus tubs), move quickly through a full dining room.*

- Availability: *Evenings, weekends, and holidays required. Full-time preferred (30-40 hrs/week).*

- Experience: *No experience required — we train from day one. The right work ethic is all you need to start.*$JD$
  from positions p where p.slug = 'busser'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Expo_Food_Runner_Job_Description_Ichiban.md → positions.slug = 'expo'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Assistant Manager / FOH Manager
Pay Type: Hourly + Tips | Starting $10.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

At Ichiban, food comes from multiple places at once — the kitchen line, the sushi bar, the fry station. The Expo and Food Runner is the traffic controller that makes sure every dish reaches the right table, in the right order, at the right time. You are the last quality check before food meets the guest. If something is wrong, you catch it here — not at the table. That makes this one of the most high-impact roles on the floor.

## THE STANDARD

**Every dish verified for accuracy and quality before leaving the expo station. No food reaches a table without being confirmed against the ticket.**

- All orders checked against ticket before delivery — every dish, every time.

- Food delivered to tables within 2 minutes of being ready at expo.

- All modifications confirmed before handoff — no assumptions.

- Expo station clean and organized throughout service.

## CORE RESPONSIBILITIES

### 1. Verify Every Order Before It Leaves Expo

Check every dish against the ticket before it goes to the floor — correct items, correct garnishes, correct modifications. If something is off, catch it here. Sending a wrong dish to a table costs twice: a remake and a disappointed guest. Your attention at this station saves both.

> Standard: 100% ticket verification before food leaves expo. Incorrect items returned to kitchen before reaching the guest.

### 2. Deliver Food to Tables with Speed and Accuracy

Run dishes to tables within 2 minutes of hitting the expo station. Match orders to guests accurately. Announce dishes with basic context — 'Here is your hibachi chicken, enjoy!' — so guests know what they have without having to ask.

> Standard: All food delivered within 2 minutes of expo readiness. Orders announced to guests at delivery.

### 3. Coordinate Between Servers, Kitchen, and Sushi Bar

You are the communication hub between the back and the front. Relay delays proactively — if the sushi bar is 5 minutes out, the server needs to know now, not when the guest is already waiting. Keep information moving in both directions.

> Standard: All delays communicated to servers within 1 minute of identification. Server requests relayed to kitchen or sushi bar within 2 minutes.

### 4. Maintain Expo Station

Wipe down expo counters and tray racks between orders. Keep trays, ticket holders, and supplies organized and restocked. A cluttered expo station slows everything down and creates errors. A clean, organized expo station is a fast, accurate expo station.

> Standard: Expo station wiped and organized after every rush wave. Supplies restocked during service lulls.

### 5. Monitor Food Quality and Presentation

Inspect dishes before delivery — hibachi vegetables neatly arranged, sushi rolls tight and garnished, sauce on the side when requested. Catch missing utensils. Flag cold food. You are not just moving plates — you are the last line of quality control between the kitchen and the guest.

> Standard: Visual quality check on every dish before delivery. Cold, incomplete, or incorrectly presented dishes returned to station for correction.

### 6. Support Kitchen and Sushi Teams During Rushes

When the floor is moving fast, be useful on both sides. Help plate simple items, restock sushi bar supplies, clear expo overflow. Your ability to flex between front and back makes you one of the most valuable people on the floor during a surge.

> Standard: Minimum 2 visible cross-team assists per rush period. Respond to KM or sushi lead direction within 2 minutes.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Expo ticket verification process mastered. All food sections and stations known. Delivery timing consistent.

**End of Week 2:** Independent expo management. Communication between FOH and BOH proactive and clear. Zero missed modifications.

**End of Month 1:** Trusted to manage expo solo during peak periods. Quality catch rate consistent. Server coordination smooth.

**End of Month 3:** Eligible for cross-training as Server or BOH support role. Considered a key operational anchor.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Expo position sits at the intersection of kitchen output and guest experience. Your accuracy and speed directly determine whether guests receive what they ordered, when they expected it.

- Catching a wrong order at expo prevents a remake and a table complaint — both cost money and time

- Fast, accurate food delivery keeps table turn times on target — which drives covers per shift

- Proactive delay communication allows servers to manage guest expectations — which protects tips and satisfaction scores

- Proper quality inspection at expo reduces the comp rate — every comp prevented goes straight back to the bottom line

**You are not running food. You are the final quality gate between this kitchen and our guests.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban uniform standards. Clean, professional appearance throughout every shift.*

- Attitude: *Detail-oriented, fast, and communicative. Expo requires you to see everything and act on it immediately.*

- Physical Requirements: *Able to stand 8+ hours, carry trays up to 25 lbs, move quickly between kitchen, sushi bar, and dining room.*

- Availability: *Evenings, weekends, and holidays required. Full-time preferred (30-40 hrs/week).*

- Experience: *None required — we train from the ground up. Attention to detail and a fast-paced work style are what we look for.*$JD$
  from positions p where p.slug = 'expo'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Takeout_Station_Job_Description_Ichiban.md → positions.slug = 'togo'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Assistant Manager / FOH Manager
Pay Type: Hourly + Tips | Starting $5.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Takeout is a significant and growing part of Ichiban's business — and unlike the dining room, you only get one shot. When a guest picks up their order and drives home, there is no table touch, no recovery, no chance to fix a mistake. What is in that bag is the entire Ichiban experience. Accuracy, speed, and packaging quality are not just operational standards here — they are your hospitality tools.

## THE STANDARD

**Every order checked against the ticket before handoff. Every guest greeted warmly. Every payment processed accurately.**

- 100% order accuracy — every item, every modification, every condiment verified before bag is sealed.

- All orders ready at or before the quoted pickup time.

- Every takeout guest greeted within 30 seconds of approaching the station.

- Takeout station clean, stocked, and organized throughout service.

## CORE RESPONSIBILITIES

### 1. Take and Process Takeout Orders

Answer phone orders professionally. Enter all orders into Toast POS with 100% accuracy — correct items, correct modifications, correct special requests. Confirm pickup times and any special instructions with the guest before hanging up. Order entry errors cascade into wrong bags — prevent them at the source.

> Standard: All orders entered into Toast POS with 100% accuracy. Pickup times confirmed with guest at time of order.

### 2. Pack Every Order Accurately

Package every item with correct containers, condiments, utensils, and sides. Double-check every bag against the ticket before sealing — every soy sauce packet, every set of chopsticks, every extra yum yum sauce on request. If the guest asked for it and it is not in the bag, it is a failure regardless of how good the food is.

> Standard: 100% ticket verification before bag is sealed. All requested add-ons and condiments included. No order leaves the station without a final check.

### 3. Coordinate with Kitchen and Sushi Teams

Relay takeout orders to expo and food runners as soon as they are entered. Monitor timing — know when orders are being made and when they will be ready. If a sushi bar order is running long, you need to know early enough to update the guest, not after they are already waiting.

> Standard: All takeout tickets relayed to expo within 2 minutes of entry. Timing delays communicated to AM with enough lead time to update guests.

### 4. Greet and Serve Pickup Guests

Welcome every guest who comes to pick up their order within 30 seconds. Verify the order by name and confirm contents with them. Offer additional items — bottled sake, beverages, an extra sauce — before they leave. A $5 add-on is a legitimate upsell that the guest actually wants.

> Standard: All pickup guests greeted within 30 seconds. Order verified with guest before handoff. Additional item offered on every pickup.

### 5. Handle All Payments Accurately

Process all takeout payments through Toast POS — cash, card, or app — with 100% accuracy. Issue receipts. Submit all cash drops at shift end per procedure. Flag any discrepancies to the AM immediately.

> Standard: Zero uncorrected payment errors per shift. All discrepancies reported to AM before close. Cash drops submitted on schedule.

### 6. Maintain Takeout Station

Keep the counter clean, packaging supplies stocked, and the POS organized throughout your shift. A cluttered takeout station slows every order. Restock bags, containers, chopstick packs, and sauce packets during lulls so you are never scrambling during a rush.

> Standard: Station stocked before service opens. Packaging supplies restocked during lulls. Counter clean and organized throughout service.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Toast POS operational for takeout orders. Packaging process mastered. Ticket verification protocol followed consistently.

**End of Week 2:** Independent station management. Order accuracy 100%. Guest greetings consistent and warm.

**End of Month 1:** Timing coordination with kitchen and sushi team smooth. Add-on upsells active on every pickup. Zero order accuracy issues.

**End of Month 3:** Trusted to manage takeout station independently during full-volume service. Eligible for cross-training as Server.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Takeout revenue is a measurable, growing part of Ichiban's business. Every order that leaves this station either strengthens or weakens the guest's relationship with this restaurant — often without any opportunity for recovery.

- A wrong takeout order results in a disappointed guest at home with no way to fix it — and often a review that reflects that

- On-time, accurate orders build takeout loyalty — guests who trust the order will be right come back consistently

- Add-on upsells at pickup are high-margin opportunities: a bottled sake or extra sauce is a low-effort, genuine revenue driver

- A well-run takeout station reduces the AM's involvement in every order — which frees leadership to focus on the dining room

**Every bag that leaves this station is Ichiban's reputation walking out the door. Make it count.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban uniform standards. Clean, professional appearance throughout every shift.*

- Attitude: *Detail-oriented, organized, and genuinely hospitable — even through a takeout window.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 20 lbs (takeout bags, supply cases), move efficiently in a fast-paced counter environment.*

- Availability: *Evenings, weekends, and holidays required. Full-time preferred (30-40 hrs/week).*

- Experience: *None required — we train from the ground up. A commitment to accuracy and genuine care for the guest experience are what matter.*$JD$
  from positions p where p.slug = 'togo'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Dish_Cleaning_Job_Description_Ichiban.md → positions.slug = 'dish'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Kitchen Manager
Pay Type: Hourly | Starting $10.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Ichiban serves hundreds of guests every night across two kitchens and a sushi bar. Every one of those guests eats from a dish that came through your station. The Dish and Cleaning Crew is not a support role — it is the sanitation foundation that allows every other position in this building to do their job. Without clean dishes returning fast, the line stops. Without clean surfaces, we risk our health permit. Own this role with the weight it deserves.

## THE STANDARD

**Zero dishes backed up for more than 15 minutes during service. All stations and surfaces clean before the next shift arrives.**

- Dishwasher operating at 180F and 100 ppm chlorine sanitizer at all times.

- All BOH and FOH cleaning tasks completed per shift checklist.

- Cleaning supplies stocked, labeled, and accessible throughout service.

- No standing water, grease buildup, or slip hazards on kitchen floors during service.

## CORE RESPONSIBILITIES

### 1. Wash and Return Dishware Quickly

Run sushi trays, hibachi plates, bowls, woks, and utensils through the dishwasher at proper sanitizing temperatures. Scrub larger items — grill grates, woks — by hand as needed. The line depends on clean dishes coming back fast. Speed and quality are both required.

> Standard: Dishwasher cycle at 180F minimum. No clean dish backlog during service. Larger equipment hand-washed and returned within 20 minutes.

### 2. Clean All Kitchen Surfaces

Wipe down prep stations, fryers, and grills between shifts using approved sanitizers. Sweep and mop kitchen floors on schedule — every hour in high-traffic areas. A clean kitchen is not just a health code requirement — it is the baseline for a professional operation.

> Standard: Kitchen floors mopped every hour in high-traffic areas. All prep surfaces wiped down between shift transitions.

### 3. Support Dining Area Cleanliness

When Bussers need backup during a surge, step in. Sweep under tables, empty dining room trash cans, and replace liners. Your job extends wherever cleanliness is needed — not just to the dish pit.

> Standard: Dining room trash cans emptied before overflow. Available for floor support during peak volume when directed by KM.

### 4. Manage Waste and Recycling

Sort kitchen waste and recyclables into correct bins. Take trash to dumpsters at assigned intervals. After a 200-cover night, waste management matters more, not less.

> Standard: Trash runs completed per shift schedule. Waste sorted correctly. Dumpster area maintained — no overflow left unaddressed.

### 5. Restock and Organize Cleaning Supplies

Check and refill sanitizer bottles, dish soap, and paper towels throughout your shift. Report low stock to the KM before it becomes a problem during service. Organize cleaning tools so they are accessible to anyone who needs them.

> Standard: Sanitizer and dish soap levels checked at the start of each shift. Low stock reported to KM before service begins.

### 6. Follow Safety and Sanitation Protocols

Wear gloves. Maintain personal hygiene. Follow all chemical handling procedures correctly. Log dishwasher temperatures and report any issues — low water temp, malfunctioning equipment — to the KM immediately. Food safety is not optional.

> Standard: All chemical handling follows posted protocols. Equipment issues reported to KM same shift they are discovered. Zero sanitation violations.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Dish station fully operational. Chemical safety practices confirmed. Setup and breakdown owned independently.

**End of Month 1:** Consistent pace maintaining clean supply throughout service. Zero sanitation flags from KM or health check.

**End of Month 3:** Cross-training on basic prep tasks active. Eligible for Prep Cook development track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Dish and cleaning performance directly affects three things that matter to the business: kitchen speed, food safety compliance, and brand standards. All three have real financial consequences.

- Clean dishes returned fast keeps the line moving — slow return creates ticket time delays and frustrated guests

- Proper sanitation and temperature protocols protect the restaurant's health permit — a violation can halt service entirely

- A clean kitchen and dining environment signal professionalism to guests — and that perception drives return visits and reviews

- Proper waste management keeps the kitchen organized and efficient — which protects staff working conditions and operational flow

**You keep this kitchen running. Without your work, nothing else in this building works the way it should.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban BOH kitchen attire. Clean, food-service appropriate appearance throughout every shift.*

- Attitude: *Dependable, hardworking, and team-oriented. The person in this role sets the floor for everyone else.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 40 lbs (dish racks, trash), bend, reach, and work in a hot, wet environment.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *None required — we train from day one. The right work ethic is the only prerequisite.*$JD$
  from positions p where p.slug = 'dish'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Fry_Chef_Job_Description_Ichiban.md → positions.slug = 'fry_cook'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Kitchen Manager
Pay Type: Hourly | Starting $12.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Tempura, fried appetizers, and fried sushi components are some of the most-ordered items at Ichiban. A perfectly fried shrimp tempura or crispy calamari is what completes a sushi experience — and a soggy, overcooked one is what ruins it. Your consistency on this station directly affects check averages, guest satisfaction, and how often guests add a side the next time they come in.

## THE STANDARD

**Every fried item leaves your station golden, crispy, correctly portioned, and within ticket time.**

- Oil maintained at 350-375F throughout service — monitored, not assumed.

- Ticket time target: 5 minutes or less for fried sides and appetizers.

- Zero soggy, burnt, or under-portioned items leaving the station.

- Fryer cleaned between protein batches — no cross-contamination.

## CORE RESPONSIBILITIES

### 1. Prepare Every Fried Item to Spec

Batter and fry tempura (shrimp, zucchini, vegetables) at 350F using Ichiban's recipe standards. Cook dumplings, calamari, and other fried appetizers to proper doneness — consistent color, crispy texture, correct portion size. Recipe is spec; spec is the standard.

> Standard: Oil temp verified at shift start and monitored every 30 minutes. All items meet color, texture, and portion spec before expo handoff.

### 2. Execute Expo Tickets Accurately

Plate fried items per ticket — correct items, correct sauces, correct special requests (extra tentsuyu, no dipping sauce). Coordinate timing with the kitchen line so fried sides and hibachi entrees reach expo together.

> Standard: All modifications confirmed at plating. Fried items timed to exit with corresponding kitchen orders.

### 3. Support Sushi Bar with Fried Components

When the sushi team needs fried ingredients for rolls — soft-shell crab, fried shrimp, tempura flakes — prioritize those tickets and deliver to the sushi bar promptly. The sushi bar cannot build certain rolls without you. Do not let that station wait.

> Standard: Sushi bar component requests completed and delivered within 5 minutes of ticket.

### 4. Maintain Station Efficiency

Pre-stage your station before service. Organize tools, mise en place, and ingredient levels so you can move at full speed once tickets hit. Clean between batches. A well-staged, clean fry station is a fast fry station.

> Standard: Station fully staged before service opens. Fryer baskets and tools cleaned between protein batches.

### 5. Track and Minimize Waste

Log waste items and oil overuse every shift. Adjust batch sizes to projected cover count — do not fry 20 pieces when the floor has 12 covers left. Every wasted batch is visible, direct food cost.

> Standard: Waste log completed every shift. Batch sizes aligned with projected covers within 10% of need.

### 6. Follow Safety and Sanitation

Handle oil safely. Use proper burn prevention equipment. Clean fryers per established protocol. Report any equipment issues — uneven heat, malfunctioning thermostat — to the KM immediately. A fryer problem does not just affect you; it affects the entire kitchen's output.

> Standard: Fryer cleaning protocol completed every shift. Equipment issues reported to KM same shift. Zero safety violations.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All fried items executed to Ichiban spec. Station setup and breakdown owned independently. Ticket times met.

**End of Month 1:** Consistent quality under rush conditions. Zero expo errors from fry station. Sushi bar coordination smooth.

**End of Month 3:** Cross-training on kitchen line or prep active. Eligible for line advancement.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The fry station is directly connected to guest check averages and food cost. Consistency and speed from this station has a measurable impact on revenue and profitability every shift.

- Fried appetizers and sides are high-margin items — every upsell at the server level starts with quality execution here

- Consistent quality drives repeat ordering — guests who loved the tempura shrimp will order it again

- Oil waste management is a direct food cost lever — overuse and burnt batches accumulate into real weekly losses

- Ticket time efficiency on fried items prevents expo bottlenecks that slow the entire kitchen

**You do not just run a fryer. You produce some of the highest-margin items in this kitchen — every shift.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban BOH uniform. Chef jacket, non-slip shoes. Clean and food-service appropriate at all times.*

- Attitude: *Fast, precise, and consistent. The fry station moves at the speed of service — match it.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (oil jugs), work in high heat near open fryers.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *None required — training provided. Ability to stay focused and consistent under pressure is what we need.*$JD$
  from positions p where p.slug = 'fry_cook'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Prep_Cook_Job_Description_Ichiban.md → positions.slug = 'prep_cook'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Kitchen Manager
Pay Type: Hourly | Starting $12.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Ichiban runs two kitchens and a sushi bar simultaneously. The prep that feeds all of them comes from this role. Uniform vegetable cuts, properly marinated proteins, house-made sauces — none of it is ready when service starts unless you have done your job with precision. If prep is incomplete or off-spec, the entire kitchen feels it. Your consistency and speed in this role are what makes every other station able to perform at a high level.

## THE STANDARD

**All prep completed before service opens. Zero station shortages during service caused by prep gaps.**

- All ingredients cut, portioned, and marinated to recipe specification before service.

- Prep checklist fully completed every shift — no items left for the line to cover.

- All prepped items properly labeled and stored at correct temperatures.

- No cross-contamination between proteins, seafood, and vegetables.

## CORE RESPONSIBILITIES

### 1. Chop and Prepare Vegetables to Spec

Slice and dice vegetables to Ichiban's recipe standards — 1/4-inch hibachi cuts, uniform cucumber strips for sushi, precise garnishes. Consistency is the goal. Uneven cuts cook unevenly and present poorly. The knife work done here is the foundation of every dish on the floor.

> Standard: All vegetables cut to recipe specification. Uniformity verified before transfer to line or sushi bar stations.

### 2. Marinate and Portion Proteins

Marinate chicken, steak, shrimp, and other proteins to Ichiban's recipe standards — correct marinade ratios, correct timing. Portion into exact weights for hibachi service. A 6 oz steak portion is not approximate — it is the standard, and it affects both food cost and guest satisfaction.

> Standard: All proteins marinated to spec and portioned to correct weights before service. Weights logged for KM review.

### 3. Prepare Sauces and Condiments

Mix yum yum sauce, teriyaki, and other house sauces in correct batch quantities following recipe ratios. Label and store properly. Portion condiments for sushi bar and takeout station daily needs. Running out of yum yum sauce during a dinner rush is a preventable failure.

> Standard: All sauces and condiments prepped and portioned before service opens. Batch quantities adjusted to projected covers.

### 4. Supply and Support All Kitchen Stations

Deliver prepped ingredients to the kitchen line, sushi bar, and fry station as needed. Restock mid-shift without waiting to be asked. Anticipate what stations will need as service progresses. Great prep support is invisible — stations never run short.

> Standard: Station restock completed proactively throughout service. No line or sushi bar station runs out of prepped ingredients during service.

### 5. Maintain Prep Station and Prevent Cross-Contamination

Clean cutting boards and knives after each task — especially when switching between proteins and produce. Label and organize storage bins. A contamination event in prep cascades into every station that uses those ingredients.

> Standard: Cutting boards and knives sanitized between tasks. All storage labeled with contents and prep date. Zero cross-contamination incidents.

### 6. Follow Food Safety and Sanitation

Verify ingredient storage temperatures every shift. Use gloves for all protein handling. Report any temperature issues or equipment problems to the KM immediately. Proper food safety in prep protects every guest who eats from this kitchen.

> Standard: All ingredient temps verified and logged every shift. Equipment issues reported to KM same shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Recipe cards memorized. Knife skills at baseline standard. Prep checklist owned independently.

**End of Month 1:** All prep completed before service opens every shift. Zero line shortages caused by prep gaps.

**End of Month 3:** Cross-training on kitchen line or fry station active. Eligible for line position development track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Prep performance directly affects food cost, ticket times, and service quality across every station in the kitchen. The connection between this role and profitability is concrete and measurable every single shift.

- Accurate protein portioning is the most direct lever on food cost — a half-ounce variance per dish multiplies across hundreds of covers

- Complete prep before service prevents kitchen slowdowns — which protects ticket times and table turn rates

- Sauce and condiment prep accuracy protects consistency — guests who loved the yum yum sauce last time expect the same experience

- Proper storage and labeling reduces spoilage — a significant and controllable component of weekly food cost

**You build the foundation every dish is made from. Without great prep, there is no great kitchen.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban BOH uniform. Chef jacket, non-slip shoes. Clean and food-service appropriate.*

- Attitude: *Detail-oriented, consistent, and coachable. In prep, precision is the job.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 40 lbs (vegetable crates), handle knives and kitchen equipment safely.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *None required — we train from the ground up. Attention to detail and a commitment to consistency are what we look for.*$JD$
  from positions p where p.slug = 'prep_cook'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Line_Chef_Job_Description_Ichiban.md → positions.slug = 'line_cook'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Kitchen Manager
Pay Type: Hourly | Starting $13.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Kitchen Line at Ichiban is responsible for hibachi entrees, stir-fries, and shared kitchen dishes — the heart of what most guests come for. This station operates at speed, under heat, with no margin for inconsistency. Guests who order hibachi at Ichiban expect bold flavors, proper proteins, and a meal that delivers on the experience they have been anticipating. Your consistency and speed on this line are what make that happen every night.

## THE STANDARD

**Every hibachi entree and kitchen dish is cooked to spec, plated accurately, and handed to expo within ticket time.**

- All proteins cooked to proper internal temperature and doneness per recipe.

- Ticket time target: 8 minutes or less for hibachi combos.

- Zero missed special requests — every modification confirmed before plating.

- Station stocked and grill clean before every service period.

## CORE RESPONSIBILITIES

### 1. Execute Hibachi and Kitchen Dishes to Spec

Grill hibachi proteins (shrimp, chicken, steak, salmon) to Ichiban's seasoning and timing standards. Stir-fry vegetables with proper texture — crisp, not mushy. Build fried rice correctly. Every dish that leaves this station should look and taste exactly like what the guest ordered.

> Standard: All proteins cooked to correct doneness per recipe (e.g., steak at 135F for medium-rare). Stir-fry texture and seasoning consistent across every order.

### 2. Plate Accurately to Expo Tickets

Build every plate against the expo ticket — correct protein, correct sauce, correct modifications (no mushrooms, extra yum yum). Coordinate timing with the fry station so sides and mains reach expo simultaneously. Partial plates that arrive at different times create a poor guest experience.

> Standard: 100% ticket accuracy before expo handoff. Modifications confirmed at plating. Fry station timing coordinated for simultaneous expo.

### 3. Support the Sushi Bar When Needed

The kitchen and sushi bar share ingredients and a common goal — get great food to the guest on time. When the sushi team needs cooked shrimp, rice, or other shared components, fill those requests quickly and accurately.

> Standard: Sushi bar ingredient requests filled within 10 minutes of request. Quality consistent with kitchen line standards.

### 4. Maintain Station Cleanliness and Organization

Clean grills, woks, and counters between orders. Scrape grease, wipe surfaces, and keep the station organized throughout service. A clean, organized station is a fast, safe station. An untidy line becomes an error-prone line.

> Standard: Grills and woks scraped between major orders. Station surfaces wiped during lulls. No unsafe grease buildup during service.

### 5. Monitor Food Quality

Check every dish before it goes to expo. Taste sauces. Verify protein doneness. Flag issues before they become guest problems. If the teriyaki is off or the rice is undercooked, fix it before expo sees it — not after.

> Standard: Self-inspection before every expo handoff. Quality issues corrected before food leaves the station.

### 6. Follow Safety and Sanitation

Store all proteins at correct temperatures. Wear gloves when handling ready-to-eat ingredients. Sanitize tools between tasks. Report any equipment issues — malfunctioning burners, failing refrigeration — to the KM immediately.

> Standard: All proteins stored at 35-40F. Tools sanitized between raw and ready-to-eat ingredients. Equipment issues reported same shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All hibachi proteins and stir-fry techniques operational. Station setup and breakdown owned independently.

**End of Month 1:** Consistent 8-minute tickets. Zero quality rejections from KM. All modifications executed correctly.

**End of Month 3:** Cross-training on prep or fry station active. Eligible for KM development track consideration.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Kitchen Line is where Ichiban's highest-ticket items are produced. Your consistency and efficiency directly drive revenue, table turn rates, and guest satisfaction on the most important dishes we serve.

- Hibachi combos are among the highest check-average items at Ichiban — consistent quality drives repeat orders

- 8-minute ticket times maintain table turn rates — slow tickets mean slower turns and lower nightly covers

- Accurate modifications prevent remakes — every remake costs food cost, labor time, and guest patience

- Proper protein portioning directly controls food cost on the highest-COGS items in the kitchen

**You cook the food guests are most excited to order. Every plate is a direct representation of Ichiban's quality.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban BOH uniform. Chef jacket, non-slip shoes. Clean and food-service appropriate throughout service.*

- Attitude: *Composed under pressure, quality-focused, and collaborative. The line requires speed and precision simultaneously.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 40 lbs (meat crates), work in high heat on a busy grill line.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *6+ months cooking experience preferred. Hibachi or grill line experience a plus. Training provided for strong candidates.*$JD$
  from positions p where p.slug = 'line_cook'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Sushi_Helper_Job_Description_Ichiban.md → positions.slug = 'sushi_helper'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Sushi Lead / Sushi Manager
Pay Type: Hourly | Starting $12.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Sushi Helper is the foundation of the sushi bar. Without properly cooked rice, fresh-cut vegetables, stocked nori, and a clean prep station, the Sushi Chef cannot perform at the level Ichiban requires. This is not a peripheral role — it is the starting point of a skilled craft career. We take this path seriously, and so should you. The Sushi Helpers who commit to learning here become the Sushi Chefs who define this bar.

## THE STANDARD

**Rice prepped to spec and ready before service. Sushi bar fully stocked and clean before every shift open.**

- Sushi rice cooked to Ichiban recipe specification — every batch, every time.

- All vegetables cut to spec: uniform strips, correct dimensions.

- Sushi bar stocked with nori, wasabi, ginger, and condiments before service.

- Prep area and bar surface clean between every task.

## CORE RESPONSIBILITIES

### 1. Prepare Sushi Rice to Spec

Wash, cook, and season sushi rice following Ichiban's recipe — correct water ratios, proper vinegar seasoning, correct texture. Rice is the foundation of every roll. Off-spec rice makes every roll harder to build correctly. Get this right, every batch.

> Standard: Rice cooked and seasoned to spec before service opens. Texture and seasoning confirmed by Sushi Chef before use.

### 2. Cut and Prep Vegetables to Spec

Slice cucumbers, carrots, avocado, and other roll ingredients to the correct dimensions — 1/8-inch strips, uniform cuts. Irregular cuts make rolls inconsistent. Uniform prep makes the Sushi Chef faster and the rolls better.

> Standard: All vegetables cut to recipe specification. Uniformity confirmed before transfer to sushi bar station.

### 3. Stock and Maintain the Sushi Bar Setup

Stock the bar with nori, bamboo mats, wasabi, pickled ginger, and soy sauce before every service. Refill condiment containers during service lulls. The Sushi Chef should never have to stop mid-roll to find an ingredient that should already be there.

> Standard: Sushi bar fully stocked before service opens. Condiment refills completed during lulls without prompting.

### 4. Clean Prep and Service Areas

Wipe cutting boards and counters after each task. Sweep the sushi bar floor during lulls. Clean rice cookers at close. The sushi bar works with raw protein and highly perishable ingredients — sanitation here is not routine, it is critical.

> Standard: Cutting boards and counters wiped after every task. Sushi bar floor swept every hour. Rice cooker cleaned at close.

### 5. Assist with Basic Plating and Packaging

Plate simple sides — edamame, seaweed salad, miso soup — per chef instructions. Package takeout condiments correctly. Follow presentation guidance precisely. Every item that leaves this bar, even a side, should look like it belongs at Ichiban.

> Standard: Plating follows chef instruction on every item. Takeout packaging accurate and complete before handoff.

### 6. Learn and Develop Sushi Skills

Observe Sushi Chefs actively during service. Practice rice spreading and basic prep during off-peak hours. Study the menu — know what goes in a California Roll, a Fire in the Hole Roll, a Crunchy Roll. This role is a development track, not a holding position. Engage with it accordingly.

> Standard: Basic rice spreading demonstrated by end of Month 1. Menu knowledge test passed by end of Month 2. Development check-in with Sushi Lead monthly.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Rice recipe mastered. Basic vegetable cuts meeting spec. Sushi bar setup completed independently before service.

**End of Month 1:** Consistent rice and prep quality. Basic rolling practice underway. Zero sushi bar shortages caused by prep gaps.

**End of Month 3:** Menu fully understood. Beginning supervised roll practice. On track for Sushi Chef development path.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The quality of every sushi roll at Ichiban starts at the prep stage. Properly cooked rice, correctly cut vegetables, and a well-stocked bar are the foundation that allows the Sushi Chef to work at the level this restaurant demands.

- Off-spec rice slows roll production and creates inconsistency — which affects ticket times and guest satisfaction

- Properly stocked sushi bars prevent mid-service stops that create bottlenecks and delay orders

- Clean prep areas protect against cross-contamination — which protects guests and the restaurant's health standing

- Engaged Helpers who develop into Chefs are the most cost-effective talent pipeline the sushi bar has

**You are the starting point of every roll this bar builds. The quality of what comes after depends on what you do here.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban sushi bar uniform. Chef jacket, clean and food-service appropriate. Guests can see you at the bar.*

- Attitude: *Eager to learn, attentive, and coachable. This role is a craft investment — treat it like one.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 20 lbs (rice bags), maintain steady focus on repetitive precision tasks.*

- Availability: *Evenings, weekends, and holidays required. Full-time preferred (35-40 hrs/week).*

- Experience: *None required — full training provided. A genuine interest in learning sushi craft is the most important qualification.*$JD$
  from positions p where p.slug = 'sushi_helper'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

  -- Sushi_Chef_Job_Description_Ichiban.md → positions.slug = 'sushi_chef'
  insert into position_descriptions (position_id, restaurant_id, description)
  select p.id, ichiban_id, $JD$[POS_INFO]
Reports To: Sushi Lead / Sushi Manager
Pay Type: Hourly | Starting $14.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Sushi at Ichiban is a craft. Our guests know the difference between an average roll and an exceptional one — and so do you. The Sushi Chef is the final craftsperson between the ingredients and the guest's plate. Tight rolls, clean cuts, fresh fish, precise presentation — these are not aspirational standards. They are the minimum. This bar has been serving sushi since 2003, and the standard of this station is what has kept guests returning for over two decades.

## THE STANDARD

**Every roll is tight. Every cut is clean. Every ticket is filled to spec within 10 minutes.**

- All sushi rolls built to Ichiban spec — correct rice ratio, tight construction, uniform shape.

- All fish inspected for freshness before slicing — every shift, no exceptions.

- Ticket time target: 10 minutes or less per sushi order.

- Sushi bar surface clean and organized throughout service.

## CORE RESPONSIBILITIES

### 1. Build Every Roll to Spec

Roll every sushi item — California Roll, Fire in the Hole Roll, Moscona Roll, all specialty rolls — with correct rice ratios, tight construction, and uniform shape. Slice nigiri at the correct thickness. Plate with visual intention. Every roll that leaves this bar is a representation of Ichiban's craft.

> Standard: All rolls inspected before expo handoff. Rice ratio, construction, and presentation match Ichiban recipe card on every order.

### 2. Fill Expo Tickets Accurately

Complete every expo ticket accurately and within time: correct rolls, correct modifications (no wasabi, extra ginger), correct garnishes. Coordinate with food runners on large orders and party platters. A 10-roll platter that is wrong or late is not an option.

> Standard: 100% ticket accuracy before expo handoff. Ticket time target: 10 minutes. Large order timing communicated to expo proactively.

### 3. Inspect Fish for Freshness Every Shift

Before slicing anything, inspect every fish for quality: bright color, firm texture, no off-odor. Reject anything that does not meet spec. Substandard fish served to a guest is not a cost-saving — it is a health risk and a reputation loss. Flag concerns to the Sushi Lead immediately.

> Standard: All fish inspected before slicing every shift. Substandard product rejected and reported to Sushi Lead before use.

### 4. Maintain Sushi Bar Cleanliness

Clean knives, boards, and counters between orders. Restock fish, nori, rice, and condiments during off-peak periods. A cluttered sushi bar is a slow sushi bar — and guests at the bar are watching you work. Your station reflects your standard.

> Standard: Knives and boards cleaned between orders. Sushi bar restocked during lulls. Station passes visual inspection at any point during service.

### 5. Train and Guide Sushi Helpers

Actively develop Sushi Helpers on rice prep, vegetable cutting, and basic plating. Set clear expectations. Provide specific, real-time feedback during service. Your ability to develop the next tier of sushi bar talent is part of your job — not optional.

> Standard: At least 2 specific coaching moments per shift with Sushi Helper. Helper competency tracked and reported to Sushi Lead monthly.

### 6. Follow Food Safety Compliance

Monitor fish storage temperatures (32-35F). Log temps and report any deviations immediately. Use gloves when handling ready-to-eat items. Sanitize all tools between uses. The sushi bar works with raw protein — food safety protocol here is non-negotiable.

> Standard: Fish storage temps logged every shift. All deviations reported to Sushi Lead within the shift. Zero food safety violations.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Month 1:** All Ichiban rolls built to spec independently. Ticket times consistent. Fish inspection and safety protocols fully owned.

**End of Month 3:** Sushi Helper training active and measurable. Zero ticket accuracy issues. Sushi Lead trust established.

**End of Month 6:** Eligible for Sushi Lead development track. Cross-training on specialty rolls or omakase preparation.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The sushi bar is one of the highest-profile areas of Ichiban — guests watch you work, guests order based on what they see, and the quality of every roll you build directly affects whether they come back.

- Consistent roll quality is the primary driver of sushi bar repeat orders and guest loyalty

- Accurate fish portioning controls sushi bar food cost — the highest COGS area in the restaurant

- Sushi bar presentation is often the first photo guests share on social media — quality drives organic marketing

- Effective Helper training builds the next tier of sushi bar talent — reducing training costs and improving bar capacity

**You are the craftsperson this restaurant has been built around. Every roll reflects what Ichiban stands for.**

## WHAT WE EXPECT

- Grooming & Uniform: *Ichiban BOH/sushi bar uniform. Chef jacket, clean and professional at all times — guests see you work.*

- Attitude: *Craft-focused, precise, and development-minded. You protect the quality and develop the people around you.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (fish crates), work with precision knife skills throughout service.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *Minimum 6 months as Sushi Helper or equivalent sushi prep experience. Proficiency in rolling and slicing required.*$JD$
  from positions p where p.slug = 'sushi_chef'
  on conflict (position_id, restaurant_id) do update set description = excluded.description, updated_at = now();

end $$;
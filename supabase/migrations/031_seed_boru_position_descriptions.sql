-- ============================================================
-- WHG TEAM PORTAL — SEED BORU POSITION DESCRIPTIONS
-- Populates positions.description for all 11 Boru roles using
-- the structured job descriptions from Randy's onboarding docs.
--
-- Format uses light markdown that PositionDescriptionRenderer parses:
--   [POS_INFO]/[/POS_INFO] — info block
--   ## SECTION HEADER
--   ### Subsection
--   > Standard callout
--   - bullet
--   **bold**, *italic*
--
-- Idempotent — re-running just refreshes the description text.
-- ============================================================

-- Server_Job_Description_Boru.md → positions.slug = 'server'
update positions
set description = $JD$[POS_INFO]
Reports To: Server Lead / Assistant Manager
Pay Type: Tipped Hourly | $2.15/hr + tips
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Servers are the heartbeat of the Boru experience. You are the face every guest interacts with most — from the moment they sit down to the last sip of sake. Your ability to connect, guide, and upsell directly impacts check averages, guest loyalty, and the restaurant's profitability. At Boru, hospitality is not a soft skill. It is a business strategy.

## THE STANDARD

**Every table you touch should leave feeling welcomed, well-served, and ready to return. No exceptions.**

- Guests greeted within 2 minutes — every time.

- Ramen delivered within 10 minutes of ordering — every time.

- Every check includes a genuine upsell attempt — every table.

- Hot food hot. Cold food cold. Always.

## CORE RESPONSIBILITIES

### 1. Greet and Connect

Welcome guests within 2 minutes of being seated — with warmth, not a script. Open with 'Welcome to Boru! Is this your first time with us?' to set the tone. Your goal is to earn their trust before they open the menu.

> Standard: 100% of tables greeted within 2 minutes. Missed greetings are reported to the AM on duty immediately.

### 2. Guide the Order

Know the menu inside and out by end of Week 2. Recommend with confidence. Pair drinks with ramen — sake with Rouge Red Tonkotsu, frozen yuzu slush with anything spicy. Suggest add-ons: extra chashu, a seasonal side, an upgrade. You are not here to take orders. You are here to elevate them.

> Standard: Every table receives at least one genuine upsell suggestion. Target: $100+ in upsell revenue per shift.

### 3. Serve with Precision

Deliver food hot, sides crisp, drinks timely. Check back within 2 minutes of the first bite. Use every table touch to confirm satisfaction and catch problems before they become complaints. 'Enjoying your Tonkotsu?' is not a formality — it is your most important quality control tool.

> Standard: 10-minute food delivery from ticket. Post-entree check within 2 minutes of delivery.

### 4. Build Loyalty

Recognize returning guests. Remember their preferences — no scallions, favorite ramen, their usual seat. Use a guest's name when you know it. You do not need a system to build loyalty — you need to pay attention. Small gestures create regulars, and regulars are the foundation of this business.

> Standard: Acknowledge known regulars by name. Demonstrate awareness of returning guests and their preferences through genuine attentiveness.

### 5. Maintain Your Section

Clear plates within 5 minutes of the table finishing. Tables reset immediately. Napkins, chopsticks, and menus restocked without being asked. A clean, prepared section is a professional section — and it directly affects how quickly we can seat the next guests.

> Standard: Tables cleared within 5 minutes. Spills reported to AM immediately. No unset or cluttered tables during service.

### 6. Handle Payments Accurately

Process all payments through Shift4 POS with 100% accuracy. Split checks confidently and without hesitation. Flag any discrepancy to your AM — never attempt to resolve a cash or POS error on your own. Tip prompts are appropriate and expected.

> Standard: Zero uncorrected payment errors per shift. All discrepancies escalated to AM before close.

### 7. Support the Team

Run food for teammates during rushes. Help the Hostess seat guests when you have bandwidth. No phones, no headphones — ever. Boru runs as a team, not as a collection of individual sections. When one person is behind, everyone pitches in.

> Standard: Minimum 2 visible team assists per shift during peak periods.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Menu fully memorized. POS basics operational. Completing full shifts with AM support. Dress code and grooming standards met without reminders.

**End of Week 2:** Independent table management. Consistent 2-minute greetings and 10-minute delivery. Genuine upsell on every table. No open coaching issues.

**End of Month 1:** Guest preference logging active in POS. Check average meeting or exceeding shift target. Zero missed greetings. No performance write-ups on file.

**End of Month 3:** Recognized as a reliable team anchor. Eligible for Server Lead cross-training. Capable of modeling floor etiquette for new hires.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Servers sit at the intersection of hospitality and profitability. Your performance directly affects whether Boru hits its financial targets every shift.

- Every $5 upsell across 15 tables = $75 in additional revenue per shift

- Accurate orders mean zero remakes — which means lower food cost and less waste

- Loyal guests return more often — the most sustainable form of sales growth

- Efficient table turns directly reduce labor cost per cover

**You are not just serving food. You are driving the business.**

## WHAT WE EXPECT

- Grooming & Uniform: *All-black dress code. Boru logo tee or dress shirt, black apron, black pants, black non-slip shoes. No exceptions.*

- Attitude: *Warm, composed under pressure, coachable. We train skills. We cannot train character.*

- Physical Requirements: *Able to stand 8+ hours, carry trays up to 25 lbs, bend, reach, and move quickly through a busy floor.*

- Availability: *Evenings, weekends, and holidays required. Full-time strongly preferred (30-40 hrs/week).*

- Experience: *None required — we train from the ground up. The right attitude and a genuine willingness to grow are non-negotiable.*$JD$
where slug = 'server';

-- Hostess_Job_Description_Boru.md → positions.slug = 'host'
update positions
set description = $JD$[POS_INFO]
Reports To: Assistant Manager
Pay Type: Hourly + Tips | Starting $10.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The guest's first impression of Boru starts at your host stand. How you greet, seat, and manage flow sets the tone for every table's experience. A great Hostess does not just fill seats — she orchestrates the energy of the entire floor. When this role is done right, guests feel like they are walking into a place that is genuinely glad to have them.

## THE STANDARD

**Every guest is acknowledged within 60 seconds of walking in. No table ever waits without knowing they have been seen.**

- All guests welcomed at the door within 60 seconds — every time.

- Waitlist parties updated every 5 minutes during a wait.

- Server sections are balanced — no server is triple-sat while another is empty.

- Host stand is clean, stocked, and ready before every shift open.

## CORE RESPONSIBILITIES

### 1. Greet and Welcome Every Guest

Welcome every guest within 60 seconds with genuine warmth — not a rehearsed line. Read the party: a couple wants a quiet booth, a family with kids needs easy access. Seat them with intention, not just efficiency. A great greeting sets the tone for the entire visit.

> Standard: 100% of guests acknowledged within 60 seconds of entry. Greeting energy consistent regardless of shift volume.

### 2. Manage Seating and Section Flow

Seat 87 covers (17 tables + 20 bar seats) strategically. Know every server's section and current table count. Distribute parties to keep the floor balanced and service quality consistent. Never seat a section without confirming the server is ready.

> Standard: No server is triple-sat without AM approval. Section rotation followed unless directed otherwise by AM on duty.

### 3. Own the Waitlist

Use Yelp Guest Manager to log parties, estimate accurate wait times, and track table availability in real time. Update waiting guests every 5 minutes — do not make them come back to ask. Text parties the moment their table is ready.

> Standard: All waitlist parties updated every 5 minutes. Text notification sent within 1 minute of table availability.

### 4. Support the Floor During Rushes

When the floor needs help, be part of the solution. Run sides, help clear plates, restock menus, assist servers during high volume. You are not stationed at a podium — you are part of the team.

> Standard: Minimum 2 visible floor assists per rush period. Host stand never left unattended without AM coverage.

### 5. Answer Phones and Handle Inquiries

Answer all calls professionally. Know the menu well enough to answer basic questions. Capture large party inquiries and relay to AM immediately. Reservations logged accurately in Yelp Guest Manager.

> Standard: All calls answered within 3 rings. Large party inquiries escalated to AM within 5 minutes.

### 6. Maintain the Host Stand

Keep the stand organized, menus wiped clean and fully stocked, iPad charged and operational. The host stand is the first physical space guests interact with — it must reflect Boru's brand at all times.

> Standard: Stand inspection-ready before every open. Menus checked and restocked at the start of each shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Greeting script natural and consistent. Yelp GM basics operational. Server sections learned.

**End of Week 2:** Independent waitlist management. Balanced seating without prompting. No missed greetings.

**End of Month 1:** Rush management confident. Section rotation instinctive. Zero waitlist complaints.

**End of Month 3:** Trusted to run the door independently on high-volume nights. Eligible for Server cross-training.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Hostess is the first touchpoint in the guest experience — and first impressions drive return visits. Your efficiency and attentiveness at the door directly affects table turns, server performance, and overall revenue per shift.

- Proper section balancing prevents service breakdowns — which protect guest satisfaction and check averages

- Efficient seating turns increase total covers served per shift — which drives top-line revenue

- Accurate wait time communication reduces walkouts — every walkout is lost revenue and a lost future guest

- A welcoming entry experience is one of the most cited reasons guests return

**You are not managing a door. You are managing the start of every single guest experience.**

## WHAT WE EXPECT

- Grooming & Uniform: *All-black dress code. Boru logo tee, black pants, black non-slip shoes. Neat appearance at all times.*

- Attitude: *Warm, composed under pressure, adaptable. Every guest deserves your best energy — even at the end of a long shift.*

- Physical Requirements: *Able to stand 5+ hours, carry menus and light supplies up to 15 lbs, move quickly through a busy floor.*

- Availability: *Evenings, weekends, and holidays required. Full-time strongly preferred (30-40 hrs/week).*

- Experience: *None required — we train. The right attitude and genuine hospitality instincts are what matter.*$JD$
where slug = 'host';

-- Bartender_Job_Description_Boru.md → positions.slug = 'bartender'
update positions
set description = $JD$[POS_INFO]
Reports To: Manager / Assistant Manager
Pay Type: Tipped Hourly | $2.15/hr + tips
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The bar at Boru is one of our highest-revenue-per-seat areas, and it is one of the most visible corners of our guest experience. A skilled Bartender does not just pour drinks — they extend our hospitality, create regulars, and directly drive check averages. Every interaction at the bar is a revenue opportunity wrapped in genuine connection. This position demands consistency, speed, and a natural ability to make people feel welcome.

## THE STANDARD

**Every drink is built to spec, every time. Every bar guest is acknowledged within 60 seconds of sitting down.**

- All drinks built to Boru spec — no improvised portions.

- Bar guests acknowledged within 60 seconds. Full server treatment, not counter service.

- Bar surface clean, organized, and guest-ready throughout the entire shift.

- Drink orders for the floor completed within 5 minutes of ticket.

## CORE RESPONSIBILITIES

### 1. Craft Every Drink to Spec

Build every Boru signature drink consistently: nigori sake pours, Lychee Mojito, frozen yuzu slush, soju cocktails, wine, and beer — all to recipe standard, every time. Guests who sat at the bar last week expect the same drink this week. Consistency is your most important skill.

> Standard: Zero off-spec drinks leaving the bar. Portions measured, not estimated. Presentation consistent with Boru standards.

### 2. Own the Bar Experience

Bar guests receive the full Boru service experience: warm greeting, menu guidance, genuine upsell, and a post-drink check-in. Recommend sake and cocktail pairings with ramen. The bar is not a self-service station — it is Boru's most intimate dining space.

> Standard: Every bar guest receives an upsell recommendation. Check averages at the bar meet or exceed floor average.

### 3. Support Floor Drink Orders

During service, table servers will call in drink orders. Build and stage these efficiently without disrupting bar guest experience. Communicate any delays proactively — never let a drink ticket go cold without flagging it.

> Standard: Floor drink orders completed within 5 minutes of ticket. Zero tickets left unacknowledged for more than 2 minutes.

### 4. Maintain Bar Inventory

Count bar stock at the start of every shift. Restock proactively — never run out of a poured item mid-service. Flag shortages to the AM before service begins, not during. Ordering blind creates crises; counting daily prevents them.

> Standard: Pre-shift inventory completed every shift. Shortages flagged to AM before doors open.

### 5. Keep the Bar Impeccable

Clean as you go — every time. Sanitized surfaces, polished glassware, organized mise en place. Guests sit at the bar and watch you work. What they see IS the bar experience. A cluttered, sticky bar communicates a lack of care — and that reflects on every bowl we serve.

> Standard: Bar surface wiped after every order. Glassware polished and staged. Bar passes visual inspection at any point during service.

### 6. Handle Payments Accurately

Manage all bar tabs through Shift4 POS with 100% accuracy. Split checks cleanly. Never let a discrepancy go unresolved at close — flag all cash or POS errors to the AM before end of shift.

> Standard: Zero uncorrected payment errors per shift. All discrepancies reported to AM before close.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All Boru drinks memorized and built to spec. POS operational. Bar setup and breakdown owned independently.

**End of Week 2:** Independent bar management. Drink upsells on every guest interaction. No speed or quality issues flagged.

**End of Month 1:** Consistent bar inventory management. Guest regulars forming. Bar check averages meeting target.

**End of Month 3:** Trusted to train new bartenders on Boru drink program. Eligible for cross-training on AM duties.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The bar is one of the most profitable areas of the restaurant on a per-seat basis. Your performance behind the bar directly drives check averages, guest loyalty, and beverage revenue — all high-margin lines on the P&L.

- Bar seats generate higher check averages than dining room seats — your upsells have an outsized impact

- Cocktails and sake carry strong margins — every drink sold is a direct profit driver for the business

- Accurate portioning protects beverage cost — over-pouring is invisible waste that adds up fast

- Bar regulars are the most loyal guests in the building — and loyal guests are the most valuable guests

**You are not pouring drinks. You are building the most profitable corner of this restaurant.**

## WHAT WE EXPECT

- Grooming & Uniform: *All-black dress code. Boru logo tee or dress shirt, black apron, black pants, black non-slip shoes. No exceptions.*

- Attitude: *Warm, composed under pressure, naturally hospitable. The bar is a stage — your energy sets the vibe.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (cases of product), bend, reach, and move efficiently behind the bar.*

- Availability: *Evenings, weekends, and holidays required. Full-time strongly preferred (30-40 hrs/week).*

- Experience: *Bar or service experience preferred — but the right attitude and willingness to learn Boru's drink program are equally valued.*$JD$
where slug = 'bartender';

-- Dish_Clean_Job_Description_Boru.md → positions.slug = 'dish'
update positions
set description = $JD$[POS_INFO]
Reports To: Assistant Kitchen Manager / Kitchen Lead
Pay Type: Hourly | Starting $10.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Every great bowl of ramen starts in a clean kitchen. You are the foundation that makes service possible. Without you, the line slows. Without you, the restaurant does not meet the standards guests and health inspectors expect. This role is not entry-level in importance — it is the backbone of BOH operations. Own it with that understanding.

## THE STANDARD

**Zero dishes backed up at the pit for more than 15 minutes during service. All stations clean before the next shift walks in.**

- Dishwasher running at proper sanitizing temperature throughout service.

- All BOH and FOH cleaning tasks completed per shift checklist.

- Sanitation supplies stocked and labeled at all times.

- No slip hazards — floors dry and safe throughout service.

## CORE RESPONSIBILITIES

### 1. Wash and Return Dishware Quickly

Run 200+ items per shift through the dishwasher at proper sanitizing temperatures. Hand-wash delicate items like sake glasses with care. The line depends on clean bowls coming back fast — speed and quality are both required here.

> Standard: Dishwasher cycle maintained at 160F minimum. No clean dish backlog during service. Delicate items hand-washed and returned without damage.

### 2. Clean All BOH and FOH Areas

Sweep and mop the kitchen, dining room, and bathrooms per shift checklist. Empty trash bins and reline them without being asked. A clean restaurant is a reflection of our brand — guests notice, and health inspectors definitely notice.

> Standard: All cleaning tasks completed per checklist before shift end. Bathrooms checked and cleaned every 2 hours during service.

### 3. Maintain Sanitation Supplies

Monitor and restock soap, sanitizer, and cleaning chemicals throughout the shift. Label all chemicals properly per health code requirements. Report low stock to the Kitchen Lead before it becomes a gap — not after.

> Standard: Sanitation supplies stocked and labeled every shift. Low stock reported to Kitchen Lead before end of shift.

### 4. Support the BOH Team

During busy periods, be where you are needed. Assist the Prep Chef with basic tasks, haul trash, restock napkins for the expo area when flagged. Part of doing this job well is reading the kitchen and helping without being asked.

> Standard: At least 2 BOH team assists per rush period. All trash runs completed before bins overflow.

### 5. Follow Safety and Sanitation Protocols

Use proper chemical handling procedures, gloves, and food-safe sanitation practices at all times. Check floors for slip hazards throughout your shift. Report equipment issues — clogged drains, broken dishwasher — to the Kitchen Lead immediately.

> Standard: Zero safety violations per shift. Equipment issues reported to Kitchen Lead same shift they are discovered.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Dish station fully operational. Chemical safety practices confirmed. Setup and breakdown owned independently.

**End of Month 1:** Consistent pace maintaining clean supply throughout service. Zero sanitation flags from Kitchen Lead or KM.

**End of Month 3:** Cross-training on basic prep tasks active. Eligible for Prep Chef development track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

This role has a direct impact on three things that matter to the business: ticket times, food safety, and brand standards. All three have financial consequences.

- Clean dishes returned fast keeps the line moving — slow dish return creates ticket time delays and frustrated guests

- Proper sanitation and chemical protocols protect the restaurant's health permit — a violation can shut down service entirely

- A clean restaurant earns better reviews and inspires guest confidence — both directly affect repeat visit rates

**You keep this kitchen running. Without your work, nothing else works the way it should.**

## WHAT WE EXPECT

- Grooming & Uniform: *Boru BOH uniform. Chef jacket or Boru logo tee, non-slip shoes. Clean and appropriate for a food service environment.*

- Attitude: *Dependable, hardworking, and team-oriented. The person in this role sets the floor for everyone else.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 60 lbs (trash bags, supply crates), bend, reach, and move continuously.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *None required — we train from day one. The right work ethic is all you need to start.*$JD$
where slug = 'dish';

-- Fry_Line_Chef_Job_Description_Boru.md → positions.slug = 'fry_cook'
update positions
set description = $JD$[POS_INFO]
Reports To: Assistant Kitchen Manager / Kitchen Lead
Pay Type: Hourly | Starting $12.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Sides are not afterthoughts at Boru — they are check drivers. A perfectly fried karaage or crispy tempura is what takes a $15 ramen order to a $20+ check. Your consistency and speed on the fry station directly impact both the guest experience and the restaurant's average check. Every plate that leaves your station either adds to Boru's reputation or chips away at it.

## THE STANDARD

**Every fried item leaves your station cooked to spec, plated correctly, and within ticket time. No exceptions.**

- All items fried at proper temperature and for the correct time — no guessing.

- Ticket time target: 6 minutes or less for all fried sides.

- Zero soggy, burnt, or under-portioned items leaving the station.

- Oil temperature checked and maintained proactively — not reactively.

## CORE RESPONSIBILITIES

### 1. Execute Every Fried Item to Spec

Karaage, tempura, gyoza, and tofu — all cooked at the correct temperatures, for the correct time, with consistent plating. Proper oil temperature (350F) is not approximate — it is the standard. If it is not golden, crispy, and correctly portioned, it does not leave your station.

> Standard: Oil temp verified at start of shift and monitored throughout. All items meet color, texture, and portion spec before expo handoff.

### 2. Maintain Station Efficiency

Pre-stage your station before service starts. Organize your tools, mise en place, and supply levels so you can move fast once tickets come in. Clean between batches — oil contamination between proteins is a quality and safety issue.

> Standard: Station staged and ready before service opens. Fryer baskets and tools cleaned between protein batches.

### 3. Quality Control Every Plate

Inspect every item before it goes to expo. Golden color, correct crunch, right portion size. If something is off — soggy batter, uneven cook — remake it. A plate that does not meet spec is not worth the ticket it is printed on.

> Standard: 100% self-inspection before expo handoff. Substandard items remade before reaching the guest, never after.

### 4. Support Expo

Hand off sides clearly and accurately. Call out modifications before expo assumes everything is standard. Communicate any timing issues to the Kitchen Lead before a ticket goes late — a heads-up is always better than a delay.

> Standard: All modifications confirmed with expo at handoff. Delays communicated to Kitchen Lead before ticket time expires.

### 5. Track Waste and Oil Usage

Log oil overuse and waste items every shift. Adjust your batch sizes to projected covers — frying 15 pieces for a slow night when 8 will do is direct, visible waste. These numbers are reviewed and they matter.

> Standard: Waste log completed every shift. Batch sizes aligned with projected cover count.

### 6. Follow Safety and Sanitation

Handle oil safely, use proper burn prevention equipment, and clean fryers per protocol. Report equipment issues — uneven heat, fryer malfunction — to the Kitchen Lead immediately. A fryer injury does not just hurt you — it shuts down the station.

> Standard: Fryer cleaning protocol completed every shift. Equipment issues reported to Kitchen Lead same shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All fried items executed to spec. Station setup and breakdown owned independently. Ticket times met.

**End of Month 1:** Consistent quality under rush conditions. Zero expo errors originating from fry station.

**End of Month 3:** Cross-training on Ramen Line or Prep active. Eligible for line advancement track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The fry station is directly connected to check averages and food cost. Your performance here has a real, measurable impact on revenue and profitability.

- Sides are high-margin items — every karaage or tempura sold adds more to the bottom line than the base ramen bowl

- Consistent quality drives repeat side orders — guests who loved the karaage last time will order it again

- Oil waste management is a direct food cost lever — overuse and burnt batches add up to real dollars per shift

- Ticket time efficiency on sides prevents expo bottlenecks that slow down the entire line

**You do not just run a fryer. You drive some of the highest-margin sales in this kitchen.**

## WHAT WE EXPECT

- Grooming & Uniform: *Boru BOH uniform. Chef jacket or Boru logo tee, non-slip shoes. Clean and food-service appropriate.*

- Attitude: *Fast, precise, and consistent. The fry station moves at the speed of service — you have to move with it.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (oil jugs, supply cases), tolerate fryer heat and steam.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *None required — we train from the ground up. The ability to stay focused and consistent under pressure is what we are looking for.*$JD$
where slug = 'fry_cook';

-- Prep_Chef_Job_Description_Boru.md → positions.slug = 'prep_cook'
update positions
set description = $JD$[POS_INFO]
Reports To: Assistant Kitchen Manager / Kitchen Lead
Pay Type: Hourly | Starting $12.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Ramen is only as good as the prep behind it. Consistent chashu, properly boiled eggs, correctly portioned toppings, fresh stock — these are not secondary tasks. They are the foundation of every bowl Boru serves. If prep is off, the line is off. If the line is off, service suffers. And when service suffers, guests notice. Your precision in this role determines what our guests experience at the table.

## THE STANDARD

**All prep completed before service start. Zero line shortages during service caused by prep gaps.**

- All ingredients prepped to recipe card specification — no improvised cuts or measurements.

- Prep checklist completed before service opens, every shift.

- Ingredients properly stored and labeled at correct temperatures at all times.

- No cross-contamination between raw and ready-to-use ingredients.

## CORE RESPONSIBILITIES

### 1. Prepare Ingredients to Spec

Slice chashu to the correct thickness, boil and season eggs to the right doneness, measure toppings and stock accurately, and prep all other components per recipe cards. This is not free-form cooking — it is precision production. The recipe card is the standard, and the standard does not change.

> Standard: All prep items match recipe card specifications. Deviations require Kitchen Lead approval before going to the line.

### 2. Maintain Station Organization

Clean surfaces between tasks. Organize your mise en place so you can work quickly and safely. Label everything that goes into storage. An organized prep station is a fast prep station — and speed on prep protects the line.

> Standard: Prep station cleaned between tasks. All stored items labeled with contents and date before refrigeration.

### 3. Inspect Every Ingredient

Quality check everything before it goes to the line. Reject old chashu, wilted scallions, or off-spec eggs. If you are unsure, ask the Kitchen Lead. Sending a substandard ingredient to the line is not saving time — it is creating a problem that costs more to fix.

> Standard: All prepped items inspected before transfer to line. Defective ingredients reported to Kitchen Lead immediately.

### 4. Support the Line During Service

Anticipate the Ramen Line Chef's needs and restock before they have to ask. During peaks, step in wherever the Kitchen Lead directs — stir broth, stage noodles, run stock. Great prep support makes great service possible.

> Standard: Line restock completed before shortages occur. Respond to Kitchen Lead direction within 2 minutes.

### 5. Track and Minimize Waste

Log trim waste and spoilage every shift. Adjust your prep quantities based on projected covers — do not prep 10 pounds of chashu for a slow Tuesday lunch. Waste reduction is one of the most direct levers on food cost, and you control it.

> Standard: Waste log completed every shift. Prep quantities adjusted to projected covers — no excess over 10% of projected need.

### 6. Follow Safety and Sanitation

Store all ingredients at proper temperatures. Use gloves and sanitize knives and boards between tasks. Report equipment issues — dull blades, failing refrigeration — to the Kitchen Lead immediately. Food safety is not optional and never negotiable.

> Standard: All ingredients stored at correct temps. Knives and boards sanitized between tasks. Equipment issues reported same shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** Recipe cards memorized. Knife skills established. Prep checklist owned independently.

**End of Month 1:** All prep completed independently before service. Zero line shortages caused by prep gaps.

**End of Month 3:** Cross-training on Ramen Line or Fry Line active. Eligible for line position development track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Prep Chef performance directly affects food cost, ticket times, and service quality. The connection between this role and profitability is concrete and measurable.

- Accurate portioning is the most direct lever on food cost — every extra ounce of chashu per bowl multiplies across hundreds of covers

- Complete prep before service prevents line slowdowns — which protects ticket times and table turn rates

- Waste reduction on prep is one of the fastest ways to improve COGS — and it is entirely within your control

- Properly stored and labeled ingredients protect the restaurant from health violations and inventory loss

**You do not just prep ingredients. You build the foundation every bowl is served on.**

## WHAT WE EXPECT

- Grooming & Uniform: *Boru BOH uniform. Chef jacket or Boru logo tee, non-slip shoes. Clean and food-service appropriate.*

- Attitude: *Detail-oriented, consistent, and coachable. In prep, precision is the job.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (stock crates), handle knives and kitchen equipment safely.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *None required — we train from the ground up. Attention to detail and a commitment to consistency are what matter most.*$JD$
where slug = 'prep_cook';

-- Ramen_Line_Chef_Job_Description_Boru.md → positions.slug = 'line_cook'
update positions
set description = $JD$[POS_INFO]
Reports To: Assistant Kitchen Manager / Kitchen Lead
Pay Type: Hourly | Starting $13.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

You are the final craftsperson before the bowl reaches the guest. Twelve hours of broth, precisely prepped toppings, perfectly timed noodles — all of it comes together at your station. This is the most skill-intensive position in our kitchen, and the standard here reflects that. Every bowl you build either honors the work that went into it or wastes it. At Boru, we build every bowl like it matters — because it does.

## THE STANDARD

**Every bowl out of your station is built to spec, at the correct temperature, and within ticket time. No exceptions.**

- All ramen built to recipe card specification — broth, noodles, toppings, and presentation.

- Ticket time target: 8 minutes or less per bowl.

- Broth temperature confirmed at 165F minimum before every bowl.

- Zero modifications missed — every special request is confirmed before expo.

## CORE RESPONSIBILITIES

### 1. Build Every Bowl to Spec

Execute every ramen on the menu with consistency: correct broth temperature, properly cooked noodles, portioned toppings per recipe card. The recipe is not a suggestion — it is the guest's expectation. Deviation without Kitchen Lead approval is not acceptable.

> Standard: All bowls inspected before expo handoff. Broth temp, noodle doneness, and topping portions match recipe card on every bowl.

### 2. Maintain Your Station During Service

Monitor broth levels, noodle supply, and topping mise en place throughout service. Restock before you run short — never let the line stop because your station ran out. A stocked, organized station is a fast station.

> Standard: Station restocked proactively. No line stops due to station shortage during service.

### 3. Quality Check Every Bowl

Taste and inspect before it leaves your station. If the broth is off, if the noodles are overcooked, if the egg is wrong — fix it before it goes to expo. Sending a substandard bowl is not saving time. It is creating a problem that costs more in comps, remakes, and guest trust.

> Standard: 100% self-inspection before expo handoff. No substandard bowls leaving the station.

### 4. Hit Ticket Times

8 minutes from ticket to expo. If you are going to miss that, communicate to the Kitchen Lead before the ticket expires — not after. A proactive heads-up allows the floor to manage the guest. A late ticket with no warning does not.

> Standard: 8-minute ticket time target. Delays communicated to Kitchen Lead before ticket expires.

### 5. Coordinate with Expo

Confirm modifications at handoff every time. Rush orders acknowledged. Special situations — VIP tables, large parties, allergy tickets — handled with extra attention. Expo is your partner, not your audience.

> Standard: All mods confirmed with expo at handoff. Rush orders acknowledged and prioritized within 1 minute of request.

### 6. Track and Report Waste

Flag overcooked noodles, off-spec broth batches, and any spoilage to the Kitchen Lead every shift. Adjust your usage based on projected covers — do not simmer a full broth pot for a slow afternoon service if it will not be used.

> Standard: Waste reported to Kitchen Lead every shift. Broth and ingredient usage aligned with projected cover count.

### 7. Follow Safety and Sanitation

Store all proteins and broths at proper temperatures. Use gloves and sanitize ladles and tools between uses. Report burner or equipment issues to the Kitchen Lead immediately — a failing burner affects every bowl until it is fixed.

> Standard: All proteins stored at 35F or below. Tools sanitized between uses. Equipment issues reported to Kitchen Lead same shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All ramen builds memorized. Broth temps and noodle timing mastered. Line station owned independently.

**End of Month 1:** Consistent 8-minute tickets. Zero quality rejections from KM. Full independence on the line.

**End of Month 3:** Cross-training as backup Fry Line active. Eligible for Assistant Kitchen Manager development track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Ramen Line is where Boru's product lives or dies. Consistency and quality from this station directly determine whether guests return, what they tell their friends, and whether Boru builds the reputation it deserves.

- Consistent bowl quality is what drives Boru's reviews and repeat visit rate — the foundation of sustainable revenue

- Accurate portioning on toppings and broth directly controls food cost — one extra ounce per bowl across 100 covers adds up fast

- 8-minute ticket times directly affect table turn rate — which determines how much revenue the restaurant generates per labor hour

- Zero missed modifications means zero remakes — remakes eat into food cost and slow down the line for everyone

**You build the bowl that defines Boru. Every time.**

## WHAT WE EXPECT

- Grooming & Uniform: *Boru BOH uniform. Chef jacket or Boru logo tee, non-slip shoes. Clean and food-service appropriate at all times.*

- Attitude: *Precise, composed under pressure, and quality-obsessed. This is the most demanding station in the kitchen — own it.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 30 lbs (broth pots), work in a hot, fast-paced kitchen environment.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *3+ months kitchen experience preferred. Ramen-specific training provided. A commitment to precision is required from day one.*$JD$
where slug = 'line_cook';

-- Assistant_Manager_Job_Description_Boru.md → positions.slug = 'asst_mgr'
update positions
set description = $JD$[POS_INFO]
Reports To: Manager
Pay Type: Hourly | Starting $17.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Assistant Manager is the engine of daily floor operations at Boru. You are the bridge between the Manager's standards and the team's execution. When the floor runs smoothly — when guests are happy, servers are focused, and service is consistent — it is because you set the tone, caught the problems early, and held the standard without needing to be asked. This role demands real leadership: composure under pressure, sharp situational awareness, and the ability to coach people in the moment without breaking the flow of service.

## THE STANDARD

**Every shift you run operates on time, on standard, and on budget. No guest leaves unhappy without a recovery attempt made and logged.**

- Shift opens and closes on checklist — no exceptions.

- All guest complaints addressed within the shift with a documented recovery action.

- Real-time coaching delivered during service — not just at the end.

- Labor and section loads monitored throughout the shift.

## CORE RESPONSIBILITIES

### 1. Lead the Shift

Own the floor from open to close. Direct servers, Hostess, and Bartender. Set the pace. Identify problems before they reach the guest. Make decisions without waiting to be told — that is what leadership means in this building.

> Standard: Shift staffing levels set before open. Section assignments confirmed and communicated before first guests are seated.

### 2. Drive Guest Recovery

Handle complaints with composure and authority. Listen fully before responding. Comp strategically — up to $10 without Manager approval. Every recovery action is logged in the shift report for Manager review. A well-handled complaint turns a frustrated guest into a loyal one.

> Standard: 100% of guest complaints addressed before the guest leaves. All recovery actions logged same shift.

### 3. Coach in Real Time

Give specific, immediate feedback during the shift — not a debrief at the end. 'Your greeting on table 6 was rushed — here is what that should sound like next time.' Real-time coaching is more effective, more respectful, and more actionable than post-shift criticism.

> Standard: At least 2 specific coaching moments delivered per shift, documented in shift notes.

### 4. Manage Bar Service

Prepare and serve drinks during your shift as needed. You are not above the bar — you are part of the team. Support the Bartender during rushes, step in when the bar is short-staffed, and maintain bar standards throughout the shift.

> Standard: Bar covered and drink tickets fulfilled within 5 minutes throughout service.

### 5. Execute Opening and Closing

Lead opening and closing checklists with precision. Opening means the restaurant is guest-ready before the first walk-in. Closing means everything is secured, counted, cleaned, and logged before you leave. 'Close enough' is not a standard.

> Standard: Opening checklist complete 15 minutes before doors open. Closing checklist signed off before exit.

### 6. Monitor Labor and Compliance

Watch clock-ins, section loads, and scheduled breaks throughout the shift. Catch overtime before it happens. Enforce health codes and OSHA standards — uniform compliance, sanitation protocols, and break requirements are non-negotiable.

> Standard: No unplanned overtime without Manager notification. Health code and OSHA compliance maintained every shift.

### 7. Develop the Team

Actively develop servers and Hostess during your shifts. Identify skill gaps and address them with specific, repeatable coaching. Your team's growth is your responsibility — not just the Manager's.

> Standard: Each direct report receives at least one specific piece of developmental feedback per shift.

### 8. Handle Cash and POS Accuracy

Verify drops, reconcile POS reports, and resolve all discrepancies before shift close. Never carry a cash error to the next day. Flag anything over $10 to the Manager immediately.

> Standard: Nightly drop verified and documented before close. All POS discrepancies reported to Manager same shift.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Week 1:** All systems and checklists operational. Shift4 POS and Yelp GM fully understood. Shift role shadowed with Manager.

**End of Week 2:** Independent shift management with check-ins. Guest recovery protocol practiced. Real-time coaching active.

**End of Month 1:** Fully independent shift leadership. Coaching team without prompting. Zero unresolved guest issues per shift.

**End of Month 3:** Trusted to close independently. Eligible to begin Manager development track.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Every shift an AM runs is a direct reflection of labor efficiency, guest retention, and team development. Strong AM leadership has a measurable impact on the bottom line — every single night.

- Real-time coaching raises server check averages — a $3 increase across 20 tables is $60 in additional revenue per shift

- Effective guest recovery converts complaints into return visits — and return visits are the most cost-effective form of marketing

- Labor monitoring during the shift prevents overtime and overstaffing — direct food cost and labor cost control

- Strong AM development reduces team turnover — the single most expensive line item in FOH labor budgets

**You do not just run shifts. You protect the guest experience, develop the team, and hold the standard that makes Boru worth coming back to.**

## WHAT WE EXPECT

- Grooming & Uniform: *All-black dress code enforced. Dress shirt required for management, Boru logo tee acceptable. Black pants, black non-slip shoes.*

- Attitude: *Calm under fire, accountable, and coachable. You set the tone — your team mirrors your energy.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 40 lbs, move quickly through a full-service floor.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *1+ year in FOH supervisory role or equivalent. Shift leadership, POS proficiency, and guest resolution experience required.*$JD$
where slug = 'asst_mgr';

-- Manager_Job_Description_Boru.md → positions.slug = 'gen_mgr'
update positions
set description = $JD$[POS_INFO]
Reports To: Owner / Operator
Pay Type: Hourly | Starting $21.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Manager is responsible for the full FOH operation and is the primary partner to the Kitchen Manager in running Boru at the highest level every single day. You protect the culture, drive the numbers, develop the leadership team, and represent the owner's standards when the owner is not in the room. This is not a supervisory role — it is an ownership mentality role. The success of every shift, every team member, and every guest experience runs through this position.

## THE STANDARD

**FOH operates on time, on budget, and on brand — every shift, every week, no exceptions.**

- Labor and cash targets reviewed and met every shift.

- AMs coached and developed on a weekly basis.

- Zero unresolved guest complaints that reach the owner.

- All compliance and safety standards maintained without reminders.

## CORE RESPONSIBILITIES

### 1. Lead FOH Operations

Own the floor. Set the standard for how service looks, feels, and operates at Boru. Every FOH team member — AM, Bartender, Server, Hostess — operates under your direction and accountability. Be present, visible, and decisive.

> Standard: FOH runs to opening checklist standard. Shift pace and quality consistent across all service periods.

### 2. Partner with the Kitchen Manager

Sync daily with the KM on staffing, timing, menu execution, and any operational issues. The line between FOH and BOH should be invisible to the guest — that is the result of a Manager and KM who communicate constantly and solve problems before they reach the floor.

> Standard: Daily pre-shift sync with KM completed. Expo flow and ticket times reviewed at every shift.

### 3. Manage Finances and Labor

Monitor and manage labor costs against budget every shift. Approve FOH expenses, audit nightly drops, and review POS reports for accuracy and trends. The numbers are your responsibility — not just the accountant's.

> Standard: Nightly drop audited before close. Labor variance over budget reported to owner same day.

### 4. Develop the Leadership Team

Train, mentor, and actively develop AMs. Identify their strengths and gaps. Set clear, measurable goals. Your ability to build the next tier of leadership is what allows Boru to grow without everything running through you.

> Standard: Each AM receives at least one structured development conversation per week. AM performance documented monthly.

### 5. Drive Guest Satisfaction

Table touches, recovery oversight, and culture-setting are your tools. Personally touch 5+ tables per shift. Review every recovery action your AMs log. Set and protect the standard of hospitality that makes guests choose Boru over every other option.

> Standard: 5+ personal table touches per shift. All AM-logged recovery actions reviewed within 24 hours.

### 6. Manage Vendor Relationships

Own FOH supply ordering and vendor management. Build relationships, negotiate pricing, and resolve delivery issues quickly. Never let a supply shortage reach the floor — that is a planning failure, not a vendor failure.

> Standard: FOH supply levels reviewed weekly. No service impacted by FOH supply shortages.

### 7. Enforce Compliance and Safety

Conduct weekly FOH compliance audits — health codes, OSHA, uniform standards, equipment function. Train staff on standards proactively, not reactively. A health code violation is not a fine — it is a reflection of leadership.

> Standard: Weekly compliance walkthrough completed. Zero health code violations. Uniform standards enforced every shift.

### 8. Open and Close the Restaurant

Full responsibility for restaurant readiness at open and complete security at close. Checklists are not suggestions — they are the minimum standard. Lead by example every time.

> Standard: Opening checklist complete before first guest. Closing checklist signed and secured before exit.

### 9. Build and Retain the Team

Hold monthly one-on-ones with all FOH staff. Address concerns before they become resignations. Invest in team culture — recognition, communication, and genuine care for your people. Turnover is expensive. Retention is leadership.

> Standard: Monthly check-ins held with all FOH team members. FOH turnover target: below 30% annually.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Month 1** All systems, financials, and team dynamics fully understood. Running independently without owner involvement in daily operations. **Month 3** KPIs meeting target. AM team actively developing. Culture healthy and team stable. Zero open compliance issues. **Month 6** Operations fully owned. Considered for expanded leadership responsibilities across multi-unit growth.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Manager directly controls the two most significant variables in FOH profitability: labor cost and guest retention. Every decision you make about staffing, culture, and service quality has a direct financial consequence.

- Labor management at this level can mean a $500-$1,000 swing per week in FOH labor cost alone

- Strong guest retention is the most cost-effective revenue driver — acquiring a new guest costs 5x more than keeping an existing one

- Effective AM development reduces top-level dependency — which is the only path to sustainable growth

- Consistent service standards drive reviews, word-of-mouth, and the repeat visit rate that sustains the business

**You do not just manage a restaurant. You build the foundation that every other role depends on.**

## WHAT WE EXPECT

- Grooming & Uniform: *All-black dress code. Dress shirt required for management. Black pants, black non-slip shoes. Immaculate presentation always.*

- Attitude: *Accountable, composed, decisive, and people-driven. You build trust by doing what you say and saying what you mean.*

- Physical Requirements: *Able to stand 10+ hours, lift up to 50 lbs, move continuously through a full-service operation.*

- Availability: *Evenings, weekends, and holidays required. Full-time (40 hrs/week).*

- Experience: *2+ years restaurant management or equivalent FOH leadership. POS proficiency, budgeting experience, and team development track record required.*$JD$
where slug = 'gen_mgr';

-- Kitchen_Manager_Job_Description_Boru.md → positions.slug = 'kitchen_mgr'
update positions
set description = $JD$[POS_INFO]
Reports To: Owner / Operator
Pay Type: Hourly | Starting $20.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Kitchen Manager owns everything that happens from the walk-in to the expo window. Food cost, quality, sanitation, team development, and vendor relationships — all of it sits with this role. You are not just running a kitchen. You are running a business within a business, and the numbers have to work. The KM position at Boru requires the discipline of a systems thinker, the instincts of a craftsperson, and the leadership presence to hold a team to the highest standard every day.

## THE STANDARD

**Food cost at or below target. Quality consistent across every shift. Zero health code violations. BOH turnover below 25% annually.**

- Food cost reviewed and within target every period — no exceptions.

- Every dish leaving the kitchen meets recipe card specification.

- Health code compliance maintained across all storage, handling, and preparation.

- BOH team members receive regular, documented development feedback.

## CORE RESPONSIBILITIES

### 1. Lead Full BOH Operations

Own the kitchen — every shift, every station, every outcome. All BOH staff operate under your direction and your standard. Be present on the line, set the pace, and make the call when decisions need to be made. The kitchen reflects its leader.

> Standard: All BOH stations running to spec before service opens. KM presence or accountable designee confirmed at all service periods.

### 2. Control Food Cost

Track waste, enforce portioning standards, and optimize ordering to hit your COGS target every period. Food cost is not an accounting problem — it is a kitchen management problem. Every ounce over-portioned, every item wasted, every order over-bought is your responsibility to prevent.

> Standard: Food cost reviewed against target weekly. Variances over 2% reported to owner with corrective action plan.

### 3. Train and Develop the BOH Team

Build a kitchen team that executes at the highest level and grows within the organization. Train to technique, hold to standard, develop for advancement. Your team's quality is your quality — invest in it.

> Standard: All new hires trained to station standard within first 2 weeks. Monthly development check-ins held with all BOH staff.

### 4. Manage Inventory

Daily counts, accurate vendor ordering, and quality verification on every delivery. Reject anything that does not meet spec — wilted produce, short weights, off-quality proteins. Running a world-class ramen starts with world-class ingredients.

> Standard: Daily inventory counts completed. All deliveries inspected and verified before acceptance. Shortages resolved within 24 hours.

### 5. Maintain Recipe Standards

Standardize every dish on the menu. Taste for consistency daily. Identify and correct any drift in flavor, portioning, or presentation before it becomes a guest complaint. The recipe is the brand — protect it.

> Standard: Daily taste and quality check on all menu items. Recipe drift corrected and team retrained within the same shift.

### 6. Enforce Safety and Sanitation

Own health code compliance completely. Temperature logs, chemical handling, glove protocols, allergen management — all of it runs through you. A health code violation is not a fine — it is a failure of kitchen leadership. Lead by example every day.

> Standard: Daily temp logs completed and reviewed. Zero health code violations. Weekly sanitation audit conducted and documented.

### 7. Partner with the FOH Manager

Sync daily on timing, staffing, menu execution, and operational issues. The guest experience does not know there is a line between FOH and BOH — that is the result of a KM and Manager who communicate constantly and solve problems before the floor feels them.

> Standard: Daily pre-service sync with FOH Manager completed. BOH timing and expo performance reviewed every shift.

### 8. Manage Vendor Relationships

Build relationships with key suppliers, negotiate pricing, and resolve delivery issues swiftly. Know your lead times, know your par levels, and plan ahead. Supply shortages that reach the line are planning failures — not vendor failures.

> Standard: Key vendor relationships maintained with monthly contact. Supply shortages resolved before impacting service.

### 9. Build and Retain the BOH Team

Hold monthly one-on-ones with all BOH staff. Address concerns before they become resignations. Invest in team culture — recognition, clear communication, and genuine investment in people's growth. BOH turnover is expensive, disruptive, and preventable.

> Standard: Monthly check-ins held with all BOH staff. BOH turnover target: below 25% annually.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**Month 1** Full kitchen ownership established. Food cost tracking active. All systems and team standards fully operational. **Month 3** KPIs meeting or exceeding target. BOH team developing. Zero sanitation violations or unresolved quality issues. **Month 6** Prepared for expanded leadership responsibilities. Multi-unit kitchen management track eligible.

## HOW YOU CONTRIBUTE TO THE BUSINESS

The Kitchen Manager owns the two most significant cost variables in the restaurant: food cost and BOH labor. Every decision about ordering, portioning, staffing, and training has a direct financial consequence.

- Food cost is typically 28-32% of revenue — the KM owns this number completely, and it moves the entire P&L

- Accurate portioning, waste reduction, and smart vendor ordering are the difference between a profitable kitchen and a costly one

- Strong team development reduces turnover — which saves thousands in annual BOH recruiting and training costs

- Consistent quality earns the reviews, word-of-mouth, and repeat business that sustain the entire restaurant

**You do not just run a kitchen. You run the financial engine of this restaurant.**

## WHAT WE EXPECT

- Grooming & Uniform: *Boru BOH uniform. Chef jacket or Boru logo tee, non-slip shoes. Leadership presence in appearance and conduct at all times.*

- Attitude: *Accountable, systems-driven, and people-invested. You hold the standard because the business depends on it.*

- Physical Requirements: *Able to stand 10+ hours, lift up to 50 lbs (pork crates, supply cases), work in a demanding high-heat kitchen environment.*

- Availability: *Evenings, weekends, and holidays required. Full-time (40 hrs/week).*

- Experience: *2+ years BOH leadership or equivalent kitchen management experience. Cost control, inventory management, and team development track record required.*$JD$
where slug = 'kitchen_mgr';

-- Assistant_Kitchen_Manager_Job_Description_Boru.md → positions.slug = 'asst_kitchen_mgr'
update positions
set description = $JD$[POS_INFO]
Reports To: Kitchen Manager
Pay Type: Hourly | Starting $14.00/hr
Status: Hourly, Non-Exempt
Schedule: Full-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

The Assistant Kitchen Manager is the Kitchen Manager's right hand and the BOH team's daily anchor. When the KM steps away from the line, you are the standard. You train the cooks, manage station flow, catch quality issues before they reach expo, and protect the integrity of every bowl that leaves this kitchen. This role is the bridge between line execution and kitchen leadership — and it requires the ability to do both at the same time.

## THE STANDARD

**All stations running to spec every shift. Zero quality issues reach the guest without a corrective action being taken.**

- All line stations inspected and confirmed operational before service opens.

- BOH team trained and held to recipe card and checklist standards every shift.

- Quality check at expo — nothing substandard reaches the window.

- Kitchen fully covered and operational when KM is absent.

## CORE RESPONSIBILITIES

### 1. Supervise BOH Shifts

Oversee all line and prep staff during your shift. Assign stations, set the pace, and step in when the team needs support. You are not just observing the kitchen — you are responsible for everything that comes out of it.

> Standard: Station assignments confirmed before service opens. All staff operating to standards throughout shift.

### 2. Train and Develop BOH Staff

Active, specific coaching on technique, station efficiency, and sanitation standards. Set clear expectations and hold them. Know where each team member is in their development, and actively close the gaps. Training is not an event — it is a daily responsibility.

> Standard: At least 2 documented coaching moments per shift. All new hires trained on station basics within first 5 shifts.

### 3. Enforce Quality Standards

Inspect outgoing dishes at expo. Enforce recipe card adherence on the line. If a bowl or side does not meet spec, it goes back — not to the guest. Your standards at expo are the last line of defense between the kitchen and the guest experience.

> Standard: Expo quality check on every station's output during rushes. Zero substandard items passing expo without correction.

### 4. Manage Prep and Inventory

Ensure prep is completed on time and to spec before service opens. Conduct daily inventory counts in partnership with the KM. Flag shortages to the KM with enough lead time to resolve before service — not during it.

> Standard: Prep checklist completion confirmed before service opens. Inventory variances reported to KM before end of shift.

### 5. Control and Report Waste

Track over-prep, spoilage, and portioning issues every shift. Adjust prep quantities to projected covers. Report waste trends to the KM with suggestions for adjustment. Waste control at this level is one of the biggest levers on food cost.

> Standard: Waste log completed every shift. Trends reported to KM weekly with corrective suggestions.

### 6. Coordinate with Expo and FOH

Communicate with the AM on duty on timing, rush status, and any BOH issues that affect the floor. Relay modifications to line chefs accurately. Serve as the BOH communication hub during service.

> Standard: Pre-service sync with AM on duty completed. All FOH modifications relayed to correct line station within 2 minutes.

### 7. Enforce Safety and Sanitation

Conduct daily temperature checks, monitor staff sanitation protocols, and ensure the kitchen meets health code standards every shift. You do not wait for the KM to catch a sanitation issue — you catch it first and correct it.

> Standard: Daily temp logs completed every shift. Sanitation violations corrected same shift without escalation required.

### 8. Run the Kitchen When the KM Is Out

When the Kitchen Manager is absent, you are the Kitchen Manager. Every responsibility, every decision, every standard becomes yours. This is not a temporary elevation — it is a preview of where you are headed.

> Standard: Kitchen operates to full KM standard when covering. No reduction in quality, safety, or efficiency during KM absence.

## YOUR 90-DAY GROWTH PATH

*This is not just a job description — it is a development track. Here is exactly what success looks like at each milestone.*

**End of Month 1:** All BOH systems mastered. Shift supervision independent. Training new hires without KM involvement.

**End of Month 3:** Quality standards fully owned. Waste tracking active and accurate. KM backup trusted without hesitation.

**End of Month 6:** Eligible for Kitchen Manager promotion track. Demonstrating full operational ownership.

## HOW YOU CONTRIBUTE TO THE BUSINESS

Strong kitchen leadership is the single biggest driver of food cost control and BOH team stability. The Assistant KM's performance directly determines whether the kitchen meets its financial and quality targets every week.

- Consistent training reduces line mistakes — which directly reduces waste, remakes, and food cost

- Quality enforcement at expo protects guest satisfaction — which drives return visits and revenue

- Proper prep and inventory management keeps COGS within target — the Assistant KM owns this daily

- Team development at this level reduces BOH turnover — saving thousands in annual recruiting and training costs

**You do not just support the kitchen. You run it — and the numbers show it.**

## WHAT WE EXPECT

- Grooming & Uniform: *Boru BOH uniform. Chef jacket or Boru logo tee, non-slip shoes. Leadership presence reflected in your appearance.*

- Attitude: *Accountable, direct, and development-minded. You hold the standard because you believe in it — not because someone is watching.*

- Physical Requirements: *Able to stand 8+ hours, lift up to 40 lbs (pork crates, supply cases), work continuously in a high-heat kitchen environment.*

- Availability: *Evenings, weekends, and holidays required. Full-time (35-40 hrs/week).*

- Experience: *6+ months as a line chef or equivalent BOH experience. Demonstrated ability to lead, train, and hold others accountable required.*$JD$
where slug = 'asst_kitchen_mgr';

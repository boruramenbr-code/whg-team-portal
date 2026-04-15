-- =====================================================================
-- 003_seed_employee_policies.sql
-- Populates the 9 employee policy bodies (Purpose / Details / Consequences
-- / Acknowledgment text) locked as v1 with Randy on 2026-04-14.
--
-- This migration UPSERTs on (title, version) so it re-runs cleanly
-- and overwrites any prior null-body stubs seeded in 002.
-- =====================================================================

-- 1. Cell Phone Use ---------------------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Cell Phone Use',
  'employee',
  'policy',
  $PURPOSE$Personal phone use on the clock pulls attention away from guests, slows down the team, and creates safety and sanitation risks in a kitchen. This policy sets a clear standard so every employee knows when it's okay to use a phone and when it's not.$PURPOSE$,
  $DETAILS$- Personal cell phones stay off the floor and out of the kitchen during your shift. Keep them in your bag, locker, or designated phone area.
- Phones may be used during scheduled breaks only, and only in the break area or outside — never in view of guests and never in food prep or dish areas.
- If you are expecting an emergency call (sick child, family situation), notify your manager at the start of your shift. They will hold your phone or allow you to check it at agreed-upon times.
- No phones at the host stand, POS, bar, sushi bar, hibachi grill, expo line, or any prep station. This includes scrolling, texting, taking photos, or listening to music through earbuds.
- No photos or videos of guests, other employees, food tickets, POS screens, or the inside of the restaurant without manager approval. This protects guest privacy and proprietary information.
- Smart watches count as phones. If your watch is connected to your phone and you're reading messages on it during service, that's a violation.
- Managers may use phones for work purposes only during service (scheduling, ordering, communication with ownership). Personal use follows the same break-only rule.$DETAILS$,
  $CONS$- 1st violation: Verbal coaching from your manager and the phone is held for the remainder of the shift.
- 2nd violation: Written warning placed in your file.
- 3rd violation: Final written warning and a one-shift suspension without pay.
- 4th violation: Termination.
- Zero-tolerance violations (resulting in immediate final warning or termination depending on severity): taking photos/videos of guests or coworkers without consent, using a phone while handling food or at a guest-facing station, or posting anything about the restaurant, coworkers, or guests on social media during a shift.$CONS$,
  $ACK$I understand that personal cell phone use during my shift is limited to scheduled breaks in designated areas. I will not use my phone at any guest-facing or food prep station, and I will not take photos or videos inside the restaurant without manager approval. I understand that repeated violations may lead to discipline up to and including termination, and that certain violations (such as photographing guests or posting about the restaurant during my shift) may result in immediate termination.$ACK$,
  1, true, 10
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 2. Attendance & Punctuality ----------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Attendance & Punctuality',
  'employee',
  'policy',
  $PURPOSE$A restaurant runs on a schedule. When one person is late or no-shows, the whole team picks up the slack, service suffers, and guests notice. This policy makes it clear what we expect around showing up, being on time, and handling the times when you genuinely can't make it in.$PURPOSE$,
  $DETAILS$- On time means clocked in and ready to work at your scheduled start time — in uniform, phone away, station prepped. "On time" is not walking through the door at your start time.
- Plan to arrive 10 minutes before your shift to give yourself time to park, change, and start the shift calmly.
- A 5-minute grace window applies to the clock-in time; anyone clocking in 6 or more minutes past their scheduled start is considered late.
- Call-outs (you cannot make your shift) must be made by phone call directly to the manager on duty — not by text, not through a coworker — at least 3 hours before your scheduled start time whenever possible.
- For a true emergency (illness, accident, family crisis) where 3 hours' notice isn't possible, call as soon as you reasonably can. Texting only is not acceptable notice unless you cannot physically speak.
- No-call, no-show (missing a shift without any contact before or during the shift) is treated as a serious violation.
- Shift trades must be approved by a manager in advance through 7shifts or R365 Workforce, depending on the platform your location uses. You cannot swap shifts informally with a coworker — the schedule has to reflect the change so the manager knows who is on the floor.
- If you are running late, call the manager immediately. Do not wait until you arrive to explain.
- Consecutive call-outs (two or more shifts in a row) may require a doctor's note before your next shift.
- Unexcused absences and tardiness are tracked on a rolling 90-day window. Patterns matter more than isolated incidents.$DETAILS$,
  $CONS$- Tardiness (clocking in 6+ minutes after scheduled start):
  - 1st occurrence in a rolling 90 days: verbal coaching.
  - 2nd occurrence: written warning.
  - 3rd occurrence: final written warning.
  - 4th occurrence: termination.
- Call-out with proper notice (3+ hours): not disciplined on the first one. Excessive call-outs (3+ in a rolling 90 days, even with notice) move into the written warning track.
- Call-out with short notice (less than 3 hours, not an emergency): treated as a written warning.
- No-call, no-show:
  - 1st offense: final written warning, possible suspension, and loss of preferred shifts.
  - 2nd offense: termination.
- Three consecutive no-call, no-shows are treated as voluntary resignation and your position is closed.$CONS$,
  $ACK$I understand that showing up on time and in uniform, ready to work, is a core expectation of my job. I will call the manager on duty by phone — not text — at least 3 hours before my shift if I cannot make it, except in a true emergency. I understand that shift trades require manager approval in advance through 7shifts or R365 Workforce, and that no-call, no-shows may result in immediate discipline up to and including termination. I understand that three consecutive no-call, no-shows will be treated as voluntary resignation.$ACK$,
  1, true, 20
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 3. Dress Code & Hygiene --------------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Dress Code & Hygiene',
  'employee',
  'policy',
  $PURPOSE$You are the face of Ichiban, Boru, Shokudo, or Central Hub the moment you walk onto the floor. How you look and how clean you are directly affects guest trust, food safety, and the feel of the restaurant. This policy sets the standard so there's no guessing.$PURPOSE$,
  $DETAILS$UNIFORM:
- Wear the uniform assigned to your position and location. Uniforms must be clean, wrinkle-free, and in good repair — no stains, tears, holes, or fading.
- Shirts: tucked in unless the uniform is specifically designed to be untucked (chef coats, certain pullovers). No undershirts showing past the collar or sleeve unless plain black or white.
- Pants: clean black pants (or as specified by your manager). No leggings, yoga pants, jeans, shorts, or sweatpants unless your position's uniform specifies otherwise.
- Shoes: closed-toe, slip-resistant, black. No sneakers with heavy logos, no sandals, no Crocs (even kitchen Crocs unless approved for your station).
- Aprons must be changed when visibly soiled — not worn through the entire shift if stained.
- If your uniform is damaged, notify your manager so it can be replaced. Do not show up to a shift in a damaged uniform.

HYGIENE:
- Shower and use deodorant before every shift.
- Hair must be clean, pulled back, and restrained. BOH (back of house) must wear a hat, cap, or hairnet. FOH (front of house) with long hair must have it tied back and off the face.
- Facial hair must be trimmed and clean. Beards longer than a close trim require a beard net in BOH.
- Nails must be short, clean, and unpolished for anyone handling food. Gel polish, acrylics, and extensions are not permitted for food handlers.
- No strong perfumes, colognes, or scented lotions — they affect the guest's dining experience and can transfer to food.
- Brush your teeth before your shift. Avoid foods with strong odors (heavy garlic, raw onion) before reporting to work.
- Wash hands per food safety standards — entering the kitchen, after breaks, after handling raw product, after restroom use, after touching your face or phone.

JEWELRY & ACCESSORIES:
- Kitchen/BOH: plain wedding band only. No watches, bracelets, rings with stones, dangling earrings, or necklaces outside the collar.
- FOH: minimal, professional jewelry. No oversized hoops, no noisy bracelets, no necklaces that hang into food or drink service.
- Tattoos are allowed unless they contain offensive content (profanity, explicit imagery, hate symbols). Managers may require covering on a case-by-case basis.
- Visible piercings (face, tongue): one small stud is acceptable. Gauges, multiple facial piercings, and septum rings must be removed or covered during shift unless pre-approved by the GM.$DETAILS$,
  $CONS$- 1st violation: verbal coaching and — if possible — corrected on the spot (sent home to change if the issue is major, such as wrong shoes or soiled uniform). If sent home, time off the clock is unpaid.
- 2nd violation: written warning.
- 3rd violation: final written warning.
- 4th violation: termination.
- Hygiene violations affecting food safety (unwashed hands, hair in food, open wounds not covered) are treated as immediate final written warnings regardless of prior record, and may result in termination if willful.$CONS$,
  $ACK$I understand that I must report to every shift in a clean, complete uniform that meets my location's standards, with good personal hygiene, restrained hair, trimmed nails, and no strong scents. I understand I may be sent home unpaid if I arrive out of uniform or out of hygiene standard, and that hygiene violations affecting food safety may result in immediate discipline up to and including termination.$ACK$,
  1, true, 30
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 4. Confidentiality --------------------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Confidentiality',
  'employee',
  'policy',
  $PURPOSE$Working inside a WHG restaurant gives you access to information that is not yours to share — recipes, pricing, financials, guest information, coworker personal details, and business decisions in progress. This policy makes clear what stays inside the four walls and what the consequences are for leaking it.$PURPOSE$,
  $DETAILS$WHAT IS CONFIDENTIAL (non-exhaustive list):
- Recipes, specs, and procedures — sushi cuts, sauce recipes, broth formulas, hibachi techniques, prep sheets, par levels, and any documented SOP.
- Financial information — sales numbers, labor costs, food costs, invoices, payroll, profitability, rent, vendor pricing, tip amounts (beyond your own).
- Business strategy — new concept plans (Shokudo pre-opening, Central Hub build-out, etc.), real estate deals, investor conversations, leadership changes, and any discussion you overhear between ownership, management, or outside consultants.
- Guest information — names, contact details, reservation history, special requests, complaints, incidents, credit card information, and anything a guest shares with staff.
- Coworker information — personal contact details, pay rates, discipline, health issues, immigration status, family matters, and anything shared in confidence.
- Vendor terms — pricing, rebates, contract specifics, and relationships.
- Internal systems and access — POS passwords, R365 logins, 7shifts credentials, manager codes, alarm codes, safe combinations, Wi-Fi passwords for back-of-house networks.

WHAT YOU MUST NOT DO:
- Share confidential information with anyone outside WHG — including spouses, friends, competitors, former employees, or on social media.
- Photograph or screenshot recipes, prep sheets, POS screens, financial reports, schedules with staff information, or any internal document.
- Take home, copy, or email internal documents to a personal account without manager approval.
- Discuss ongoing discipline, terminations, or HR matters with coworkers — go to a manager if you have concerns.
- Use WHG information to benefit a competitor, a future employer, or your own side business.

WHEN YOU LEAVE WHG:
- Your obligation to keep recipes, financials, business plans, and guest/coworker information confidential continues after your employment ends. Leaving the company does not release you from this policy.
- Return all uniforms, keys, manuals, training materials, and any WHG property on your last day.
- Delete any WHG documents, photos, or files from personal devices and personal cloud accounts.

REPORTING BREACHES:
- If you become aware of a confidentiality breach by a coworker, manager, or former employee, report it to your manager or ownership. Good-faith reporting is protected — see the Anti-Retaliation standard.$DETAILS$,
  $CONS$- Minor breach (casual discussion of a recipe with a friend, sharing non-sensitive info): verbal coaching or written warning depending on context.
- Moderate breach (photographing internal documents, sharing financial numbers, discussing coworker pay): final written warning or termination.
- Serious breach (sharing recipes or financials with a competitor, posting internal documents online, leaking guest data, using WHG information for personal or outside business gain): immediate termination and potential legal action, including claims for damages.
- Breaches that involve guest credit card data, immigration status of coworkers, or other legally protected information may also be reported to law enforcement or relevant authorities.$CONS$,
  $ACK$I understand that during and after my employment with WHG, I must keep recipes, financial information, business plans, guest information, coworker personal information, vendor terms, and internal system access strictly confidential. I will not photograph, copy, share, or post any internal information without manager approval. I understand that serious breaches may result in immediate termination and legal action, and that my obligation to maintain confidentiality continues after I leave the company.$ACK$,
  1, true, 40
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 5. Anti-Harassment & Discrimination --------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Anti-Harassment & Discrimination',
  'employee',
  'policy',
  $PURPOSE$Every person who works at a WHG restaurant has the right to a workplace free of harassment, discrimination, and intimidation. This policy defines what is not acceptable, how to report it, and what you can expect from us when you do. This applies to all employees, managers, vendors, contractors, and guests.$PURPOSE$,
  $DETAILS$WHAT IS PROHIBITED:
- Harassment — unwelcome conduct based on race, color, religion, sex, sexual orientation, gender identity, national origin, age, disability, pregnancy, marital status, veteran status, or any other protected characteristic under federal, Louisiana, or local law.
- Sexual harassment — unwelcome sexual advances, requests for sexual favors, sexually suggestive comments, jokes, or physical contact. This includes touching, brushing against, staring at, or making comments about someone's body. It includes sending inappropriate photos or messages, even off the clock.
- Discrimination — treating someone differently (in hiring, scheduling, tips, discipline, promotion, or day-to-day treatment) because of a protected characteristic.
- Retaliation — punishing someone for reporting harassment, discrimination, a safety concern, a wage issue, or any other good-faith complaint.
- Bullying and intimidation — yelling, threatening, name-calling, public humiliation, or deliberately isolating a coworker. Kitchens are high-pressure — urgency and directness are fine; degrading someone is not.
- Hostile work environment — repeated or severe behavior that makes it hard for someone to do their job, even if no single incident is "serious" on its own.

WHAT APPLIES TO EVERYONE:
- This policy covers your behavior on the clock, off the clock but on WHG property, at company events, and in work-related communication (Telegram, text, email, social media referencing coworkers).
- Guest-on-employee harassment counts. If a guest harasses you, report it to the manager on duty. Management will handle the guest — up to and including asking them to leave or banning them from the restaurant.
- Vendor, contractor, or delivery person behavior is also covered.

WHAT TO DO IF IT HAPPENS TO YOU OR YOU WITNESS IT:
1. If you feel safe doing so, tell the person directly that the behavior is unwelcome and needs to stop.
2. Report it to a manager immediately, or if the manager is the issue, report directly to WHG ownership — contact via Telegram.
3. You can report in any form — in person, by phone, by text, by email, or in writing. You do not have to have proof; a good-faith report is enough to trigger an investigation.
4. Write down what happened while it's fresh — date, time, location, who was present, what was said or done.
5. You can also contact the EEOC (federal) or the Louisiana Commission on Human Rights if you believe your complaint is not being handled properly.

WHAT WHG WILL DO:
- Take every report seriously and begin investigation within a reasonable time frame — typically within 24–48 hours of the report.
- Protect the confidentiality of the reporting employee to the extent possible. Some disclosure is necessary for an investigation.
- Separate the reporter and the accused during the investigation where appropriate (scheduling, station, communication).
- Document the investigation, the findings, and the actions taken.
- Take corrective action — which can range from coaching to final written warning to termination — based on findings.
- Never retaliate against an employee for making a good-faith report, even if the investigation does not substantiate the claim.

FALSE REPORTS:
- Good-faith reports are always protected, even if the investigation finds no policy violation.
- Reports made in bad faith (deliberately fabricated to harm another employee) are themselves a policy violation and will be disciplined.$DETAILS$,
  $CONS$- Minor violations (a single inappropriate comment, first-time low-severity incident): written warning plus mandatory coaching.
- Moderate violations (repeated comments, creating a hostile feel, pattern behavior): final written warning or termination.
- Serious violations (any unwanted physical contact, threats, quid pro quo, targeted discrimination in scheduling/tips/discipline, or any form of sexual harassment involving touching): immediate termination.
- Managers who witness a violation and fail to act, or who retaliate against a reporter, face the same discipline ladder as the original offender — harassment by inaction is still a violation.$CONS$,
  $ACK$I understand that WHG prohibits harassment and discrimination based on any protected characteristic, as well as retaliation, bullying, and hostile work environment behavior. I understand this policy applies on the clock, off the clock on WHG property, at company events, and in work-related communication. I know how to report a violation — to a manager, to ownership via Telegram, or to an external agency like the EEOC — and I understand that good-faith reports are protected from retaliation. I understand that serious violations may result in immediate termination.$ACK$,
  1, true, 50
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 6. Safety & Emergency Procedures ------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Safety & Emergency Procedures',
  'employee',
  'policy',
  $PURPOSE$Restaurants are full of hazards — hot surfaces, sharp knives, slippery floors, boiling liquid, heavy lifting, chemicals, and large crowds. Most injuries are preventable when staff know the rules and follow them. This policy covers day-to-day safe practices and what to do when something goes wrong.$PURPOSE$,
  $DETAILS$GENERAL SAFETY RULES:
- Shoes: slip-resistant, closed-toe, in good condition. Worn-out tread is your problem to replace.
- Knives: sharp knives are safer than dull ones. Report dull or damaged knives. Never catch a falling knife — step back.
- Hot surfaces, fryers, and grills: never leave a fryer or grill unattended. Use dry towels to handle hot pans; wet towels transmit heat.
- Walking with knives, hot pans, or boiling liquid: call out clearly ("behind," "hot," "sharp") before passing coworkers.
- Lifting: if an item is heavier than comfortable, get help or use a cart. Bend with your legs, not your back. No lifting over 50 lbs alone.
- Ladders and step stools: use the right tool. Never stand on chairs, crates, or stacked equipment.
- Wet floor signs: place them before you mop, clean a spill, or finish a dish pit task. Remove them when the floor is dry — not before.
- Chemical safety: never mix cleaning chemicals. Use only approved products in their original labeled containers. SDS (Safety Data Sheets) are kept at each location — ask a manager if you need to see them.

REPORTING INJURIES AND INCIDENTS:
- Any injury — no matter how small — must be reported to the manager on duty immediately. This protects you (workers' comp) and the company.
- The manager will fill out an incident report. If medical care is needed, management will direct you to the appropriate clinic or ER.
- Do not return to work with an injury that prevents safe performance. Do not hide an injury out of loyalty to the team.
- Near-misses (things that almost caused an injury) should also be reported so we can fix the hazard before someone gets hurt.

FIRE AND EVACUATION:
- Every location has marked fire extinguishers, fire exits, and an Ansul system over the hood line. Know where they are on your first day. Staff are not expected to operate the Ansul pull, but must know where it is.
- If you see fire: alert the team, use an extinguisher only if it's small and you've been trained, and evacuate through the nearest exit if it spreads. Guest safety comes before property.
- Meet at the designated muster point for your location. Do not re-enter the building until the fire department or manager clears it.
- Call 911 first in any fire that is not immediately contained.

MEDICAL EMERGENCIES:
- If a coworker or guest has a medical emergency (choking, collapse, severe cut, burn, seizure, allergic reaction), call 911 immediately and alert the manager.
- Do not move an injured person unless they are in further danger.
- Know where the first aid kit is at your location. Most cuts and minor burns are handled in-house; anything beyond that goes to 911 or urgent care.

ARMED ROBBERY OR THREAT:
- Cooperate. Money is replaceable. You are not. Do not argue, chase, or resist.
- Note what you can safely observe (description, direction of exit, vehicle) only after the threat is gone.
- Call 911 the moment it is safe. Alert management.
- Do not post about it on social media before management and law enforcement have cleared the scene.

SEVERE WEATHER (hurricane, tornado, flooding):
- Louisiana weather is real. Closure, early release, and re-open decisions are made by WHG ownership unless otherwise delegated, and will be communicated through Telegram and the 7shifts / R365 Workforce scheduling system.
- Do not drive in flooding conditions to make a shift.
- Return-to-work depends on power, water, and staff availability. Management will coordinate.

WORKERS' COMPENSATION:
- Any injury that happens on the job is covered by workers' compensation insurance. Report it immediately so the claim can be filed properly.
- Failure to report an injury within 24 hours can jeopardize your claim.$DETAILS$,
  $CONS$- 1st violation (ignoring a safety rule, not calling out "behind," failing to use a wet floor sign): verbal coaching.
- 2nd violation: written warning.
- 3rd violation: final written warning.
- 4th violation: termination.
- Willful or serious violations — horseplay causing injury risk, mixing chemicals on purpose, removing a safety guard, refusing to report an injury, returning to work unsafely — result in immediate final written warning or termination.
- Failing to report an injury within 24 hours is treated as a serious violation both because it puts you at legal risk and because it exposes the company.$CONS$,
  $ACK$I understand that working in a restaurant involves real hazards and that I am responsible for following safety rules, using protective equipment, and communicating clearly with my team. I will report any injury, no matter how small, to the manager on duty immediately — and I understand that failing to do so within 24 hours can jeopardize my workers' comp claim. I know where the fire exits, extinguishers, and first aid kits are at my location, and I understand that in an armed robbery my first priority is personal safety, not money. I understand that severe weather closures will be communicated through Telegram and the scheduling platform used at my location.$ACK$,
  1, true, 60
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 7. Food Handling & Safety ------------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Food Handling & Safety',
  'employee',
  'policy',
  $PURPOSE$Every plate that leaves our kitchens represents WHG. A single food safety mistake can make a guest sick, trigger a health department citation, or damage the reputation we've spent over two decades building. This policy sets the non-negotiable food handling standards every employee must follow, regardless of position.$PURPOSE$,
  $DETAILS$PERSONAL HYGIENE AT WORK:
- Wash hands for a minimum of 20 seconds with soap and hot water: when starting a shift, after using the restroom, after eating or drinking, after handling raw product, after touching your face/hair/phone, after taking out trash, after handling money, and any time hands are contaminated.
- Gloves are required when handling ready-to-eat food. Change gloves between tasks — never reuse them between raw and cooked, or between different allergen products.
- If you are sick, do not come to work. Specifically, stay home with: vomiting, diarrhea, fever, jaundice, sore throat with fever, or any open wound on the hands that cannot be fully covered. Call the manager per the Attendance policy.
- Return to work after vomiting or diarrhea: you must be symptom-free for at least 24 hours before your next shift.
- Cuts and wounds on the hands must be cleaned, covered with a waterproof bandage, and covered by a glove before handling food.
- No eating, drinking, chewing gum, or smoking in food prep or dish areas. Drinks must be in a closed container with a lid and straw, and kept off prep surfaces.

TEMPERATURE CONTROL:
- Cold foods stay at 41°F or below. Hot foods stay at 135°F or above. The zone between is the danger zone and food cannot sit there.
- Check and log refrigerator, freezer, and hot-holding temperatures at the intervals set by your location (typically open, mid-shift, close) using the current system at your location (paper logs, R365, or as directed by management).
- Cooking temperatures — follow your station's temp chart. Minimum internal temps: poultry 165°F, ground meat 155°F, fish 145°F, beef/pork whole cuts 145°F, eggs cooked to order 145°F.
- Sushi-grade fish handling follows Ichiban, Boru, and Shokudo-specific procedures. Never substitute non-sushi-grade product. FIFO is strict — first in, first out, no exceptions.
- Cooling hot food must be done rapidly: from 135°F to 70°F within 2 hours, then from 70°F to 41°F within an additional 4 hours.
- Reheating leftover food must hit 165°F internal, fast.

CROSS-CONTAMINATION:
- Raw proteins are stored below ready-to-eat foods and produce, always.
- Separate cutting boards and utensils for raw proteins vs. produce vs. ready-to-eat.
- Wiping cloths used for raw product are not used for anything else.
- Allergen awareness is not optional. Know your menu. If a guest declares an allergy, tell a manager immediately — do not guess. Common allergens include peanut, shellfish, sesame, and gluten, among others. A mistake can put someone in the hospital.

FIFO, LABELING, AND DATING:
- Every prepped item must be labeled with date and initials when stored. No unlabeled containers in the walk-in.
- Rotate stock — new product behind old product.
- Discard product past its use-by date. Do not serve expired or questionable product, regardless of perceived waste. "When in doubt, throw it out."

CLEANING AND SANITATION:
- Follow the cleaning schedule posted at your location. Sign off when complete.
- Sanitizer buckets must be made at the correct concentration (test with strips) and changed when dirty or every 2–4 hours, whichever comes first.
- Prep surfaces are washed, rinsed, and sanitized between tasks — not just wiped.
- Floors, walls, shelving, and equipment get cleaned on schedule, not "when they look dirty."
- The three-compartment sink procedure — wash, rinse, sanitize — is followed every time. No shortcuts.

HEALTH DEPARTMENT AND INSPECTIONS:
- Cooperate with any health inspector fully and professionally. Do not argue, lie, or try to hide anything.
- Alert the manager on duty the moment an inspector arrives.
- ServSafe certification is held by the Kitchen Manager or an owner at each location. General staff hold the food handler credential required by Louisiana / East Baton Rouge Parish. Keep yours current. WHG will cover the cost when a certification is required for your role.$DETAILS$,
  $CONS$- 1st violation (missed handwash, incorrect glove change, unlabeled container, minor temp log miss): verbal coaching and on-the-spot correction.
- 2nd violation: written warning.
- 3rd violation: final written warning.
- 4th violation: termination.
- Serious violations result in immediate final written warning or termination, depending on severity:
  - Working a shift while symptomatic (vomiting, diarrhea, fever) and not reporting it
  - Serving food past use-by date knowingly
  - Ignoring a declared guest allergy
  - Falsifying a temperature log or cleaning sign-off
  - Deliberate cross-contamination
  - Failing to alert management when a health inspector arrives
- Violations that directly cause a guest illness, a failed inspection, or a health department citation are grounds for immediate termination.$CONS$,
  $ACK$I understand that food safety is non-negotiable in every WHG kitchen and that following handwashing, glove use, temperature control, cross-contamination prevention, FIFO, labeling, and sanitation rules is part of my core job. I will not come to work symptomatic with vomiting, diarrhea, or fever, and I will return only after being symptom-free for at least 24 hours. I will never falsify a temperature or cleaning log, never ignore a declared guest allergy, and will alert management immediately when a health inspector arrives. I understand that serious food safety violations may result in immediate termination.$ACK$,
  1, true, 70
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 8. Drug & Alcohol ---------------------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Drug & Alcohol',
  'employee',
  'policy',
  $PURPOSE$A restaurant is a fast-paced, high-heat, sharp-tool environment where impaired judgment puts the entire team, our guests, and yourself at risk. This policy sets a clear line: you show up to work sober and fit for duty, every shift, every time.$PURPOSE$,
  $DETAILS$PROHIBITED CONDUCT:
- No one works impaired. Reporting to a shift — or returning to a shift after a break — under the influence of alcohol, marijuana, illegal drugs, or misused prescription drugs is prohibited.
- No alcohol consumption on the clock. This includes "shift beers," sips of cocktails, or tasting drinks you've poured. At WHG, working and drinking do not overlap.
- No drugs on the premises. Possession, distribution, sale, or use of illegal drugs on WHG property or parking lots is prohibited — on the clock or off the clock.
- Marijuana: regardless of Louisiana's current legal status or your personal medical card, WHG is a drug-free workplace. You cannot report to work under the influence of marijuana. Off-duty use that leaves you impaired at work is still a violation.
- Prescription medication: if you are taking prescription medication that could affect your ability to work safely, notify your manager before your shift. You do not need to disclose the medication — only that you may be affected. Management will work with you on accommodation.
- Over-the-counter medication that causes drowsiness should not be taken before a shift without notifying a manager.

GUEST-PROVIDED ALCOHOL:
- Guests sometimes offer drinks to bartenders, servers, or kitchen staff. Politely decline. If a guest insists, involve a manager.
- After-hours drinking on the premises, where permitted at your location, requires manager approval and clear boundaries — it does not carry over into the next shift.

AFTER-HOURS AND OFF-DUTY CONDUCT:
- What you do on your own time is your business, with three limits:
  1. You cannot show up to your next shift impaired.
  2. You cannot bring illegal drugs or alcohol onto WHG property.
  3. You cannot engage in off-duty conduct that damages WHG's reputation (e.g., public intoxication while in uniform, posting videos of drug use tagged to the restaurant).

POST-ACCIDENT AND REASONABLE-SUSPICION TESTING:
- If you are involved in a workplace accident or injury, you may be required to take a drug and alcohol test before returning to work. Testing is handled through a WHG-designated facility. Refusal to test is treated the same as a positive result.
- If a manager has reasonable suspicion you are impaired on shift (slurred speech, unsteady movement, smell of alcohol or marijuana, erratic behavior), you will be removed from the floor and may be required to test. Reasonable suspicion must be observed and documented by a manager — not based on rumor.
- WHG will cover the cost of required testing.

SEEKING HELP:
- If you are struggling with substance use, you can come to ownership or a manager in confidence before it becomes a disciplinary issue. We will work with you on a reasonable plan — time off, counseling referral, or adjusted schedule — to support getting help.
- Self-disclosure is protected when it happens before a violation. Once a violation has occurred, self-disclosure does not erase the violation but will be considered in the response.$DETAILS$,
  $CONS$- Working while impaired, consuming alcohol on the clock, or being in possession of drugs on premises: immediate termination.
- Refusing a post-accident or reasonable-suspicion test: treated as a positive result — immediate termination.
- Failed post-accident or reasonable-suspicion test: immediate termination.
- Minor violations (taking a sip from a guest's drink, failing to notify a manager about a prescription that could affect work): final written warning on first offense, termination on second.
- Off-duty conduct damaging WHG's reputation (public intoxication in uniform, social media posts linking drug use to the restaurant): final written warning or termination depending on severity.
- Violations involving selling, distributing, or sharing drugs with coworkers are treated as immediate termination plus referral to law enforcement where appropriate.$CONS$,
  $ACK$I understand that WHG is a drug-free workplace and that reporting to work impaired by alcohol, marijuana, illegal drugs, or misused prescription drugs is prohibited. I will not drink on the clock, take drinks offered by guests, or bring illegal drugs or alcohol onto WHG property. I understand that regardless of Louisiana's marijuana laws or any personal medical card, I cannot report to work under the influence. I agree to post-accident and reasonable-suspicion drug and alcohol testing as a condition of employment, and I understand that refusing to test is treated the same as a positive result. I understand that violations may result in immediate termination.$ACK$,
  1, true, 80
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 9. Social Media -----------------------------------------------------
insert into policies (title, role_required, kind, purpose, details, consequences, acknowledgment_text, version, active, sort_order)
values (
  'Social Media',
  'employee',
  'policy',
  $PURPOSE$WHG is not strict about personal social media use. We trust our team to use good judgment. This policy exists so the lines that actually matter — guest privacy, confidential information, and anything that damages the restaurant's reputation — are clear.$PURPOSE$,
  $DETAILS$THE SHORT VERSION:
Post what you want on your own accounts, on your own time. Just don't make WHG look or sound bad, and don't cross the lines below.

HARD RULES — DON'T DO THESE:
- No photos or videos of guests without their consent. This is a privacy issue and a liability issue, regardless of how harmless the post seems.
- No confidential information. Recipes, prep techniques, financials, vendor pricing, business plans, and anything else covered under the Confidentiality policy stays off social media.
- No posts that harass, discriminate against, or threaten coworkers, managers, guests, or competitors. Sarcastic "vague posts" aimed at specific people count.
- No speaking for WHG when you don't have that authority. If something goes public — a bad review, an incident, a rumor — do not post a response as if you represent the company. Refer it to ownership.
- No livestreaming or filming during service without manager approval. Short break-time posts that don't show guests or the kitchen in a bad light are fine.

GOOD JUDGMENT — a few things to keep in mind:
- If you're posting a photo of a dish, your uniform, or yourself at work, check the background. Guests, POS screens, prep sheets, and messy stations can all slip into a frame you didn't intend.
- If you're upset about something at work — a shift, a coworker, a manager, a tip — take it to a manager or ownership, not the internet. Public venting about internal issues is the fastest way to turn a small problem into a big one.
- Posts that imply official WHG statements — on incidents, HR matters, or business decisions — need ownership sign-off. "Speak for yourself" posts are fine.

ENCOURAGED:
- Sharing, liking, and reposting content from the official Ichiban, Boru, Shokudo, and Central Hub accounts.
- Genuine posts showing pride in your work, your team, or a dish you're proud of — the kind of content that makes the brand look good.
- Tagging the official accounts when you post something positive.

AFTER YOU LEAVE WHG:
- Confidentiality obligations (recipes, financials, guest and coworker information) continue after employment. See the Confidentiality policy.
- You're free to list your WHG employment on LinkedIn or a resume.

PROTECTED ACTIVITY:
This policy does not restrict your legal right to discuss wages, hours, and working conditions with coworkers or the public, or to report safety issues, harassment, discrimination, wage theft, or illegal activity. Good-faith reports are always protected.$DETAILS$,
  $CONS$Most social media issues are a conversation, not a write-up. We'll talk to you first before escalating.

- Minor issues (background of a post accidentally shows something, tagging got messy): conversation with your manager.
- Moderate issues (public venting about a coworker or shift, repeated minor issues, livestreaming during service): written warning.
- Serious issues result in final written warning or termination:
  - Posting guest photos or personal information
  - Leaking confidential information (recipes, financials, business plans)
  - Harassing, discriminatory, or threatening content directed at coworkers, guests, or the company
  - Content that causes measurable damage to WHG (media attention, health inquiry, guest boycott)
  - Willful, repeated violations after prior coaching$CONS$,
  $ACK$I understand that WHG trusts me to use good judgment on social media, and that my personal accounts are mine. I will not post guest photos without consent, confidential information, or content that harasses coworkers or damages WHG's reputation. I will take workplace issues to a manager or ownership rather than posting about them publicly. I understand my rights to discuss wages, hours, and working conditions, and to report illegal activity, are protected. I understand that serious violations may result in termination, and that confidentiality obligations continue after I leave WHG.$ACK$,
  1, true, 90
)
on conflict (title, version) do update set
  role_required = excluded.role_required,
  kind = excluded.kind,
  purpose = excluded.purpose,
  details = excluded.details,
  consequences = excluded.consequences,
  acknowledgment_text = excluded.acknowledgment_text,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- Verification --------------------------------------------------------
-- After running, you should see all 9 employee policies populated with
-- Purpose / Details / Consequences / Acknowledgment filled in.
select title, version, length(purpose) as p_len, length(details) as d_len, length(consequences) as c_len, length(acknowledgment_text) as a_len
from policies
where role_required = 'employee' and kind = 'policy' and active = true
order by sort_order;

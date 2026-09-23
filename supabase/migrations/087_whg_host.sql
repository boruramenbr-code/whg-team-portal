-- ============================================================
-- 087 — WHG Host / Hostess (Randy, Sept 22 2026)
--
-- One description for every restaurant. Restaurant-specific detail —
-- the reservation system (Yelp Guest Manager at Boru, OpenTable at
-- Ichiban), the floor layout and cover count, hibachi birthday setups,
-- and the uniform — is taught in that restaurant's own modules.
--
-- Randy's calls on this one:
--   • 30-second greet at every restaurant (Boru's said 60).
--   • Waiting guests: the next 3 parties on deck, updated at least every
--     10 minutes — not every party every 5.
--   • The goodbye is now a real responsibility, not just a sentence in
--     the intro.
--
-- Safe to run more than once. The last statement prints the result.
-- ============================================================

update positions
set description = $WHG$[POS_INFO]
Reports To: Assistant Manager / Restaurant Manager
Status: Hourly, Non-Exempt
Schedule: Full-time or part-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

A machine can seat people. It cannot make them feel expected. You are the first person every guest meets and usually the last one they talk to, and those two moments frame everything that happens in between. Before anyone reads a menu, they already know how this place feels about them — and you are the one who told them.

Do it right and the room feels like it is glad they came. That is what brings them back, and it is what makes one guest worth three: they return, they bring someone, and they tell people.

## THE STANDARD

**Nobody waits without knowing where they stand, and nobody leaves without being thanked.**

- Every guest acknowledged within 30 seconds of walking in — even when you are on the phone.

- The next three parties on deck know where they stand, updated at least every 10 minutes.

- Wait quotes are honest, never optimistic.

- Sections balanced — no server triple-sat while another sits empty.

- The stand and the entry are inspection-ready before service.

## CORE RESPONSIBILITIES

### 1. Greet Like They Were Expected

Thirty seconds, warm and real — not a recited line. Read the party before you speak: a couple on a date, a birthday group, a family with young kids, someone just off a flight. Ask if it is their first time with us; that tells you how much guiding they will want. If you are on the phone or mid-task, make eye contact and hold up a finger. Being seen is the whole thing.

> Standard: 100% of guests acknowledged within 30 seconds, with the same energy at 9pm on a Saturday as at 5pm on a Tuesday.

### 2. Own the Wait

Quote a time you can beat, not one that sounds good. Nothing sours a night faster than a 20-minute wait that turns into 45. Keep the next three parties on deck updated at least every 10 minutes — they are the ones about to be seated and the ones most likely to walk. Everyone else gets an honest quote at check-in and a heads-up when they move up. "Still about ten minutes" is information. Silence is not.

> Standard: The next 3 parties on deck updated at least every 10 minutes. Every guest notified the moment their table is ready.

### 3. Seat for the Floor, Not for the Door

Know every server's section and current table count. Balance the floor so service holds up. Confirm a table is fully reset before you walk anyone to it — a table that is not ready is not a table.

> Standard: Section rotation followed unless a manager directs otherwise. No party seated at an unconfirmed table.

### 4. Own the Phone

Answer within three rings. Know the menu well enough to answer the common questions without putting anyone on hold. Take reservations accurately, note what matters to that guest, and hand large-party inquiries to a manager right away.

> Standard: Calls answered within 3 rings. Large-party inquiries to a manager within 5 minutes. Reservations entered with no missed details.

### 5. Keep the Entry Spotless

The stand, the menus, and the lobby are the first physical thing a guest touches. Menus wiped and stocked, tablet charged, nothing stacked on the stand, entry clean.

> Standard: Stand and entry inspection-ready before every service.

### 6. Help the Floor in the Rush

Your post is not a podium. Run water, deliver menus, clear a table, pass a request to the kitchen. When the floor is buried, the door helps.

> Standard: At least 2 visible floor assists per rush. The stand is never left unattended without coverage.

### 7. Close the Loop on the Way Out

The goodbye is yours too. Make eye contact, thank them, and use their name when you know it. If they waited, acknowledge it — "thanks for being patient with us tonight." Guests decide how they feel about a place in the last thirty seconds as much as the first.

> Standard: Every departing guest acknowledged and thanked.

### 8. When the Wait Goes Wrong

A long wait, a lost reservation, a party that gets split up — the guest in front of you is not the problem, the situation is. Apologize once and mean it. Get a manager right away when a guest is upset or a quote was badly missed. Never promise a comp, a free item, or a specific table you cannot guarantee.

> Standard: Guest concerns go to the manager on duty right away. No comps, discounts, or promises from the host stand.

## YOUR 90-DAY GROWTH PATH

*Your growth here comes down to your habits — not luck, and not favorites.*

**End of Week 1:** Welcome, Paperwork, and Meet-your-team steps finished in the app. Reservation system basics down. Every server section learned.

**End of Week 2:** Running the door on a normal night. Accurate quotes, balanced seating, no missed greets.

**End of Month 1:** Confident through a rush. Zero complaints tied to waits or seating.

**End of Month 3:** Trusted to run the door alone on your busiest night. Eligible to cross-train toward server.

## HOW YOU CONTRIBUTE TO THE BUSINESS

- Every walkout is revenue that came through the door and left. Honest quotes and steady updates are how you stop them.

- Balanced seating protects service quality — which protects tips for the whole floor.

- Faster, cleaner turns mean more guests served on the same night with the same staff.

- The arrival and the goodbye are two of the most common things guests mention in reviews.

**You do not manage a door. You manage the start — and the memory — of every guest's night.**

## WHAT WE EXPECT

- Attitude: *The same care for every guest, no matter the party size or the hour. Warm, calm under pressure, coachable. We train skills; we cannot train character.*

- Mindset: *Slow nights are practice. The habits you build on a Tuesday show up on a Saturday.*

- Grooming & Uniform: *Clean, professional appearance at all times, meeting your restaurant's uniform standard. The stand is always on display.*

- Physical Requirements: *Able to stand 8+ hours, carry menus and supplies up to 15 lbs, move quickly through a busy lobby.*

- Availability: *Evenings, weekends, and holidays required.*

- Experience: *None required — we train from the start. Hospitality instincts matter more than experience.*$WHG$,
    updated_at = now()
where slug = 'host';

update position_descriptions
set description = null, updated_at = now()
where position_id = (select id from positions where slug = 'host');

-- ── Result ─────────────────────────────────────────────────────────
select
  (select length(description) from positions where slug = 'host') as whg_host_description_chars,
  (select count(*) from position_descriptions
     where position_id = (select id from positions where slug = 'host')
       and description is not null) as local_host_copies_left,
  (select count(*) from positions
     where description like '%next three parties on deck%') as ten_minute_rule_in_place;

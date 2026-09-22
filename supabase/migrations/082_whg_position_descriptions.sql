-- ============================================================
-- 082 — WHG-level position descriptions
--
-- Randy's call (Sept 2026): one description per position for the whole
-- group, so a server trained at one restaurant meets the same standard at
-- every other one. Anything restaurant-specific — POS, menu, station flow,
-- uniform, ticket-time targets — moves OUT of the description and into that
-- restaurant's own training modules.
--
--   • positions.description              → the WHG version (shown everywhere)
--   • position_descriptions.description  → optional local override; the ROW
--     still controls which positions a restaurant shows at all.
--
-- This migration makes the local copy optional, writes the WHG Server
-- description, and clears the two local Server copies so Boru and Ichiban
-- both read the same one.
--
-- Requires the /api/positions fallback (ships with this change) — without
-- it, a cleared local copy would render an empty description.
-- ============================================================

alter table position_descriptions alter column description drop not null;

update positions
set description = $WHG$[POS_INFO]
Reports To: Assistant Manager / Restaurant Manager
Pay Type: Tipped Hourly | $2.15/hr + tips
Status: Hourly, Non-Exempt
Schedule: Full-time or part-time | Evenings, weekends & holidays
[/POS_INFO]

## WHY THIS ROLE MATTERS

Anyone can take an order. A kiosk can take an order. At WHG, you are here for something a machine cannot do: make the night. The birthday table. The couple trying something new for the first time. The family that has been coming for years.

Guests come back for the food. They come back again and again because of how you made them feel. Every guest you treat right turns into three — they come back, they bring someone, and they tell people about us. That is the difference between an order taker and an experience maker, and it shows up in what you take home.

## THE STANDARD

**Every guest gets the same experience — table one on a slow Tuesday and table forty on a packed Saturday.**

- Greeted within 30 seconds of being seated — eyes and a smile first, menu second.

- One personal touch at every table — something about them, not a script.

- A genuine recommendation at every table — what you would order.

- Food delivered on time. Hot food hot, cold food cold.

- A check-back within two bites or two minutes.

- Refills before anyone has to ask.

## CORE RESPONSIBILITIES

### 1. Greet and Connect

The first 30 seconds set the whole night. "How are you?" gets "Fine, thanks" — an automatic answer and no connection. Open with something real instead: "What are you celebrating tonight?" or "First time with us?" Use your own words — the right opener is the one that sounds like you. Asking whether it is their first visit also tells you how much guidance they want.

> Standard: Every table greeted within 30 seconds of seating. Missed greets reported to the manager on duty immediately.

### 2. Guide the Order Like an Expert

Know your restaurant's full menu by the end of Week 2 — every dish, every drink, every pairing. Then do not read the menu to guests; guide them. "This is the one I order on my night off" lands completely differently than a list of ingredients. Guests can read a menu on their own. They cannot taste it. That is what you are there for.

> Standard: Menu mastered by end of Week 2. A genuine recommendation or pairing at every table.

### 3. Enter Orders with 100% Accuracy

Enter every order exactly as the guest asked it — every substitution, allergy, and preference. Read modifications back before you send. A mistake at entry costs food, time, and trust.

> Standard: Zero order-entry errors per shift. Every modification confirmed with the guest before sending.

### 4. Make Every Touch Count

You will visit each table eight to ten times during a meal. Hospitality does not need more time — it needs a few seconds of warmth inside the visits you are already making. "Absolutely, anything else I can grab?" takes the same time as "Sure." "My pleasure" says more than "no problem." Never walk to or from a table empty-handed.

> Standard: Check-back within two bites or two minutes. Full hands in, full hands out.

### 5. When Something Goes Wrong

Most unhappy guests never say a word — they just do not come back. The guest who tells you is giving you a chance to fix it:

- Apologize once, and mean it.

- Do not play detective. Whose fault it was does not matter to the guest.

- Get on the guest's side — you and the guest against the problem.

- Bring the manager to the table right away. Only a manager can comp or adjust a check, so never promise one yourself.

A problem handled well can make a guest more loyal than a night with no problems at all.

> Standard: Every guest concern goes to the manager on duty right away. No comps, discounts, or promises from the server.

### 6. Know Your Regulars

Recognize the guests who keep choosing us. Remember what they order, where they like to sit, what they skip. Use their name when you know it. You should not have to be told who the regulars are.

> Standard: Regulars acknowledged and their preferences remembered without being prompted.

### 7. Keep a Clean, Ready Section

Clear plates within 5 minutes of guests finishing, and fully clear the table before the check arrives. Reset tables right away and restock without being asked. A clean section shows the next guest we care — and it gets them seated faster.

> Standard: Tables cleared within 5 minutes. Table fully cleared before every check. No unset or cluttered tables during service.

### 8. Handle Payments with Accuracy

Run every payment accurately, every time. Split checks confidently — a ten-person party split ten ways is part of the job. Flag any discrepancy to the manager and submit cash drops per the shift-end procedure.

> Standard: Zero uncorrected payment errors per shift. All discrepancies escalated to the manager.

### 9. It Is the Guest, Not My Table

There is no "my section" at WHG. Run food for teammates, clear a table that is not yours, pass a guest's request to whoever can handle it fastest. Help without keeping score — the guest does not care whose table it is, and neither do we. No phones, no headphones on the floor.

> Standard: At least 2 visible team assists per shift during peak periods.

## YOUR 90-DAY GROWTH PATH

*Your growth here comes down to your habits — not luck, and not favorites.*

**End of Week 1:** Welcome, Paperwork, and Meet-your-team steps finished in the app. Register basics down. Floor training underway with your assigned trainer.

**End of Week 2:** Full menu mastered. Signed off to run your own tables. A 30-second greet and a genuine recommendation at every table.

**End of Month 1:** Check average at the shift target. Zero uncorrected payment errors. Your first regulars — guests asking for you by name.

**End of Month 3:** A trusted floor anchor, with the same standard on a slow Tuesday as on a packed Saturday. Eligible to train toward a lead or trainer role.

## HOW YOU CONTRIBUTE TO THE BUSINESS

- Every guest is worth three — treat 100 tables right and they become 300 guests, with no advertising required.

- Knowing the menu and making real recommendations can mean about 10% more from the same tables — for the restaurant and for your tips.

- Every remake from an entry mistake is food we pay for twice.

- Faster resets mean more guests served on the same night.

**You are not just serving food. You are the reason guests choose us again.**

## WHAT WE EXPECT

- Attitude: *The same care for every table — no matter the tip, the party size, or the time of night. Warm, calm under pressure, coachable. We train skills; we cannot train character.*

- Mindset: *Slow nights are practice. The habits you build on a Tuesday show up on a Saturday.*

- Grooming & Uniform: *Clean, professional appearance at all times, meeting your restaurant's uniform standard.*

- Physical Requirements: *Able to stand 8+ hours, carry trays up to 20 lbs, bend, reach, and move quickly through a busy floor.*

- Availability: *Evenings, weekends, and holidays required.*

- Experience: *None required — we train from the ground up. The right attitude is the only starting requirement.*$WHG$,
    updated_at = now()
where slug = 'server';

update position_descriptions
set description = null,
    updated_at = now()
where position_id = (select id from positions where slug = 'server');

# WHG Team Portal — Roadmap

Living document of everything planned, in-progress, and shipped for the WHG Team Portal. Update as ideas evolve. Nothing here is committed until it's built.

---

## ✅ Already Shipped

- **Handbook chatbot** — RAG over employee/manager handbooks with English + Spanish support, location-specific policy overrides, per-user rate limiting, and chat history logging.
- **Role-based logins** — Employee, manager, assistant manager, admin roles. Admin can switch restaurant context.
- **Pre-Shift Tab** — Manager-authored pre-shift notes with Specials, 86'd list, Focus items, and owner messages. Item-level attribution (each line tagged with the initials of whoever added it) so multiple managers can co-edit the same day's note.
- **Secret hygiene** — All API keys externalized to `.env.local` / Vercel env vars. Legacy Supabase JWT keys disabled in favor of the new publishable/secret key system.

---

## 🛠 In Planning

### 1. Onboarding & Training Module
The biggest near-term initiative — turn new-hire onboarding into a structured, trackable experience instead of a paper packet.

- **Position-based onboarding checklists** — Separate tracks for server, host, sushi chef, line cook, dishwasher, bartender, manager. Each checklist is a sequence of tasks the new hire must complete, with manager sign-off where needed.
- **Interactive training modules** — Short lessons with text, images, and eventually video. Built around the handbook content already in the system.
- **Certifications** — Employees can earn certifications (e.g., "Certified Server," "Certified Sushi Assistant," "Food Safety Certified"). Each certification has prerequisites, a test or manager sign-off, and an expiration/refresh cadence.
- **Pay bumps tied to certifications** — Operationally, hitting certain certifications triggers a pay review. The app surfaces eligibility to managers.
- **Training progress dashboard** — Managers see who's completed what; employees see what's next.

### 2. BOH Operations Module
Digital versions of the paper/clipboard stuff the back of house still runs on.

- **Waste log** — Quick entry: what was wasted, how much, why. Rolls up into a weekly waste report for the GM and controller.
- **Restroom check log** — Hourly checks with timestamp and initials. Tied to the Pre-Shift tab so it's visible during the shift.
- **Station audits / line checks** — Pre-service checklists for each station (sushi bar, hot line, cold prep, expo). Photos optional.
- **Temperature logs** — Walk-in, reach-in, hot hold. Required daily.

### 3. Gamification — "WHG Points"
Make doing the right things feel rewarding. Built on top of the training, BOH, and pre-shift modules.

- **Points for actions** — Completing training, earning certifications, nailing a line check, great guest feedback, picking up shifts, etc.
- **Levels / ranks** — Visual progression tied to kitchen/FOH themes. Example ladder: Spoon → Prep → Line → Sous → Chef (parallel ladder for FOH).
- **Weekly challenges** — Rotating goals ("log 5 waste entries this week," "complete the new cold app training," "get mentioned by a guest").
- **Leaderboards** — Per-restaurant and cross-brand. Weekly and all-time views.
- **Rewards redemption** — Points cash out for gift cards, swag, shift trades, or cash bonuses. Managers approve redemptions.

#### Review Recognition Board *(spec'd 2026-04-11 — see [REVIEWS_SPEC.md](./REVIEWS_SPEC.md))*
A dedicated Reviews tab (Tab 3 of the portal) with a live appreciation feed and a three-board mentions leaderboard tied to a tiered reward system.

- **Appreciation feed** — Rolling 7-day window of recent 4–5 star reviews, newest on top. Employees see only appreciation reviews by default; managers see all reviews. Each card shows source, rating, date, body, and pills tagging staff named.
- **Three mentions boards** — Monthly, Quarterly, and All-Time "Head Honcho." Zero-mention staff never appear. Only 4–5 star reviews count.
- **Prize structure** (locked in):
  - **Monthly**: 3 mentions → $10 WHG gift card, 5 mentions → $25 WHG gift card, 10 mentions → $50 WHG gift card. One tier per employee per month (highest hit, not stacked). Uses WHG restaurant gift cards because real cost is ~35% of face value.
  - **Quarterly**: #1 rank at quarter close → $100 cash or Visa/Amazon gift card (their choice). #2 → $50 WHG gift card. Optional stretch: 20+ mentions in a quarter → automatic $100 regardless of rank.
  - **All-Time Head Honcho**: no cash prize, pure prestige. #1 holds the 👑 crown until someone passes them. This is the retention board.
- **How reviews get in** — Phase 1: manager manually adds a review (paste text, tag staff). Phase 2: Google Business Profile API auto-sync. Yelp stays manual (their API is too crippled to rely on).
- **Tagging** — Any manager at a location can add or edit staff tags on any review at that location. All active employees are taggable, including bussers and back-kitchen — if they get named, they count.
- **Payout control** — No automatic payouts. Every reward goes through a manager-approved queue with full audit trail. Cost exposure: ~$5,700/year worst case across all four locations.
- **Cost ceiling dashboard** — Admin view surfaces running monthly and quarterly spend per location so you can see exposure before approving payouts.

### 4. Anonymous Feedback Channel
A way for staff to raise issues without having to walk into a manager's office. Routed to the appropriate manager/owner. Tracked so nothing gets lost.

### 5. Policy Acknowledgment Tracking
When a policy changes (handbook update, new SOP, schedule policy), push it to the affected staff, require them to read and acknowledge, and log the acknowledgment for HR/legal.

### 6. Schedule Visibility (light)
Not building a full scheduler — 7shifts already does that. But pull the current week's schedule into the portal so employees see their shifts without leaving the app. Read-only to start.

### 7. Handbook Chat Enhancements
- **Image / media support** — Employees can ask "what does the hibachi station setup look like?" and get back a photo from the handbook, not just text.
- **Feedback loop** — Thumbs up/down on answers, routed to admin so we can find gaps in the handbook.
- **Suggested questions** — Surface common questions by role and restaurant to help people discover what the assistant can do.

### 8. Manager Dashboard
A single screen for a manager walking into their shift: today's pre-shift note, training due, certifications expiring, open waste entries, unacknowledged policies, recent reviews, WHG Points leaderboard snapshot.

---

## 🌅 Bigger Picture

The portal is being built for WHG first, but the design intent is that each module is generic enough to work for any multi-location restaurant group — and eventually any frontline-workforce business (retail, hospitality, services). The long-term path is:

1. **Phase 1** — Prove it inside WHG (Ichiban, Boru, Shokudo, Central Hub).
2. **Phase 2** — Polish and package it as a standalone SaaS product for other independent restaurant groups.
3. **Phase 3** — Explore adjacent industries that have the same "frontline staff + SOPs + training + gamification" shape.

---

## 📌 Notes

- This file lives in the repo so it survives context compactions and anyone (Claude, Randy, future collaborators) can read it and know the plan.
- When a feature moves from "In Planning" to "In Progress," note it here with a target date. When it ships, move it to "Already Shipped" with a short description.
- New ideas go under "In Planning" with a short description and a date. Don't edit old ideas — add revisions so we can see how thinking evolved.

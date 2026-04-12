# Reviews Tab — v1 Specification

Living spec for Tab 3 of the WHG Team Portal: the Reviews feed and Mentions leaderboard. Source of truth for what we're building. Update as decisions change.

---

## Problem Statement

Google and Yelp reviews come in constantly, but they disappear into the void. Staff who are named never hear about it, shift-to-shift momentum never builds, and there's no mechanism to turn guest love into recognition or real rewards. This tab fixes that by turning recent reviews into a live appreciation board and converting mentions into a transparent, rewarded leaderboard.

## Goals

- **Adoption**: 80% of new 4–5 star reviews get logged within 48 hours of receipt.
- **Tag coverage**: 90% of logged reviews that name staff have those staff tagged.
- **Engagement**: 50% of employees view the leaderboard at least once per week.
- **Payout loop closes every month**: earned rewards are paid out within 5 business days of month-end.
- **Behavior change**: staff start asking guests to mention them by name — the clearest signal the loop is working.

## Non-Goals (v1)

- No Google / Yelp auto-sync. Manual entry only in v1. (Google API in Phase 2.)
- No responding to reviews from inside the portal. Review responses still happen in Google Business Profile / Yelp directly.
- No automated sentiment analysis. Star rating tells us whether it's appreciation or critical.
- No negative-mention tracking. If a staff member is named in a bad review, that's a coaching conversation, not a leaderboard entry.
- No guest-facing anything. Internal only.
- No automatic payouts. Every reward is manager-approved before it's handed out.
- No cross-brand leaderboard in v1. Each restaurant has its own boards.

---

## Tab Structure

The Reviews tab has three sub-views:

1. **Feed** — rolling window of recent reviews. Default view.
2. **Mentions** — leaderboard with three cadences: Monthly, Quarterly, All-Time (Head Honcho).
3. **Payouts** (manager/admin only) — queue of earned-but-unpaid rewards.

---

## Sub-view 1: Reviews Feed

### Employee view

- Card-stack layout, newest on top.
- **Default window**: last 7 days.
- Each review card shows:
  - Source logo (Google / Yelp / Other)
  - Star rating
  - Date received
  - Guest first name (or "Guest" if anonymous)
  - Review body
  - Pills for staff tagged: "🌟 Maria, James"
  - Location (admin cross-restaurant view only)
- **Toggle**: Appreciation feed (4–5 star only, default for employees) vs All reviews
- **Filters**: location (admin), rating, source
- EN/ES language toggle matching the rest of the portal.

### Manager view (additive)

- **Add Review** button — form fields: source, star rating, date, guest name (optional), body, location, staff tag multi-select.
- Edit / soft-delete on reviews they've added.
- Critical reviews (1–3 star) visible by default in their view.
- **Duplicate detection**: if a review with matching source + date + first 50 chars of body exists, warn before saving.

### Staff tagging

- Any manager at a location can add or edit staff tags on any review at that location.
- Tagging uses a searchable dropdown tied to the internal employee roster (active employees only).
- Everyone on active staff is taggable — bussers, back-kitchen, sushi, FOH, managers. If they're an employee and they get named, they count.
- Multiple staff can be tagged on a single review; all tagged staff get credit equally.

---

## Sub-view 2: Mentions Leaderboard

Three boards, each a separate tab-within-tab.

### Monthly Board

- Resets the 1st of every month (calendar month).
- Ranks active employees by mention count this month.
- Zero-mention staff not displayed.
- Each row shows: rank, name, mention count, current tier badge, progress bar to next tier.
- Top row highlighted with 🌟; employee viewing sees their own row pinned/highlighted.

**Monthly reward tiers (one payout per employee per month — highest hit):**

- 3 mentions → $10 WHG restaurant gift card
- 5 mentions → $25 WHG restaurant gift card
- 10 mentions → $50 WHG restaurant gift card

Only 4–5 star reviews count toward monthly mention totals.

### Quarterly Board

- Resets every quarter (Jan/Apr/Jul/Oct 1st).
- Ranks active employees by mention count this quarter.
- This is where the bigger prize lives — creates a competitive race.

**Quarterly rewards:**

- **Quarterly Champion** (#1 rank at quarter close) → **$100 cash OR Visa/Amazon gift card** (employee's choice)
- **Runner-up** (#2 rank) → $50 WHG restaurant gift card
- **Stretch bonus** (optional): any employee hitting 20+ mentions in a quarter gets automatic $100 regardless of rank. For true superstars.

Ties are broken by who hit the tie first (earliest Nth mention wins).

### All-Time Board — "Head Honcho"

- Running total of mentions for the employee's entire tenure at WHG.
- #1 sits at the top with a 👑 crown next to their name until someone passes them.
- **No cash prize** — pure prestige. This is the retention board.
- Terminated employees drop off current boards; their history is preserved for the portal but they're removed from the live All-Time view.

---

## Sub-view 3: Payout Queue (Manager / Admin Only)

- Lists every earned-but-unpaid reward for the current period.
- Each row: employee name, period, tier earned, mentions count, status (pending/approved/paid).
- Manager reviews, approves, marks as paid, logs: payout method, amount, date, notes.
- History of past payouts per employee — prevents double-payment and gives audit trail.
- Admin cross-restaurant view shows total monthly and quarterly exposure so you can see spend before approving.

### Cost ceiling and visibility

- Monthly rollup shows total face value earned this period per location and portfolio-wide.
- Red flag if a location's monthly payouts exceed a configurable cap.
- Gift cards cost ~30–35% of face value in real food cost; the portfolio dashboard shows both face value and estimated real cost.

---

## Data Model

### `reviews`
- `id` (uuid, pk)
- `restaurant_id` (fk)
- `source` (enum: google, yelp, other)
- `star_rating` (1–5)
- `review_date` (date)
- `guest_name` (text, nullable)
- `body` (text)
- `added_by` (user_id)
- `added_at` (timestamp)
- `external_id` (text, nullable — for future Google API dedup)
- `deleted_at` (timestamp, nullable — soft delete)

### `review_mentions`
- `id` (uuid, pk)
- `review_id` (fk)
- `employee_id` (fk)
- `added_by` (user_id)
- `added_at` (timestamp)

### `employees`
- `id` (uuid, pk)
- `first_name`, `last_name`
- `restaurant_id` (fk — primary location)
- `role` (server, busser, sushi, line, host, manager, etc.)
- `active` (bool)
- `hire_date`
- `terminated_at` (nullable)

### `mention_rewards`
- `id` (uuid, pk)
- `employee_id` (fk)
- `restaurant_id` (fk)
- `period_type` (enum: monthly, quarterly)
- `period_start`, `period_end`
- `mentions_count`
- `tier_earned` (enum: monthly_10, monthly_25, monthly_50, quarterly_champion, quarterly_runnerup, quarterly_stretch)
- `earned_at`
- `redeemed` (bool)
- `redeemed_at`, `redeemed_by`
- `payout_method` (enum: whg_gift_card, cash, visa_gift_card, amazon_gift_card)
- `payout_amount`
- `notes`

---

## API Endpoints

- `POST /api/reviews` — add review (manager+)
- `GET /api/reviews?restaurant=&window=&source=&min_stars=` — list reviews
- `PATCH /api/reviews/:id` — edit review
- `DELETE /api/reviews/:id` — soft delete
- `POST /api/reviews/:id/mentions` — tag/untag staff
- `GET /api/mentions/leaderboard?period=monthly|quarterly|alltime&restaurant=` — ranked list
- `GET /api/mentions/employee/:id?period=` — single employee mentions history
- `GET /api/rewards/pending?restaurant=` — payout queue (manager+)
- `POST /api/rewards/:id/redeem` — mark paid
- `GET /api/employees?restaurant=&active=true` — roster for tagging dropdown

---

## Screens to Build

1. **Reviews Feed** (employee + manager variants)
2. **Add Review modal** (manager+)
3. **Mentions leaderboard — Monthly tab**
4. **Mentions leaderboard — Quarterly tab**
5. **Mentions leaderboard — All-Time (Head Honcho) tab**
6. **Employee mention detail** (drill-in from leaderboard — that employee's mention history)
7. **Payout queue** (manager/admin)
8. **Mark paid modal** (manager/admin)
9. **Employee roster admin** (simple CRUD for adding/editing employees, since we're maintaining the roster in the portal)

All screens EN/ES.

---

## Phased Build

### Phase 1 — v1 (ship first)
- Manual review entry
- Reviews feed with appreciation / all toggle
- Staff tagging against internal employee roster
- Three mentions boards: Monthly, Quarterly, All-Time
- Payout queue with manager approval flow
- Employee roster admin
- EN/ES

### Phase 2 — fast follow (1–2 weeks after v1)
- Employee "My Mentions" widget on their home screen
- Telegram push to manager group when a review is logged naming staff
- Configurable prize tiers in admin settings (per location or portfolio-wide)
- Auto-suggest staff tags from review text (first-name matching against roster)

### Phase 3 — once v1 is proven
- Google Business Profile API auto-sync
- Historical trends chart (mentions over time per employee)
- Export to spreadsheet for payroll integration
- Hall of Fame section for terminated employees who were All-Time top 5

---

## Cost Exposure (Budget Guardrails)

**Worst-case per location per year:**

- Monthly (assuming 3 people hit $50 tier + 2 hit $25 + 3 hit $10 each month): ~$230/month face value × 12 ≈ $2,760 face value, ~$960 real cost (gift cards at ~35% food cost)
- Quarterly ($100 champion + $50 runner-up, 4 quarters): $600 face value, ~$460 real cost
- **Per location worst case: ~$1,420/year real cost**
- **Four locations worst case: ~$5,700/year portfolio-wide**

Realistic is likely half that. The payout queue surfaces running totals so you can see exposure before approving.

---

## Acceptance Criteria (v1)

- [ ] A manager can add a review in under 60 seconds
- [ ] A manager can tag multiple staff in one review
- [ ] Any manager at a location can edit tags on any review at that location
- [ ] Employees see only 4–5 star reviews by default
- [ ] Zero-mention employees never appear on any board
- [ ] Monthly tiers are enforced — employee gets the single highest tier hit, not stacked
- [ ] Head Honcho #1 stays #1 until a larger mention count surpasses them
- [ ] Terminated employees drop off live boards automatically
- [ ] Payouts cannot be double-marked as paid
- [ ] All screens work in English and Spanish
- [ ] Duplicate review warning fires on source + date + first-50-char body match

---

## Open for Phase 2+ Consideration

- Should employees see each others' individual mention histories or only the leaderboard rollup?
- Should we allow guest-facing signage (digital frame, kitchen display) to pull from the appreciation feed?
- Should quarterly runner-up threshold scale with location size (a 15-staff location vs. a 40-staff location)?

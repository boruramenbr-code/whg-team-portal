# Anonymous Feedback Box — v1 Specification

Living spec for the Anonymous Feedback tab of the WHG Team Portal. A private channel for staff to raise concerns, suggestions, and compliments without fear of retaliation. Source of truth for what we're building.

---

## Problem Statement

Staff have feedback managers never hear — concerns about scheduling, pay, coworkers, safety, facilities, the food, or their direct manager. Today, the only options are "walk into a manager's office" or "say nothing," and most people choose silence. The result: issues fester, you lose good employees, and by the time you find out something was wrong, it's too late. This tab gives staff a private, low-friction channel to surface what they're not comfortable saying in person.

## Goals

- **Adoption**: 30% of active employees submit at least one piece of feedback within the first 60 days of launch.
- **Response loop**: 100% of submissions are marked `reviewed` by a manager or owner within 48 hours.
- **Resolution rate**: 70% of actionable submissions reach `resolved` or `dismissed` within 2 weeks.
- **Trust signal**: staff report (informally or via follow-up feedback) that they trust the system is actually anonymous.
- **The real metric**: you start hearing about problems before they become resignations.

## Non-Goals (v1)

- No content in notifications. Push/Telegram/email messages say "new feedback submitted at [location]" — never the body.
- No two-way conversation with the submitter. The submission is one-way by design. If staff want to discuss something, they can raise it in person or submit again.
- No deletion. Managers and owners cannot delete submissions — only change status. Deletion would break the audit trail and the trust model.
- No guest-facing anything. Internal only.
- No sentiment analysis or AI categorization in v1. Staff picks the category themselves.

---

## The Anonymity Model

This is the most important design decision in this spec. Most anonymous feedback systems quietly fail because they're not actually anonymous, and staff figure that out fast. The technical decisions below are non-negotiable:

- **No user reference on the row, ever.** The submit endpoint requires login (so random people on the internet can't spam it) and verifies the user is an active employee, but inserts the feedback row with NO connection back to the submitter. Identity dies at the API layer.
- **No IP logging, no device IDs, no user agents** on this endpoint. Strip them before anything hits logs.
- **Row-level security in Supabase**: employees can INSERT only. Managers can SELECT only for their restaurant and only where `about_manager = false`. Owners/admins can SELECT on everything.
- **You cannot query who submitted what, even if you wanted to.** The data was never stored. This single design decision is what makes the system trustworthy.
- **Plain English + Spanish promise on the submit screen**: "We do not store your name, your login, your device, or your IP. Managers see the comment and the category. They do not see who sent it."
- **Honest caveat to staff**: "Very specific details may still identify you." If someone writes *"I'm the only Tuesday morning prep cook at Boru and my manager…"* the content itself breaks anonymity. This can't be solved technically. Telling staff upfront keeps the system honest.

---

## The Escalation Checkbox

A single checkbox on the submit form determines where the submission goes:

**"This is about my manager"**

- **Unchecked (default)**: location managers and owners both see it. Normal routing.
- **Checked**: owners-only. Location manager does NOT see it in their inbox. You and whoever you designate as admin are the only ones who can view it.

Without this checkbox, a complaint about the Ichiban manager routes to the Ichiban manager. The first time that happens, staff notice, and the box dies. This checkbox is the difference between a working anonymous channel and theater.

Form label (EN): *"Check this if your feedback is about a manager at your location. It will be sent directly to the owner and will not be visible to your manager."*

Form label (ES): *"Marque esta casilla si sus comentarios son sobre un gerente de su ubicación. Se enviará directamente al propietario y no será visible para su gerente."*

---

## Where Comments Go

One place only: a Supabase table called `feedback_submissions`, visible only through the in-portal Feedback Inbox screen, gated by role.

- **Employees** — submit only. Never see other submissions, never see a list, never see statuses. Confirmation screen after submit and that's it.
- **Location managers** — see the inbox for their location. All submissions for that restaurant EXCEPT `about_manager = true` ones. Can change status, add private internal notes.
- **Owners / admins** — see everything across all locations. Cross-location filter. Separate "Direct to owner" view showing `about_manager = true` submissions that location managers don't see.
- **Nobody else** — no notifications with content, no email copies, no external access. Comments live inside the database and can only be viewed by authenticating into the portal in a privileged role.

---

## Data Model

### `feedback_submissions`
- `id` (uuid, pk)
- `restaurant_id` (fk — which location)
- `category` (enum: management, scheduling, pay, coworkers, safety, facilities, food_kitchen, suggestion, compliment, other)
- `sentiment` (enum: concern, suggestion, compliment)
- `body` (text)
- `about_manager` (bool) — escalation checkbox
- `created_at` (timestamp)
- `status` (enum: new, reviewed, in_progress, resolved, dismissed)
- `manager_note` (text, internal — private to manager/owner, never shown to submitter)
- `resolved_at`, `resolved_by` — the MANAGER/OWNER who resolved it, not the submitter
- `resolved_by` is a user_id — the person acting on the submission, not the person who submitted it

**Notice what's NOT on this table**: no `user_id`, no `employee_id`, no `ip_address`, no `device_id`, no `user_agent`. Nothing that links the row back to the person who submitted it.

---

## API Endpoints

- `POST /api/feedback` — auth-gated, strips identity, inserts row. Returns success only (no id, no echo back). Rate limit: max 5 submissions per user per day to prevent abuse while still allowing legitimate use.
- `GET /api/feedback?restaurant=&status=&category=` — manager+ only. RLS enforces who sees what.
- `PATCH /api/feedback/:id` — manager+ only. Updates `status` or `manager_note`. Cannot edit `body` or `category`.
- `GET /api/feedback/unread-count?restaurant=` — for the inbox badge.

No DELETE endpoint. If something is resolved or not actionable, mark it `resolved` or `dismissed`.

---

## Screens to Build

1. **Submit screen (employee)** — category dropdown, sentiment picker, "about my manager" checkbox, free-text body, submit button. Privacy promise visible above the form. EN/ES.
2. **Submit confirmation screen** — "Your feedback was sent. Managers will review it but will not know who submitted it." EN/ES.
3. **Feedback Inbox (manager)** — list view sorted by newest. Filters: category, status, date range. Click row to see full submission, change status, add internal note. Shows only `about_manager = false` at their location.
4. **Feedback Inbox (owner/admin)** — same layout, plus cross-location filter, plus a separate "Direct to owner" section showing `about_manager = true` submissions that location managers don't see.
5. **Unread badge** on the Feedback tab for managers and owners when there are unreviewed submissions.

All screens EN/ES matching existing portal pattern.

---

## Status Workflow

```
new → reviewed → in_progress → resolved
                              → dismissed
```

- **new**: just submitted, nobody has looked at it yet.
- **reviewed**: a manager/owner has read it. No action taken yet.
- **in_progress**: manager/owner is actively working on it.
- **resolved**: action taken, issue addressed.
- **dismissed**: not actionable, duplicate, spam, or not something the business will change. Internal note should explain why.

`resolved_at` and `resolved_by` are set when status moves to `resolved` or `dismissed`.

---

## Acceptance Criteria (v1)

- [ ] An employee can submit feedback in under 60 seconds
- [ ] The privacy promise is visible and prominent on the submit screen
- [ ] Submit endpoint stores NO identifying information (no user_id, no IP, no device)
- [ ] The "about my manager" checkbox routes the submission to owners only — location managers cannot see those submissions in their inbox
- [ ] RLS prevents employees from ever reading feedback rows
- [ ] RLS prevents location managers from reading feedback from other locations
- [ ] RLS prevents location managers from reading `about_manager = true` rows
- [ ] Owners can see everything across all locations
- [ ] Nobody can DELETE submissions through the API
- [ ] Rate limit of 5 submissions per user per day is enforced
- [ ] Unread badge appears on the Feedback tab for manager and owner roles
- [ ] All screens work in English and Spanish
- [ ] No content appears in any notification, log, or external message

---

## Phased Build

### Phase 1 — v1 (ship first, ~half day build)
- Supabase table + RLS policies
- Submit endpoint with identity stripping
- Employee submit screen (EN/ES)
- Manager inbox screen
- Owner inbox screen with "Direct to owner" section
- Unread badge
- Status workflow

### Phase 2 — fast follow
- Telegram push to manager group chat when new feedback arrives (content stays in portal, message is only "new feedback at [location]")
- Daily digest email (count only, no content)
- Auto-reminder if a submission has been in `new` or `reviewed` for more than 7 days
- Trends dashboard for owners (submissions per week, per category, per location)
- Tags/labels beyond the category enum

### Phase 3 — once v1 is proven
- Closed-loop response: manager can post a public-to-staff response that appears on a "You Said / We Did" board. Creates visible proof the box works without breaking the one-way design of individual submissions.
- Optional categories configurable per location
- Escalation routing: a configurable rule that auto-flags safety/harassment submissions to owners even without the checkbox

---

## Open Questions

1. **Who's on the owner/admin list?** Currently it's you (Randy). Should the controller see submissions? Any other admin layer?
2. **Retention policy** — do we keep resolved submissions forever, or auto-archive after some period (1 year, 3 years)? Legal has an opinion here if you have an employee handbook clause about it.
3. **Language presence for the escalation checkbox** — the form should probably show the privacy promise and the "about my manager" option prominently, not buried. Want the owner/admin to be able to customize the text?

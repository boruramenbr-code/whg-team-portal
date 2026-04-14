# Handbook & Policies Tab — v1 Specification

Living spec for the Handbook & Policies tab of the WHG Team Portal. Combines the full employee handbook (readable + searchable), 9 employee policy sheets + 7 manager policy sheets with digital signatures, and the handbook chatbot — all in one tab. Source of truth for what we're building.

**Revision history:**
- **v1 (2026-04-11)** — Initial spec: handbook reading view, 9 employee policies, chatbot personality upgrade, compliance dashboard.
- **v1.1 (2026-04-12)** — Revisions after reviewing the WHG Handbook v4.0: confirmed WHG is the master brand (handbook + policies are WHG-wide, not per-restaurant); added two-tier policy system with 7 manager-specific policies; uniform details moved to training manuals per restaurant (not in Dress Code policy); policy wording sourced from handbook v4.0 (2025), not from the older Boru Policies PDF.

---

## Problem Statement

Today, new hires get a paper packet of policies and a handbook they lose or never read. Signatures are on paper forms filed in a cabinet. If an employee claims they never saw a policy, you dig through filing boxes. If a policy changes, you reprint, redistribute, and re-sign everyone by hand. This tab digitizes the entire flow: read the handbook, read each policy, sign each one digitally, and give managers a real-time compliance dashboard showing who's signed what.

## Goals

- **100% digital signature coverage**: every active employee has a digital signature on file for every applicable policy and the handbook acknowledgment.
- **New hire completion**: new employees sign all policies within their first 3 shifts.
- **Re-acknowledgment speed**: when a policy is updated, 90% of affected staff re-sign within 2 weeks.
- **Zero paper**: eliminate all paper policy packets and signature sheets.
- **Audit-ready**: any signature record can be pulled up in under 10 seconds with employee name, timestamp, and the exact version of the policy they signed.

## Non-Goals (v1)

- No manager handbook in the reading view for now — chatbot still handles manager-specific content. Manager handbook reading view is a future add.
- No automatic policy generation or AI-assisted policy writing.
- No integration with external HR systems (Paychex, R365 Workforce) for v1.
- No e-signature with drawn/finger signatures — typed full legal name + checkbox is sufficient and legally binding in Louisiana.

---

## Tab Structure

The Handbook & Policies tab has three sub-tabs:

1. **Handbook** — full employee handbook, responsive reading view, master acknowledgment signature at the bottom.
2. **Policies** — the 9–10 individual policy sheets, each readable + individually signable.
3. **Ask** — the existing handbook chatbot (relocated from current Tab 1), upgraded with personalized responses.

---

## Source of Truth Rule

**The WHG Team Handbook v4.0 (Effective 2025) is the authoritative source for all policy content.** The older individual policy PDFs (Boru Policies) define the structural categories (which 9 employee policies exist) but the handbook defines current wording. When loading policy content into the portal, use the handbook's language.

## Brand & Multi-Location Model

**Wong Hospitality Group is the master brand.** The handbook and all policies are WHG-wide, not per-restaurant. The handbook itself states: *"This handbook establishes the standards, expectations, and policies that govern your employment with Wong Hospitality Group. It applies to all employees across all locations unless a specific policy is noted as location-specific."*

How this is modeled:

- **Handbook**: one WHG handbook (v4.0). All employees read the same document regardless of location.
- **Employee policies**: 9 WHG-wide policies. All employees sign the same set.
- **Manager policies**: 7 WHG-wide policies. All managers sign the same set (on top of the 9 employee policies).
- **Location overlays**: each policy has an optional `location_notes` field. When a logged-in employee belongs to a restaurant that has location-specific addenda for a given policy, those notes render below the main policy body. For v1, we do not expect to populate many of these — most policies are purely WHG-wide.
- **Uniform details**: NOT in the Dress Code policy. Uniform specifics are handled in each restaurant's training manual instead. This keeps the Dress Code policy WHG-generic and avoids duplicating content between the portal and training materials.
- **Signature records**: every signature records the employee's `restaurant_id` at time of signing so the audit trail shows which location they were assigned to when they acknowledged the policy.

## Two-Tier Policy System

All employees (including managers) sign the **9 employee policies**. Managers also sign **7 additional manager-specific policies** that establish a higher duty of care for supervisors and enforcers.

### The 9 Employee Policies (WHG-wide)

1. Cell Phone Use Policy
2. Attendance and Punctuality Policy
3. Dress Code and Hygiene Policy
4. Confidentiality Agreement
5. Anti-Harassment and Respect Policy
6. Safety and Emergency Procedures Policy
7. Food Handling and Sanitation Policy
8. Drug and Alcohol Policy
9. Social Media Policy

*(Policy #10 — Acknowledgment of Employee Handbook — is merged with the Handbook master signature; signing the handbook automatically satisfies this.)*

### The 7 Manager Policies (WHG-wide, managers only) — see [MANAGER_POLICIES_DRAFT.md](./MANAGER_POLICIES_DRAFT.md) for full draft text

1. Leadership Standards & Code of Conduct
2. Anti-Retaliation Policy
3. Employee Confidentiality & Privacy
4. Complaint Handling & Escalation
5. Fair & Consistent Enforcement
6. Financial & Operational Integrity
7. Fraternization & Boundaries

Every manager policy carries the standard heightened-duty statement in its acknowledgment: *"As a manager at Wong Hospitality Group, I am responsible for modeling, enforcing, and upholding this standard. I accept a higher duty of care than the employees I supervise."*

### Why this ordering for manager policies

Manager policies are sequenced so that earlier signatures establish the principles later signatures depend on:
- #1 (Leadership Standards) sets the foundational "higher duty" frame
- #2 (Anti-Retaliation) is the most legally critical and must be signed before a manager has access to the Feedback Box contents
- #3 (Confidentiality) is a day-one obligation the moment a manager has elevated data access
- #4 (Complaint Handling) gives managers the operational procedure for #2
- #5 (Fair Enforcement) governs how they apply the 9 employee policies they just signed
- #6 (Financial Integrity) is operational but critical
- #7 (Fraternization) stands alone

### Handbook Acknowledgment (universal)

In addition to the 9 or 16 policies above, every employee (regardless of role) signs the Handbook master acknowledgment at the bottom of the Handbook sub-tab.

**Totals:**
- **Employees** sign: Handbook + 9 employee policies = **10 signatures**
- **Managers** sign: Handbook + 9 employee policies + 7 manager policies = **17 signatures**

---

## Sub-tab 1: Handbook (Read)

### What the employee sees

- The full employee handbook rendered as responsive, reflowable HTML text — NOT a PDF.
- **Table of contents**: sidebar on desktop, collapsible hamburger menu on mobile. Tap a section to jump directly to it.
- **Responsive text sizing** (automatic, no user action needed):
  - Phone (<640px): 18px body, generous line spacing, full-width
  - Tablet (640–1024px): 17px body, comfortable margins
  - Desktop (1024+): 16px body, reading width capped at ~700px so lines don't stretch too wide
- Text reflows naturally — no pinch-zoom, no horizontal scroll, no PDF viewer. Like reading on Kindle.
- **Search within handbook**: a search bar that highlights and jumps to matching sections.
- **Section deep links**: every section has a shareable URL so a manager can text an employee "read this section" with a direct link.
- EN/ES toggle matching the rest of the portal.

### Master acknowledgment (at the bottom of the handbook)

After the last section of the handbook, the employee sees:

> **Acknowledgment of Employee Handbook**
>
> I have received [Restaurant Name]'s employee handbook and had a chance to read it. I agree to follow all policies and ask questions if I'm unclear. I know breaking these rules may lead to discipline, up to termination. Policies may be updated, and management will notify me of changes.
>
> Full Legal Name: [________________]
>
> [ ] I have read and understand the Employee Handbook
>
> [Sign & Submit]

After signing: "Signed by [Name] on [Date]. Version [X.X]." Green checkmark. Cannot un-sign.

### What the manager sees (additive)

- Same reading view, but with a banner at the top showing: "22 of 26 employees have signed the current handbook version. [View compliance →]"
- Link to the compliance dashboard (see below).

---

## Sub-tab 2: Policies (Read + Sign)

### Policies employees see (9 + 1 handbook ack)

All employees, regardless of location, see the same 9 WHG employee policies listed above under "Two-Tier Policy System." The 10th item (Acknowledgment of Employee Handbook) is merged with the Handbook sub-tab's master signature — signing the handbook marks it as complete automatically.

### Policies managers see (9 + 7 + 1 handbook ack)

Managers see their 9 employee policies listed first (grouped as "Employee Policies"), then their 7 additional manager policies (grouped as "Manager Policies"). Both groups use the same signature flow. The acknowledgment text on manager policies includes the heightened-duty statement.

### What the employee sees

- **Policy list view**: card layout. Each card shows:
  - Policy number and title
  - Purpose (one-line summary)
  - Status badge: ✅ "Signed [date]" (green) or ⚠️ "Signature required" (orange)
  - Unsigned policies sorted to the top
- **Tap a policy → full reading view**: same responsive text rendering as the handbook. Sections: Purpose → Policy Details → Consequences → Employee Acknowledgment.
- **Digital signature at the bottom of each policy**:

> **Employee Acknowledgment**
>
> I understand and agree to follow [Restaurant Name]'s [Policy Title].
>
> Full Legal Name: [________________]
>
> [ ] I have read and understand this policy
>
> [Sign & Submit]

- After signing: status badge flips to green checkmark with date. Employee can re-read anytime but cannot un-sign.
- **Progress indicator**: "You have signed 7 of 9 policies" at the top of the list view.

### What the manager sees (additive)

- Same policy list, but instead of sign buttons they see the compliance dashboard.
- Can preview any policy as employees see it.
- **Admin can add/edit policies**: a simple form to create a new policy or edit an existing one. Fields: title, purpose, details (rich text), consequences (rich text), acknowledgment text, restaurant, sort order.
- **Version bump**: when a policy is edited, the version auto-increments. All existing signatures for the old version are flagged as "needs re-acknowledgment."

### Policy content structure (consistent across all policies)

Every policy follows the same four-section format from Randy's PDFs:

```
Purpose: [one paragraph]

Policy Details: [bulleted list]

Consequences: [bulleted list]

Employee Acknowledgment: [acknowledgment text + signature block]
```

This consistency means one component renders all policies. No special templates needed.

---

## Sub-tab 3: Ask (Chatbot — relocated + upgraded)

The existing handbook chatbot moves from standalone Tab 1 into this tab as the "Ask" sub-tab. Functionally it stays the same RAG pipeline, but with personality and personalization upgrades.

### Chatbot Personality Upgrade

**Current behavior**: answers are pulled from the handbook and delivered verbatim or near-verbatim. Feels like reading a document.

**New behavior**: the chatbot should feel like talking to a friendly, knowledgeable coworker who happens to know the handbook inside and out. Specific changes:

1. **Use the employee's first name.** The user is authenticated — we know who they are. Greet them by name. Sprinkle their name naturally in responses (not every sentence, just occasionally). Example: "Good question, Maria. Here's how the attendance policy works at Boru..."

2. **Don't copy-paste from the handbook.** Rephrase in natural, conversational language. The handbook is the source of truth, but the answer should sound like a person explaining it, not a document being read aloud. Example instead of "Employees must arrive at least 10 minutes before their shift to change, prep, and be ready to work" → "You'll want to get there about 10 minutes early so you have time to change, prep your station, and be ready to go when the shift starts."

3. **Ask follow-up questions when the question is vague.** If someone asks "what's the policy on phones?" — answer the core question, then ask "Does that cover what you needed, or did you have a specific situation in mind?" This makes the chatbot feel interactive, not one-directional.

4. **Acknowledge the context.** If someone asks about dress code, the answer should be aware of their restaurant. "At Boru, kitchen staff wear the Boru chef coat with non-slip shoes..." not a generic answer that could be for any restaurant.

5. **Keep it brief by default, offer to expand.** Most employees want a quick answer, not a paragraph. Give the 2-3 sentence version first, then offer: "Want me to go into more detail on any of that?"

6. **Tone**: friendly, clear, slightly casual. Not corporate, not robotic. Match the voice of Randy's actual policies — they already have personality ("ramen waits for no one!", "don't spill the broth").

### Implementation approach

This is a **system prompt change** in the chat API endpoint, not a code rewrite. The RAG retrieval stays the same. What changes is the system prompt that wraps the retrieved context before sending to the LLM. The new system prompt instructs the model to:
- Use the employee's first name (passed as a variable)
- Rephrase handbook content in conversational language
- Be aware of the employee's restaurant context
- Ask clarifying follow-ups when appropriate
- Keep answers concise with an offer to expand
- Match the friendly-but-professional tone of the policies themselves

This is absolutely doable and requires minimal code changes — mostly just updating the system prompt in the chat route handler.

---

## New Hire Onboarding Flow

When a new employee logs in and has unsigned policies:

- **Persistent banner** at the top of every tab: "You have [X] policies waiting for your signature. [Go to Policies →]"
- The banner stays until all policies + handbook acknowledgment are signed.
- Policies sub-tab shows unsigned items sorted to the top with orange badges.
- Progress bar: "3 of 10 complete"
- They don't have to finish in one sitting — progress is saved. But the banner follows them everywhere until they're done.

**Optional (your call for v1 or v2):** block access to other tabs (Pre-Shift, Feedback, Reviews) until all policies are signed. This forces completion during the first shift. My recommendation: banner-only for v1 (less friction), hard block as a v2 option you can toggle per location.

---

## Manager Compliance Dashboard

Visible to managers and admins on the Policies sub-tab.

### Location manager view

**Summary bar:**
- [X] active employees (of which [X] are managers)
- [X] fully compliant (all applicable policies + handbook signed on current version)
- [X] employees with missing signatures

**Grouped by tier:**
- **Employee Tier Compliance**: signed status across all 9 employee policies, for all active employees
- **Manager Tier Compliance**: signed status across the 7 manager policies, for all active managers only

**By employee (drill-down):**
- Employee name → list of signed/unsigned policies with dates (their applicable tier only)
- "Send reminder" button → flags the employee so they see a nudge banner on next login

**By policy (drill-down):**
- Policy name → compliance percentage (denominator = employees required to sign, based on role), list of who's signed and who hasn't
- "Version [X] updated [date] — [X] employees need to re-sign"

### Admin/owner view (additive)

- Cross-restaurant filter
- Portfolio-wide compliance: "Ichiban: 100% | Boru: 85% | Shokudo: 62% (8 new hires)"
- Export signature records per employee or per policy (CSV or PDF) for legal/HR files

---

## Multi-Restaurant Support

- Each policy has a `restaurant_id` — Boru has its 10, Ichiban will have its own set (similar but with sushi-specific wording), etc.
- Policies can be cloned from one restaurant to another and edited per location.
- A future "WHG Standard" template system can push updates across locations — but for v1, each restaurant's policies are managed independently.
- The handbook is also per-restaurant (each location may have location-specific sections).

---

## Data Model

### `handbook_sections`
- `id` (uuid, pk)
- `restaurant_id` (fk)
- `title` (text)
- `body` (rich text / HTML)
- `sort_order` (int)
- `role_visibility` (enum: employee, manager, all)
- `version` (int)
- `active` (bool)
- `created_at`, `updated_at`

### `policies`
- `id` (uuid, pk)
- `restaurant_id` (fk, nullable) — `null` for WHG-wide policies (the default); set only for truly location-specific policies
- `role_required` (enum: "employee", "manager", "all") — who must sign this policy
- `title` (text) — e.g., "Cell Phone Use Policy"
- `purpose` (text) — one-line summary
- `details` (rich text / HTML) — the policy body
- `consequences` (rich text / HTML)
- `acknowledgment_text` (text) — the specific "I understand and agree to follow..." statement
- `location_notes` (rich text / HTML, nullable) — optional per-location addenda; rendered below `details` when the viewing employee's restaurant has content here
- `version` (int) — auto-increments on edit
- `effective_date` (date)
- `sort_order` (int)
- `active` (bool)
- `created_by` (user_id)
- `created_at`, `updated_at`

### `policy_signatures`
- `id` (uuid, pk)
- `policy_id` (fk)
- `policy_version` (int) — the version of the policy at time of signing
- `user_id` (fk) — the authenticated employee
- `restaurant_id_at_signing` (fk) — which location the employee was assigned to when they signed
- `role_at_signing` (enum: "employee", "manager", "admin") — the role they held when signing
- `employee_name_typed` (text) — full legal name as typed
- `acknowledgment_text_signed` (text) — frozen copy of the acknowledgment statement
- `content_hash` (text) — SHA-256 of the policy content at time of signing
- `signed_at` (timestamp)

### `handbook_signatures`
- `id` (uuid, pk)
- `restaurant_id` (fk)
- `handbook_version` (int)
- `user_id` (fk)
- `employee_name_typed` (text)
- `content_hash` (text)
- `signed_at` (timestamp)

---

## API Endpoints

- `GET /api/handbook/sections?restaurant=` — returns handbook sections for reading view
- `POST /api/handbook/sign` — submit handbook master acknowledgment
- `GET /api/handbook/signature-status` — check if current user has signed current version
- `GET /api/policies?restaurant=` — list all active policies for a restaurant
- `GET /api/policies/:id` — single policy full content
- `POST /api/policies/:id/sign` — submit digital signature for a policy
- `GET /api/policies/signature-status?restaurant=` — all policies + signed/unsigned for current user
- `GET /api/policies/compliance?restaurant=` — compliance dashboard data (manager+)
- `POST /api/policies` — create policy (admin)
- `PATCH /api/policies/:id` — edit policy, auto-bump version (admin)
- `GET /api/policies/compliance/export?restaurant=&format=csv|pdf` — export signature records (admin)

---

## Screens to Build

1. **Handbook reading view** (responsive, TOC, search, section deep links)
2. **Handbook master acknowledgment** (signature block at bottom)
3. **Policy list view** (cards with signed/unsigned badges, progress bar)
4. **Policy reading view** (responsive, consistent 4-section layout)
5. **Policy digital signature block** (per-policy, typed name + checkbox)
6. **Chatbot "Ask" sub-tab** (relocated from Tab 1, personality upgrade via system prompt)
7. **Manager compliance dashboard** (by employee, by policy, summary bar)
8. **Admin cross-restaurant compliance view**
9. **Admin policy editor** (add/edit policies per restaurant)
10. **New hire unsigned-policies banner** (persistent across all tabs)

All screens EN/ES.

---

## Phased Build

### Phase 1 — v1 (ship first, ~1.5–2 day build)
- Supabase tables + RLS
- Policy content entry (admin enters Boru's 9 policies, cross-referenced against current handbook wording)
- Policy reading view (responsive)
- Digital signature flow per policy
- Policy list with signed/unsigned badges + progress bar
- Handbook reading view (sections from existing RAG content, restructured)
- Handbook master acknowledgment signature
- Chatbot relocated to "Ask" sub-tab
- Chatbot system prompt upgrade (personalized, conversational, uses employee name)
- Manager compliance dashboard (by employee + by policy)
- New hire unsigned-policies banner

### Phase 2 — fast follow
- Ichiban, Shokudo, Central Hub policy sets (cloned from Boru, edited per location)
- Policy version bump + automatic re-acknowledgment flagging
- "Send reminder" nudge from compliance dashboard
- Cross-restaurant compliance view for admin
- Export signature records to CSV/PDF
- Search within handbook

### Phase 3 — future
- Hard-block option (block portal access until all policies signed)
- WHG Standard template system (push policy updates across locations)
- Manager handbook reading view
- Policy change diff view (show employees what changed between versions)

---

## Acceptance Criteria (v1)

- [ ] Handbook renders as reflowable text on phone, tablet, and desktop — no pinch-zoom needed
- [ ] Text size is comfortable and readable on all three form factors
- [ ] Table of contents navigates to correct sections
- [ ] Each of the 9 employee policies renders in the consistent 4-section format
- [ ] Each of the 7 manager policies renders in the same format and is visible only to managers
- [ ] Managers see 16 policies total in their Policies sub-tab (9 employee + 7 manager), grouped by tier
- [ ] Employees see 9 policies total in their Policies sub-tab
- [ ] Employee can sign each policy individually with typed name + checkbox
- [ ] Signature records include: user_id, typed name, policy version, content hash, restaurant at signing, role at signing, timestamp
- [ ] Signed policies show green checkmark badge; unsigned show orange flag
- [ ] Handbook master acknowledgment covers both the handbook and legacy Policy #10
- [ ] Manager compliance dashboard shows per-employee and per-policy breakdowns grouped by tier
- [ ] Chatbot uses the employee's first name in responses
- [ ] Chatbot rephrases handbook content conversationally (not verbatim)
- [ ] Chatbot is aware of the employee's restaurant context
- [ ] New hire banner appears on all tabs when policies are unsigned
- [ ] All screens work in English and Spanish
- [ ] Policy content reflects current WHG Handbook v4.0 wording, not the older Boru Policies PDF wording
- [ ] Dress Code policy does NOT contain uniform specifics (those live in per-restaurant training manuals)

---

## Open Questions

1. **Handbook content format**: The handbook was ingested as RAG chunks for the chatbot. Do we also have the full handbook as a structured document (Google Doc, Word doc) that we can break into sections for the reading view? Or do we need to reconstruct it from the RAG chunks?
2. **Spanish handbook**: Is there a Spanish version of the full handbook, or just the chatbot responses in Spanish? The reading view needs the full text in both languages.
3. **Policy #10 overlap**: Policy #10 (Acknowledgment of Employee Handbook) and the Handbook master acknowledgment are essentially the same thing. Recommend merging them into one signature event on the Handbook sub-tab and showing it as "signed" in the Policies list automatically. Agree?

-- ============================================================
-- WHG TEAM PORTAL — PAYCHEX FLOW SPLIT + MANAGER INSTRUCTIONS
-- The original "Complete Paychex onboarding" checklist item
-- bundled three distinct actions (manager invite, employee
-- completes online, manager verifies I-9 in person) into one
-- checkbox, which hid the workflow.
--
-- This migration:
--   1) Adds `manager_instructions` column for manager-only steps
--      (renders only when a manager opens the hire's checklist).
--   2) Deactivates the bundled item (kept for audit/historical
--      signatures — not deleted).
--   3) Inserts 4 separate sequenced items:
--        2a — Manager: send Paychex invite (manager-only)
--        2b — Complete Paychex onboarding online (employee)
--        2c — Bring 2 forms of ID to first shift (both)
--        2d — Manager: verify I-9 documents in person (manager-only)
--   4) Reorders so the Paychex bundle runs as a contiguous block
--      at the top of the Paperwork section.
--   5) Demotes "Download the 7shifts app" by bumping its sort,
--      adds Paychex Flex app download links onto the same item,
--      and renames it to "Download the apps you'll use."
--
-- Idempotent — re-running won't duplicate.
-- ============================================================

-- 1) New column for manager-only guidance text on each item.
alter table onboarding_checklist_items
  add column if not exists manager_instructions text;

-- 2) Deactivate the legacy bundled item — preserves any existing
--    progress rows for audit/history but hides it from new hires.
update onboarding_checklist_items
set active = false
where title = 'Complete Paychex onboarding'
  and restaurant_id is null;

-- 3) Insert the 4 new items.

-- 2a — MANAGER: SEND PAYCHEX INVITE
insert into onboarding_checklist_items (
  section, sort_order, restaurant_id, applies_to, title, description,
  requires_employee_check, requires_manager_check, manager_instructions
)
select
  'paperwork', 110, null, 'all',
  'Manager: send Paychex onboarding invite',
  'Your manager kicks off your paperwork by sending you a Paychex onboarding invite. Once they do, you''ll get an email from Paychex with a link to complete the rest online.',
  false,
  true,
  $MGR$Send the Paychex onboarding invite so the employee can start their paperwork.

How to send the invite:
1. Log into Paychex Flex Admin (admin.paychexflex.com).
2. People → Add Employee.
3. Fill in the basics: legal name, date of birth, SSN, address, hire date, pay rate, department.
4. Trigger the **self-service invite** — Paychex emails the employee a link to complete onboarding online (direct deposit, W-4, I-9 Section 1, state tax forms).
5. Confirm with the employee they received the email — sometimes it lands in spam.

Once sent, mark this item complete.$MGR$
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Manager: send Paychex onboarding invite' and restaurant_id is null
);

-- 2b — COMPLETE PAYCHEX ONBOARDING (EMPLOYEE)
insert into onboarding_checklist_items (
  section, sort_order, restaurant_id, applies_to, title, description,
  requires_employee_check, requires_manager_check, manager_instructions
)
select
  'paperwork', 112, null, 'all',
  'Complete your Paychex onboarding online',
  'After you get the email from Paychex, click the link and complete:
- Direct deposit setup (have your bank routing + account numbers ready)
- W-4 form (federal tax withholding)
- State tax forms
- I-9 Section 1 (you fill in your info — your manager will verify your documents in person, see next item)

You can do this on your phone or a computer. Set aside about 15 minutes.',
  true,
  true,
  $MGR$Once the employee finishes their Section 1 + W-4 + direct deposit in Paychex, you''ll see a notification in Paychex Flex Admin. Confirm completion there before checking this item.$MGR$
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Complete your Paychex onboarding online' and restaurant_id is null
);

-- 2c — BRING 2 FORMS OF ID (EMPLOYEE-FACING REMINDER)
insert into onboarding_checklist_items (
  section, sort_order, restaurant_id, applies_to, title, description,
  requires_employee_check, requires_manager_check, manager_instructions
)
select
  'paperwork', 114, null, 'all',
  'Bring 2 forms of ID for I-9 verification at your first shift',
  'Federal law requires us to verify your work authorization in person at your first shift. Bring **original documents** — photocopies and phone photos don''t count.

You need EITHER:
- **One List A document** (covers both identity AND work authorization):
   • US Passport or Passport Card
   • Permanent Resident Card (Green Card)
   • Employment Authorization Document

OR

- **One List B** (identity) PLUS **one List C** (work authorization):
   • List B examples: Driver''s license, state ID card
   • List C examples: Social Security card, US birth certificate, Certification of birth abroad

Your manager will photograph the documents to upload to Paychex and return the originals to you immediately.

Full federal list: https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents',
  true,
  true,
  $MGR$Confirm the employee brought the right documents at their first shift. If they didn''t, reschedule — federal law gives you 3 business days from the start date to complete I-9 verification.$MGR$
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Bring 2 forms of ID for I-9 verification at your first shift' and restaurant_id is null
);

-- 2d — MANAGER: VERIFY I-9 DOCUMENTS (MANAGER-ONLY)
insert into onboarding_checklist_items (
  section, sort_order, restaurant_id, applies_to, title, description,
  requires_employee_check, requires_manager_check, manager_instructions
)
select
  'paperwork', 116, null, 'all',
  'Manager: verify I-9 documents in person',
  'Your manager will inspect your documents at your first shift, photograph them with their phone, upload to Paychex, and hand the originals back to you.',
  false,
  true,
  $MGR$Federal law requires you (the employer''s authorized representative) to verify the employee''s I-9 documents within 3 business days of their first day. Skipping or delaying this = I-9 violation, which carries fines per occurrence.

At the employee''s first shift:

**1. Inspect originals in person.** Hold the actual documents in your hands. Photocopies, phone photos, or expired documents do NOT satisfy the federal requirement.

**2. Take clear, well-lit photos of each document with your phone.** Both sides if the document is two-sided (driver''s license, Permanent Resident Card). Make sure all corners are visible and text is legible.

**3. Open Paychex Flex (app or admin web) → the employee''s record → I-9 Form → Section 2.**

**4. Fill out Section 2:**
   - Document title (e.g. "Driver''s License" / "Social Security Card")
   - Issuing authority (e.g. "Louisiana DMV" / "Social Security Administration")
   - Document number
   - Expiration date (if applicable — SS cards have no expiration)
   - Upload the photos you just took

**5. Sign and date Section 2** as the employer''s authorized representative.

**6. Return the original documents to the employee immediately.** Never keep originals. Never hold a document "as security" — federal law prohibits this.

**7. Check this item complete only after Paychex Section 2 is fully submitted.**

If the employee couldn''t produce 2 acceptable documents at their first shift, you have 3 business days to get it resolved. After that, they cannot legally continue working.

Acceptable documents list: https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents$MGR$
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Manager: verify I-9 documents in person' and restaurant_id is null
);

-- 4) Demote "Download the 7shifts app" to later in the section + rebrand it
--    as "Download the apps you'll use" and add Paychex Flex links to it.
update onboarding_checklist_items
set
  title = 'Download the apps you''ll use',
  description = 'Install these on your phone so you have everything you need at your fingertips:

- **Paychex Flex** — view paystubs, request time off, update your W-4
- **7shifts** — your schedule, time clock, shift swaps, manager messages

Both are free and take 30 seconds to install. Use the links below.',
  sort_order = 185
where title = 'Download the 7shifts app'
  and restaurant_id is null;

-- Add Paychex app links onto the now-renamed item (idempotent).
insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download Paychex Flex (iPhone)',
  'https://apps.apple.com/us/app/paychex-flex/id849294359',
  'app_store', 30
from onboarding_checklist_items i
where i.title = 'Download the apps you''ll use'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://apps.apple.com/us/app/paychex-flex/id849294359'
  );

insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download Paychex Flex (Android)',
  'https://play.google.com/store/apps/details?id=com.paychex.flex',
  'play_store', 40
from onboarding_checklist_items i
where i.title = 'Download the apps you''ll use'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://play.google.com/store/apps/details?id=com.paychex.flex'
  );

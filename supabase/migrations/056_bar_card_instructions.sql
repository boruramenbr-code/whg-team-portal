-- ============================================================
-- WHG TEAM PORTAL — BAR CARD INSTRUCTIONS
-- Replaces the bar card checklist item's minimal description with
-- a full how-to: 45-day deadline, ATC-approved course providers,
-- cost, what to bring back to manager. Adds direct links to the
-- 4 approved Louisiana RV training providers.
--
-- Also rewrites manager_instructions with the compliance flow:
-- verify before first alcohol shift, photograph and upload, track
-- expiration, escalation if past deadline.
--
-- Idempotent.
-- ============================================================

update onboarding_checklist_items
set
  title = 'Get your Louisiana Bar Card (Responsible Vendor Permit)',
  description = $EMP$Required for anyone who serves, sells, or handles alcohol — servers, bartenders, and FOH managers. Louisiana law gives you **45 days from your hire date** to get yours.

**How to get it — takes about 2 hours and costs $10–$25:**

1. Sign up for an ATC-approved Responsible Vendor course (links below).
2. Complete the online or in-person training. It covers checking IDs, signs of intoxication, Louisiana alcohol laws, and refusal of service.
3. Pass the short exam at the end.
4. Download your permit immediately. The official Louisiana ATC permit follows by email shortly after.
5. Print your physical card and bring it to your manager. They will photograph it and upload it to your employee file. They return the original to you to keep — the permit belongs to YOU, not the restaurant.

**Important:**

- You must be **18 or older** to serve alcohol in Louisiana.
- The permit is good for **4 years** — keep a digital copy of your certificate too.
- You can start working before you have it, but you cannot serve, pour, or ring up alcohol shifts until your card is on file with us.$EMP$,
  manager_instructions = $MGR$Every server, bartender, and FOH manager handling alcohol must have a current Louisiana Responsible Vendor permit on file. Louisiana ATC inspections are unannounced — missing or expired cards mean fines for the restaurant.

**Your responsibilities at each stage:**

1. **At hire:** Walk the new hire through the bar card requirement on day one. Give them the 45-day deadline (track it — Mission Control will alert you 30 days before). Point them to the provider links on this item.

2. **Before their first alcohol shift:** Confirm the card is on file. Do NOT let them serve, pour, or ring up alcohol until you have verified the permit.

3. **At upload:** Inspect the physical card in person before uploading:
   - Name matches their W-4 / I-9 documents
   - Permit is not expired (4-year validity)
   - Permit number is legible

4. **Upload via Admin → People → Bar Cards.** Photograph the card, enter the expiration date, save. Return the original card to the employee — never keep it.

5. **Ongoing:** Mission Control surfaces expiration alerts at 30, 14, and 7 days out. Renewal is the employee's responsibility, but reminders are yours.

**If past the 45-day deadline:** The employee can no longer handle alcohol. Either reassign their duties (host, food runner, BOH) or end employment. State law is unforgiving on this.

Official ATC reference: https://atc.louisiana.gov/permits/responsible-vendor-information/$MGR$
where title = 'Get your Louisiana Permit #A Bar Card'
  and restaurant_id is null;

-- Seed direct links to the 4 approved Louisiana RV training providers.
-- All scoped applies_to='foh' (matches the parent item's category).
do $$
declare
  v_item_id uuid;
begin
  select id into v_item_id from onboarding_checklist_items
    where title = 'Get your Louisiana Bar Card (Responsible Vendor Permit)'
      and restaurant_id is null;
  if v_item_id is null then return; end if;

  -- LACT (Louisiana Alcohol Council Training) — most common
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'LACT — Online Course', 'https://lactclass.com/', 'web', 'foh', 10
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://lactclass.com/'
  );

  -- L&K Bar Card Training
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'L&K Bar Card Training', 'https://lkbarcard.com/', 'web', 'foh', 20
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://lkbarcard.com/'
  );

  -- LAResponsibleVendor.com — mobile-friendly
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'LAResponsibleVendor (mobile)', 'https://m.laresponsiblevendor.com/', 'web', 'foh', 30
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://m.laresponsiblevendor.com/'
  );

  -- Official ATC info / approved provider list
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'Louisiana ATC — Official Info', 'https://atc.louisiana.gov/permits/responsible-vendor-information/', 'web', 'foh', 40
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://atc.louisiana.gov/permits/responsible-vendor-information/'
  );
end $$;

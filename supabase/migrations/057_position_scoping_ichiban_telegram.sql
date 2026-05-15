-- ============================================================
-- WHG TEAM PORTAL — POSITION-LEVEL SCOPING + ICHIBAN TELEGRAM
-- Adds finer-grained scoping than category (FOH/BOH/MGMT). Some
-- groups at Ichiban target specific positions (Hosts only,
-- Bartenders only, Server+Busser+Bartender). Adds:
--
--   profiles.position_slug                — e.g. 'host', 'bartender'
--   onboarding_checklist_links.position_slugs (text[])
--                                         — null = no position filter
--                                         — array = only those positions
--
-- A user sees a link if BOTH:
--   • Their onboarding_category matches the link's applies_to
--     (or applies_to='all')
--   • Either the link has no position_slugs filter (null/empty),
--     OR their position_slug is in the link's position_slugs array
--
-- Seeds Ichiban's 8 Telegram group invites.
--
-- Idempotent.
-- ============================================================

-- 1) Schema additions
alter table profiles
  add column if not exists position_slug text;

alter table onboarding_checklist_links
  add column if not exists position_slugs text[];

-- 2) Seed Ichiban's per-restaurant join item + 8 scoped invite links
do $$
declare
  v_ichiban_id uuid;
  v_item_id uuid;
begin
  select id into v_ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  if v_ichiban_id is null then return; end if;

  -- Get-or-create the per-restaurant item
  select id into v_item_id from onboarding_checklist_items
    where title = 'Join your Ichiban Telegram groups' and restaurant_id = v_ichiban_id;

  if v_item_id is null then
    insert into onboarding_checklist_items (
      section, sort_order, restaurant_id, applies_to, title, description
    ) values (
      'paperwork', 152, v_ichiban_id, 'all',
      'Join your Ichiban Telegram groups',
      'Tap each link below to join. Only the groups you belong in will show — your manager picks your position when you''re hired. If you''re missing a group you think you should be in, message your manager.'
    )
    returning id into v_item_id;
  end if;

  -- Universal: Announcements
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'Ichiban Announcements', 'https://t.me/+tElN-j6tz5g0MWNh', 'telegram', 'all', null, 10
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+tElN-j6tz5g0MWNh'
  );

  -- Universal: Everyone
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'Everyone — Ichiban', 'https://t.me/+JhDQmn_ZuiE1OTg5', 'telegram', 'all', null, 20
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+JhDQmn_ZuiE1OTg5'
  );

  -- All FOH: general FOH group
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'FOH — Ichiban', 'https://t.me/+jljWifrPPYkyOTIx', 'telegram', 'foh', null, 30
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+jljWifrPPYkyOTIx'
  );

  -- Hosts only
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'Host — Ichiban', 'https://t.me/+R1XmMNOnUoI1YWNh', 'telegram', 'foh', ARRAY['host']::text[], 40
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+R1XmMNOnUoI1YWNh'
  );

  -- Server / Busser / Bartender combined group
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'Servers, Bussers, Bartenders — Ichiban', 'https://t.me/+3Yn-lCZiemw5MjMx', 'telegram', 'foh',
    ARRAY['server', 'busser', 'bartender']::text[], 50
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+3Yn-lCZiemw5MjMx'
  );

  -- Bartenders only
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'Bartenders — Ichiban', 'https://t.me/+EawiwbgVZstiYzdh', 'telegram', 'foh', ARRAY['bartender']::text[], 60
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+EawiwbgVZstiYzdh'
  );

  -- All BOH
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'BOH — Ichiban', 'https://t.me/+_ow-BxHm4AA1NDk5', 'telegram', 'boh', null, 70
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+_ow-BxHm4AA1NDk5'
  );

  -- Management
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, position_slugs, sort_order)
  select v_item_id, 'Management — Ichiban', 'https://t.me/+K6Rq3rnWB481MzEx', 'telegram', 'mgmt', null, 80
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id and l.url = 'https://t.me/+K6Rq3rnWB481MzEx'
  );
end $$;

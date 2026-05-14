-- ============================================================
-- WHG TEAM PORTAL — TELEGRAM GROUP SCOPED LINKS
-- Scopes individual action links on a checklist item by category
-- (all / foh / boh / mgmt) so a single "Join your [Restaurant]
-- Telegram groups" item can hold every group invite and the widget
-- shows each hire only the links that apply to them.
--
-- Also:
--   • Renames the master Telegram item to focus on installation only.
--   • Seeds the Boru per-restaurant join item with 5 scoped invite
--     links (Announcements, Everyone, FOH, BOH, Management).
--
-- Ichiban / Shokudo / Central Hub: seeded later, once Randy provides
-- their group invite URLs.
--
-- Idempotent.
-- ============================================================

-- 1) Add applies_to scope to links.
alter table onboarding_checklist_links
  add column if not exists applies_to text not null default 'all'
    check (applies_to in ('all', 'foh', 'boh', 'mgmt'));

-- 2) Rename + retitle the master Telegram item so it focuses on
--    installation. Group invites live on per-restaurant items below.
update onboarding_checklist_items
set
  title = 'Install Telegram on your phone',
  description = 'We use Telegram for all team communication — daily announcements, schedule changes, and your position group. Install it first; the next item gives you the links to join your groups.'
where title = 'Install Telegram and join your groups'
  and restaurant_id is null;

-- 3) Seed Boru's per-restaurant join item + 5 scoped invite links.
do $$
declare
  v_boru_id uuid;
  v_item_id uuid;
begin
  select id into v_boru_id from restaurants where lower(name) like 'boru%' limit 1;
  if v_boru_id is null then return; end if;

  -- Get-or-create the per-restaurant item
  select id into v_item_id from onboarding_checklist_items
    where title = 'Join your Boru Telegram groups' and restaurant_id = v_boru_id;

  if v_item_id is null then
    insert into onboarding_checklist_items (
      section, sort_order, restaurant_id, applies_to, title, description
    ) values (
      'paperwork', 152, v_boru_id, 'all',
      'Join your Boru Telegram groups',
      'Tap each link below to join. Only the groups you belong in will show — your manager picks your category (FOH, BOH, or Management) when you''re hired. If you''re missing a group you think you should be in, message your manager.'
    )
    returning id into v_item_id;
  end if;

  -- Insert the 5 invite links. Each is idempotent via WHERE NOT EXISTS.

  -- Universal: Announcements
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'Boru Announcements', 'https://t.me/+mywBFzeI1uk0ZTI5', 'telegram', 'all', 10
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id
      and l.url = 'https://t.me/+mywBFzeI1uk0ZTI5'
  );

  -- Universal: Everyone
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'Everyone — Boru', 'https://t.me/+HvHuXzfclCY3Y2Ex', 'telegram', 'all', 20
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id
      and l.url = 'https://t.me/+HvHuXzfclCY3Y2Ex'
  );

  -- FOH only
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'FOH — Boru', 'https://t.me/+OTuyg2rmnVZhYTAx', 'telegram', 'foh', 30
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id
      and l.url = 'https://t.me/+OTuyg2rmnVZhYTAx'
  );

  -- BOH only
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'BOH — Boru', 'https://t.me/+XANXOTiaNL4zZDc5', 'telegram', 'boh', 40
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id
      and l.url = 'https://t.me/+XANXOTiaNL4zZDc5'
  );

  -- Management only
  insert into onboarding_checklist_links (item_id, label, url, link_type, applies_to, sort_order)
  select v_item_id, 'Management — Boru', 'https://t.me/+pEZD-c9z4w1lODAx', 'telegram', 'mgmt', 50
  where not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = v_item_id
      and l.url = 'https://t.me/+pEZD-c9z4w1lODAx'
  );
end $$;

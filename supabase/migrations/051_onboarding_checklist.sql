-- ============================================================
-- WHG TEAM PORTAL — ONBOARDING CHECKLIST
-- Digital replacement for the paper "New Hire Checklist" with:
--   • Master items shared across all restaurants
--   • Restaurant-scoped items (e.g. uniform varies per location)
--   • Category-scoped items via applies_to ('all', 'foh', 'boh', 'mgmt')
--   • Dual-check rows (employee initials + manager initials)
--   • Auto-tracking: certain items get auto-checked on the employee
--     column when the matching portal event happens (policy signed,
--     Our Story acknowledged, bar card uploaded, welcome dismissed).
--   • Inline action links per item (Telegram joins, App Store, etc.)
--
-- Idempotent — re-running refreshes seed content without dropping data.
-- ============================================================

-- 1) TABLES ---------------------------------------------------

create table if not exists onboarding_checklist_items (
  id uuid primary key default gen_random_uuid(),
  section text not null
    check (section in ('paperwork', 'training', 'first_week', 'ongoing')),
  sort_order int not null default 100,
  restaurant_id uuid references restaurants(id) on delete cascade,    -- null = all
  applies_to text not null default 'all'
    check (applies_to in ('all', 'foh', 'boh', 'mgmt')),
  title text not null,
  description text,
  -- If set, the EMPLOYEE column auto-checks when the matching event happens.
  auto_track_source text
    check (auto_track_source in (
      'policy_signatures_any',
      'policy_signatures_all',
      'handbook_signed',
      'our_story_ack',
      'bar_card_uploaded',
      'welcome_dismissed'
    )),
  requires_employee_check boolean not null default true,
  requires_manager_check boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_items_active_idx
  on onboarding_checklist_items (active, restaurant_id, applies_to, section, sort_order);

-- Action links shown inline on each item (Join Telegram, Download Paychex, etc.)
create table if not exists onboarding_checklist_links (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references onboarding_checklist_items(id) on delete cascade,
  label text not null,
  url text not null,
  link_type text not null default 'web'
    check (link_type in ('telegram', 'app_store', 'play_store', 'web', 'video', 'pdf')),
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_links_item_idx
  on onboarding_checklist_links (item_id, sort_order);

-- Per-employee progress on each checklist item.
create table if not exists employee_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references onboarding_checklist_items(id) on delete cascade,
  employee_checked_at timestamptz,
  manager_checked_at timestamptz,
  manager_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists onboarding_progress_user_idx
  on employee_onboarding_progress (user_id);

-- profile.onboarding_category — which item bucket this new hire belongs to.
-- Set during Add Member / Bulk Import; admin can change later.
alter table profiles
  add column if not exists onboarding_category text
    check (onboarding_category in ('foh', 'boh', 'mgmt'));

-- 2) RLS ------------------------------------------------------

alter table onboarding_checklist_items enable row level security;
alter table onboarding_checklist_links enable row level security;
alter table employee_onboarding_progress enable row level security;

-- Items + links readable by any authenticated user (they need to see their own list).
drop policy if exists "onboarding_items_read_all" on onboarding_checklist_items;
create policy "onboarding_items_read_all"
  on onboarding_checklist_items for select to authenticated using (true);

drop policy if exists "onboarding_links_read_all" on onboarding_checklist_links;
create policy "onboarding_links_read_all"
  on onboarding_checklist_links for select to authenticated using (true);

-- Items + links writable by managers/admins only.
drop policy if exists "onboarding_items_write_mgmt" on onboarding_checklist_items;
create policy "onboarding_items_write_mgmt"
  on onboarding_checklist_items for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

drop policy if exists "onboarding_links_write_mgmt" on onboarding_checklist_links;
create policy "onboarding_links_write_mgmt"
  on onboarding_checklist_links for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

-- Progress: user reads/writes their own row; managers/admins read/write any.
drop policy if exists "onboarding_progress_read_own_or_mgmt" on employee_onboarding_progress;
create policy "onboarding_progress_read_own_or_mgmt"
  on employee_onboarding_progress for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

drop policy if exists "onboarding_progress_write_own_or_mgmt" on employee_onboarding_progress;
create policy "onboarding_progress_write_own_or_mgmt"
  on employee_onboarding_progress for all to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

-- 3) SEED — MASTER ITEMS (shared across all restaurants) ----
-- Idempotent via WHERE NOT EXISTS pattern.

-- ── PAPERWORK ──────────────────────────────────────────────
insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 100, null, 'all',
  'Complete employment application',
  'Sign the WHG employment application — your manager will hand you the form on day one.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Complete employment application' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 110, null, 'all',
  'Complete Paychex onboarding',
  'Watch for an email invite from Paychex to set up direct deposit, W-4, I-9, and upload your ID + Social Security card. Download the Paychex Flex app to your phone.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Complete Paychex onboarding' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 120, null, 'all',
  'Sign the WHG Team Handbook',
  'Read the handbook in the Handbook tab and sign the acknowledgment.',
  'handbook_signed'
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Sign the WHG Team Handbook' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 130, null, 'all',
  'Sign all required policies',
  'Go through every policy in the Policies tab and finger-sign each one.',
  'policy_signatures_all'
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Sign all required policies' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 140, null, 'all',
  'Download the 7shifts app',
  'Accept the email/text invite from 7shifts and download the app — this is where you see your schedule and clock in.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Download the 7shifts app' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 150, null, 'all',
  'Install Telegram and join your groups',
  'Telegram is how the team communicates day-to-day — announcements, schedule changes, and your position group. Download Telegram, then tap each group link below to join.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Install Telegram and join your groups' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 160, null, 'foh',
  'Get your Louisiana Permit #A Bar Card',
  'Required for anyone serving alcohol (servers, bartenders, FOH managers). Upload your card in the Bar Card tab once you have it.',
  'bar_card_uploaded'
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Get your Louisiana Permit #A Bar Card' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 170, null, 'all',
  'Receive your new hire welcome bag',
  'Your manager will hand you a welcome bag with your uniform basics, name tag, and any printed materials.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Receive your new hire welcome bag' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'paperwork', 180, null, 'all',
  'Review your job description',
  'Open the Positions tab and read the full description for your role — duties, expectations, standards.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Review your job description' and restaurant_id is null
);

-- ── TRAINING ───────────────────────────────────────────────
insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 200, null, 'all',
  'Meet the management team',
  'Your manager will walk you around and introduce you to the leadership team — manager, assistant manager, kitchen manager.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Meet the management team' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 210, null, 'all',
  'Review Our Story, Mission & Values',
  'Read the Our Story section so you understand who we are, what we stand for, and why it matters.',
  'our_story_ack'
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Review Our Story, Mission & Values' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 220, null, 'all',
  'Watch staff training videos 1–5',
  'Located in the Telegram training groups. Watch them on your own time before your first floor shift.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Watch staff training videos 1–5' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 230, null, 'all',
  'Watch position-specific training video',
  'Server, host, bartender, BOH — find the video for your role in the Telegram training group.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Watch position-specific training video' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 240, null, 'foh',
  'Menu training — dishes, ingredients, prices, modifications',
  'Know every item on the menu. Your manager will quiz you before you take a table on your own.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Menu training — dishes, ingredients, prices, modifications' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 250, null, 'all',
  'Allergy awareness training',
  'Common allergens (shellfish, soy, gluten, sesame, peanuts, eggs) and how to handle a guest with an allergy.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Allergy awareness training' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 260, null, 'all',
  'POS system training',
  'Hands-on training in our point-of-sale system (Toast or Shift4 depending on your restaurant).',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'POS system training' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 270, null, 'foh',
  'Table service training',
  'Greeting guests, taking orders, food running, table maintenance, check presentation.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Table service training' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 280, null, 'foh',
  'Beverage knowledge — beer, wine, sake, cocktails',
  'Categories, prices, food pairings. Bartenders go deeper — recipes, builds, garnishes.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Beverage knowledge — beer, wine, sake, cocktails' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 290, null, 'all',
  'Customer service training',
  'How we handle complaints, special requests, and tough guests — the WHG way.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Customer service training' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 300, null, 'all',
  'Food safety & sanitation training',
  'Hand washing, glove use, temperature logs, FIFO, cross-contamination, sushi-grade fish handling.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Food safety & sanitation training' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 310, null, 'boh',
  'Chemical safety training',
  'How to use sanitizer correctly, where chemicals are stored, what to do if a chemical gets in your eyes.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Chemical safety training' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 320, null, 'all',
  'Shadow trainer shifts',
  'Number of shifts shadowing a trainer is set by your manager based on your role. Manager logs each completed shift.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Shadow trainer shifts' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'training', 330, null, 'all',
  'Observed by manager/trainer',
  'Number of shifts being observed by a manager before flying solo is set by your manager.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Observed by manager/trainer' and restaurant_id is null
);

-- ── FIRST WEEK ─────────────────────────────────────────────
insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 400, null, 'all',
  'Introduced to all team members',
  'Manager walks you around to meet everyone on your first shift.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Introduced to all team members' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 410, null, 'all',
  'Assigned to a section or station',
  'Manager assigns your section (FOH) or station (BOH) at the start of each shift.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Assigned to a section or station' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 420, null, 'foh',
  'Provided with FOH tools',
  'Order pad, pen, server apron, wine key.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Provided with FOH tools' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 430, null, 'boh',
  'Provided with BOH gear',
  'Hat, hairnet, apron, knife (if you bring your own, manager will note it).',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Provided with BOH gear' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 440, null, 'all',
  'Review daily specials and promotions',
  'Before each shift, manager reviews the day''s specials, 86''d items, and promotions.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Review daily specials and promotions' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 450, null, 'all',
  'Observe opening / closing procedures',
  'Shadow an opener and a closer (via 7tasks). Know what gets done before doors open and after the last guest leaves.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Observe opening / closing procedures' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 460, null, 'boh',
  'Observe prep lists and station setups',
  'Shadow the prep cook through a full prep cycle so you understand the par levels for every station.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'Observe prep lists and station setups' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'first_week', 470, null, 'all',
  'First-week performance check-in',
  'Brief sit-down with your manager at the end of your first full week to discuss how it''s going.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = 'First-week performance check-in' and restaurant_id is null
);

-- ── ONGOING ────────────────────────────────────────────────
insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'ongoing', 500, null, 'all',
  '30-day performance review',
  'Sit-down with your manager at the 30-day mark to review progress, address any issues, set goals.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = '30-day performance review' and restaurant_id is null
);

insert into onboarding_checklist_items
  (section, sort_order, restaurant_id, applies_to, title, description, auto_track_source)
select 'ongoing', 510, null, 'all',
  '90-day performance review',
  'End of your introductory period — review with your manager.',
  null
where not exists (
  select 1 from onboarding_checklist_items
  where title = '90-day performance review' and restaurant_id is null
);

-- 4) SEED — PER-RESTAURANT UNIFORM ITEMS ---------------------
-- One row per (restaurant × category). Description holds the specific
-- uniform spec for that combination. Easy for managers to edit later.

do $$
declare
  ichiban_id uuid;
  boru_id uuid;
  shokudo_id uuid;
  central_id uuid;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  select id into boru_id from restaurants where lower(name) like 'boru%' limit 1;
  select id into shokudo_id from restaurants where lower(name) like 'shokudo%' limit 1;
  select id into central_id from restaurants where lower(name) like 'central%' limit 1;

  -- Ichiban — FOH
  if ichiban_id is not null then
    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, ichiban_id, 'foh',
      'Uniform issued — Ichiban FOH',
      'Black long-sleeve button-up shirt (Ichiban-issued). Black slacks, black non-slip shoes. Hair pulled back, minimal jewelry. Name tag worn at all times.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Ichiban FOH' and restaurant_id = ichiban_id
    );

    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, ichiban_id, 'boh',
      'Uniform issued — Ichiban BOH',
      'Ichiban T-shirt, kitchen hat, apron. Black slacks or pants, black non-slip shoes.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Ichiban BOH' and restaurant_id = ichiban_id
    );
  end if;

  -- Boru — FOH
  if boru_id is not null then
    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, boru_id, 'foh',
      'Uniform issued — Boru FOH',
      'Boru-branded black T-shirt, black slacks or pants, black non-slip shoes. Apron provided. Hair pulled back, name tag worn at all times.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Boru FOH' and restaurant_id = boru_id
    );

    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, boru_id, 'boh',
      'Uniform issued — Boru BOH',
      'Boru kitchen T-shirt, hat, apron. Black slacks or pants, black non-slip shoes.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Boru BOH' and restaurant_id = boru_id
    );
  end if;

  -- Shokudo — placeholder, Randy will refine
  if shokudo_id is not null then
    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, shokudo_id, 'foh',
      'Uniform issued — Shokudo FOH',
      '[Placeholder — to be finalized closer to launch] Shokudo-branded shirt, black slacks, black non-slip shoes, apron.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Shokudo FOH' and restaurant_id = shokudo_id
    );

    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, shokudo_id, 'boh',
      'Uniform issued — Shokudo BOH',
      '[Placeholder — to be finalized closer to launch] Shokudo kitchen T-shirt, hat, apron, black pants.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Shokudo BOH' and restaurant_id = shokudo_id
    );
  end if;

  -- Central Hub — placeholder
  if central_id is not null then
    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, central_id, 'foh',
      'Uniform issued — Central Hub FOH',
      '[Placeholder — to be finalized closer to launch] Central Hub branded shirt, black slacks, black non-slip shoes, apron.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Central Hub FOH' and restaurant_id = central_id
    );

    insert into onboarding_checklist_items
      (section, sort_order, restaurant_id, applies_to, title, description)
    select 'paperwork', 175, central_id, 'boh',
      'Uniform issued — Central Hub BOH',
      '[Placeholder — to be finalized closer to launch] Central Hub kitchen T-shirt, hat, apron, black pants.'
    where not exists (
      select 1 from onboarding_checklist_items
      where title = 'Uniform issued — Central Hub BOH' and restaurant_id = central_id
    );
  end if;
end $$;

-- 5) SEED — ACTION LINKS ON MASTER ITEMS ----------------------

-- Paychex — iOS + Android download links
insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download Paychex Flex (iPhone)',
  'https://apps.apple.com/us/app/paychex-flex/id849294359',
  'app_store', 10
from onboarding_checklist_items i
where i.title = 'Complete Paychex onboarding'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://apps.apple.com/us/app/paychex-flex/id849294359'
  );

insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download Paychex Flex (Android)',
  'https://play.google.com/store/apps/details?id=com.paychex.flex',
  'play_store', 20
from onboarding_checklist_items i
where i.title = 'Complete Paychex onboarding'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://play.google.com/store/apps/details?id=com.paychex.flex'
  );

-- 7shifts — iOS + Android
insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download 7shifts (iPhone)',
  'https://apps.apple.com/us/app/7shifts-employee-scheduling/id907365722',
  'app_store', 10
from onboarding_checklist_items i
where i.title = 'Download the 7shifts app'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://apps.apple.com/us/app/7shifts-employee-scheduling/id907365722'
  );

insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download 7shifts (Android)',
  'https://play.google.com/store/apps/details?id=com.shifts7.thirdgenapp',
  'play_store', 20
from onboarding_checklist_items i
where i.title = 'Download the 7shifts app'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://play.google.com/store/apps/details?id=com.shifts7.thirdgenapp'
  );

-- Telegram — iOS + Android download. Per-restaurant group invite links go in
-- as placeholders; Randy will update them via SQL or future admin UI.
insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download Telegram (iPhone)',
  'https://apps.apple.com/us/app/telegram-messenger/id686449807',
  'app_store', 10
from onboarding_checklist_items i
where i.title = 'Install Telegram and join your groups'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://apps.apple.com/us/app/telegram-messenger/id686449807'
  );

insert into onboarding_checklist_links (item_id, label, url, link_type, sort_order)
select i.id, 'Download Telegram (Android)',
  'https://play.google.com/store/apps/details?id=org.telegram.messenger',
  'play_store', 20
from onboarding_checklist_items i
where i.title = 'Install Telegram and join your groups'
  and i.restaurant_id is null
  and not exists (
    select 1 from onboarding_checklist_links l
    where l.item_id = i.id and l.url = 'https://play.google.com/store/apps/details?id=org.telegram.messenger'
  );

-- ============================================================
-- DONE. To customize:
--   • Update per-restaurant Telegram group invite URLs once
--     the groups exist (insert into onboarding_checklist_links
--     with item_id = the 'Install Telegram and join your groups'
--     item, scoped per restaurant via a separate item if needed).
--   • Refine uniform descriptions per location.
--   • Add restaurant-specific items by inserting rows with the
--     correct restaurant_id.
-- ============================================================

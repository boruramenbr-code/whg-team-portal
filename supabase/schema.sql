-- ============================================================
-- WHG TEAM PORTAL — SUPABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pgvector for AI embeddings
create extension if not exists vector;

-- ============================================================
-- TABLES
-- ============================================================

-- Restaurants
create table if not exists restaurants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Restaurant-specific policy overrides (e.g., different meal discounts)
create table if not exists restaurant_policies (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  policy_key    text not null,
  policy_value  text not null,
  created_at    timestamptz default now(),
  unique(restaurant_id, policy_key)
);

-- User profiles (extends Supabase auth.users)
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  restaurant_id uuid references restaurants(id),
  role          text not null default 'employee'
                  check (role in ('employee', 'manager', 'admin')),
  status        text not null default 'active'
                  check (status in ('active', 'archived')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Handbook chunks with vector embeddings (the AI brain)
create table if not exists handbook_chunks (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  embedding   vector(1536),
  source      text not null default 'employee'
                check (source in ('employee', 'manager')),
  section     text,
  chunk_index int,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- Vector similarity index for fast searches
create index if not exists handbook_chunks_embedding_idx
  on handbook_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Chat history
create table if not exists chat_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  question        text not null,
  answer          text not null,
  handbook_source text,
  created_at      timestamptz default now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

insert into restaurants (name, slug) values
  ('Ichiban Sushi', 'ichiban'),
  ('Boru Ramen',    'boru'),
  ('Shokudo',       'shokudo'),
  ('Central Hub',   'central-hub')
on conflict (slug) do nothing;

-- Boru: 50% on all food for on-scheduled meals
insert into restaurant_policies (restaurant_id, policy_key, policy_value)
select id, 'meal_discount',
  '50% off all food items for on-scheduled meals'
from restaurants where slug = 'boru'
on conflict (restaurant_id, policy_key) do nothing;

-- Ichiban: 50% on limited menu for on-scheduled meals
insert into restaurant_policies (restaurant_id, policy_key, policy_value)
select id, 'meal_discount',
  '50% off a limited menu for on-scheduled meals. See your manager for the approved items list.'
from restaurants where slug = 'ichiban'
on conflict (restaurant_id, policy_key) do nothing;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Vector similarity search — used by the chat API
create or replace function match_handbook_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count     int,
  source_filter   text default 'employee'
)
returns table (
  id         uuid,
  content    text,
  source     text,
  section    text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    source,
    section,
    1 - (embedding <=> query_embedding) as similarity
  from handbook_chunks
  where
    source = source_filter
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Auto-update updated_at timestamp on profiles
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles           enable row level security;
alter table restaurants        enable row level security;
alter table handbook_chunks    enable row level security;
alter table chat_history       enable row level security;
alter table restaurant_policies enable row level security;

-- Drop existing policies to avoid conflicts on re-run
drop policy if exists "users_view_own_profile"              on profiles;
drop policy if exists "managers_view_restaurant_profiles"   on profiles;
drop policy if exists "managers_insert_employees"           on profiles;
drop policy if exists "admins_insert_any_profile"           on profiles;
drop policy if exists "managers_update_employees"           on profiles;
drop policy if exists "view_active_restaurants"             on restaurants;
drop policy if exists "employees_read_employee_handbook"    on handbook_chunks;
drop policy if exists "admins_modify_handbook"              on handbook_chunks;
drop policy if exists "users_view_own_history"              on chat_history;
drop policy if exists "users_insert_own_history"            on chat_history;
drop policy if exists "view_restaurant_policies"            on restaurant_policies;

-- Profiles
create policy "users_view_own_profile"
  on profiles for select
  using (auth.uid() = id);

create policy "managers_view_restaurant_profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'admin')
        and (p.restaurant_id = profiles.restaurant_id or p.role = 'admin')
    )
  );

create policy "managers_insert_employees"
  on profiles for insert
  with check (
    role = 'employee'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "admins_insert_any_profile"
  on profiles for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "managers_update_employees"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'admin')
        and (p.restaurant_id = profiles.restaurant_id or p.role = 'admin')
    )
  );

-- Restaurants
create policy "view_active_restaurants"
  on restaurants for select
  to authenticated
  using (is_active = true);

-- Handbook chunks
create policy "employees_read_employee_handbook"
  on handbook_chunks for select
  to authenticated
  using (
    source = 'employee'
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "admins_modify_handbook"
  on handbook_chunks for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Chat history
create policy "users_view_own_history"
  on chat_history for select
  using (auth.uid() = user_id);

create policy "users_insert_own_history"
  on chat_history for insert
  with check (auth.uid() = user_id);

-- Restaurant policies
create policy "view_restaurant_policies"
  on restaurant_policies for select
  to authenticated
  using (true);

-- ============================================================
-- DONE
-- ============================================================
-- After running this schema, go to SETUP.md step 4.

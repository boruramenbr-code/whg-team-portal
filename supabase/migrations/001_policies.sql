-- ============================================================
-- WHG TEAM PORTAL — POLICIES & SIGNATURES MIGRATION
-- Handbook & Policies tab (v1.1 spec)
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- Policies master table
-- Holds both the Handbook master acknowledgment (title = 'WHG Team Handbook')
-- and each individual employee / manager policy.
create table if not exists policies (
  id                  uuid primary key default gen_random_uuid(),

  -- Null = WHG-wide policy (applies to all locations).
  -- Non-null = location-specific override (rarely used in v1).
  restaurant_id       uuid references restaurants(id) on delete cascade,

  -- Who is required to sign this policy.
  role_required       text not null default 'employee'
                        check (role_required in ('employee', 'manager', 'all')),

  -- Kind of record.
  --   'handbook'  — the master Handbook acknowledgment (only one active per restaurant_id)
  --   'policy'    — a standard signable policy
  kind                text not null default 'policy'
                        check (kind in ('handbook', 'policy')),

  title               text not null,
  purpose             text,
  details             text,            -- markdown allowed
  consequences        text,
  acknowledgment_text text not null,   -- the exact sentence the signer agrees to
  location_notes      text,            -- optional per-location overlay (nullable)

  version             int  not null default 1,
  effective_date      date not null default current_date,
  sort_order          int  not null default 0,
  active              boolean not null default true,

  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists policies_active_idx
  on policies (active, role_required, sort_order);

create index if not exists policies_restaurant_idx
  on policies (restaurant_id);

-- Policy signatures — immutable ledger of who signed what, when, at what version.
create table if not exists policy_signatures (
  id                         uuid primary key default gen_random_uuid(),

  policy_id                  uuid not null references policies(id) on delete restrict,
  policy_version             int  not null,

  user_id                    uuid not null references auth.users(id) on delete cascade,

  -- Snapshotted at time of signing so historical signatures remain meaningful
  -- even if the user later changes restaurant or role.
  restaurant_id_at_signing   uuid references restaurants(id),
  role_at_signing            text not null
                                check (role_at_signing in ('employee', 'manager', 'admin')),

  employee_name_typed        text not null,
  acknowledgment_text_signed text not null,
  content_hash               text not null,   -- SHA-256 of the canonical policy content

  signed_at                  timestamptz not null default now(),

  -- A user signs a given version of a policy exactly once.
  unique (policy_id, policy_version, user_id)
);

create index if not exists policy_signatures_user_idx
  on policy_signatures (user_id);

create index if not exists policy_signatures_policy_idx
  on policy_signatures (policy_id, policy_version);

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists policies_updated_at on policies;
create trigger policies_updated_at
  before update on policies
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table policies           enable row level security;
alter table policy_signatures  enable row level security;

drop policy if exists "policies_read_applicable"       on policies;
drop policy if exists "policies_admin_write"           on policies;
drop policy if exists "signatures_user_read_own"       on policy_signatures;
drop policy if exists "signatures_manager_read_site"   on policy_signatures;
drop policy if exists "signatures_user_insert_own"     on policy_signatures;

-- Policies — everyone authenticated can read policies that apply to them.
-- "Applies to them" = active AND (WHG-wide OR same restaurant) AND role matches.
create policy "policies_read_applicable"
  on policies for select
  to authenticated
  using (
    active = true
    and (
      restaurant_id is null
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and (p.restaurant_id = policies.restaurant_id or p.role = 'admin')
      )
    )
    and (
      role_required = 'all'
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and (
            p.role = 'admin'
            or (role_required = 'employee')
            or (role_required = 'manager' and p.role in ('manager','admin'))
          )
      )
    )
  );

-- Only admins can modify the policies catalog.
create policy "policies_admin_write"
  on policies for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Signatures — users read their own signatures.
create policy "signatures_user_read_own"
  on policy_signatures for select
  using (auth.uid() = user_id);

-- Managers/admins read signatures for their restaurant (compliance dashboard).
create policy "signatures_manager_read_site"
  on policy_signatures for select
  using (
    exists (
      select 1 from profiles me, profiles them
      where me.id   = auth.uid()
        and them.id = policy_signatures.user_id
        and me.role in ('manager', 'admin')
        and (me.role = 'admin' or me.restaurant_id = them.restaurant_id)
    )
  );

-- Users insert their own signatures only.
create policy "signatures_user_insert_own"
  on policy_signatures for insert
  with check (auth.uid() = user_id);

-- No update, no delete on signatures — immutable ledger.

-- ============================================================
-- DONE
-- ============================================================

-- ============================================================
-- WHG TEAM PORTAL — PRIVATE TIP TRACKER
-- Per-employee tip tracking. Stores one row per (user, date, shift)
-- with the employee's cash tip total for that shift.
--
-- Both restaurants pay credit card tips out as cash at end of shift,
-- so we only track a single "cash_tips" amount — no separate credit
-- card column, no tip-out column.
--
-- Privacy is paramount. STRICT owner-only Row Level Security:
--   • SELECT, INSERT, UPDATE, DELETE all require user_id = auth.uid()
--   • There is intentionally NO manager/admin override
--   • Even admins cannot see another employee's tip data through
--     the regular client. The only way to access another user's
--     tips would be via the service-role key, which is server-side
--     and only used for explicitly audited operations.
--
-- Idempotent.
-- ============================================================

create table if not exists tip_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  shift_date date not null,
  shift_type text not null
    check (shift_type in ('lunch', 'mid', 'dinner', 'other')),

  cash_tips numeric(10, 2) not null default 0
    check (cash_tips >= 0),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One entry per (user, date, shift_type). Lunch + dinner same day OK.
  unique (user_id, shift_date, shift_type)
);

create index if not exists tip_entries_user_date_idx
  on tip_entries (user_id, shift_date desc);

-- ── RLS ──────────────────────────────────────────────────────
alter table tip_entries enable row level security;

drop policy if exists "tip_entries_owner_select" on tip_entries;
create policy "tip_entries_owner_select"
  on tip_entries for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "tip_entries_owner_insert" on tip_entries;
create policy "tip_entries_owner_insert"
  on tip_entries for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tip_entries_owner_update" on tip_entries;
create policy "tip_entries_owner_update"
  on tip_entries for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tip_entries_owner_delete" on tip_entries;
create policy "tip_entries_owner_delete"
  on tip_entries for delete to authenticated
  using (user_id = auth.uid());

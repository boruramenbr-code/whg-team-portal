-- ============================================================
-- WHG TEAM PORTAL — POSITIONS + PAY RATES
-- Adds two tables:
--   positions          — role catalog with descriptions (visible to all staff)
--   position_pay_rates — starting pay per position per restaurant (manager+ read, admin write)
--
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent — safe to re-run.
-- ============================================================

-- ── positions ─────────────────────────────────────────────────
create table if not exists positions (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  emoji           text not null default '👤',

  -- 'FOH' (front of house), 'BOH' (back of house), 'Management'
  department      text not null check (department in ('FOH', 'BOH', 'Management')),

  -- Long-form description shown in the position-detail modal on the staff portal.
  -- Plain text (newline-separated paragraphs) — no markdown rendering yet.
  description     text,

  -- Display order within department. Lower = top of grid.
  sort_order      int not null default 100,

  active          boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists positions_dept_sort_idx on positions (department, sort_order);

alter table positions enable row level security;

drop policy if exists "positions_read" on positions;
create policy "positions_read"
  on positions for select
  to authenticated
  using (active = true);

drop policy if exists "positions_admin_write" on positions;
create policy "positions_admin_write"
  on positions for all
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ── position_pay_rates ─────────────────────────────────────────
create table if not exists position_pay_rates (
  id              uuid primary key default gen_random_uuid(),
  position_id     uuid not null references positions(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,

  -- Free-text so we can express things like "$13-14/hr", "$5/hr + 10% tipout",
  -- or "Salary plus benefits". Numerical analysis isn't the goal here.
  pay_rate        text not null,

  -- Optional notes (e.g., "*Part-time", "Tipout based on server tips")
  notes           text,

  effective_date  date not null default current_date,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (position_id, restaurant_id)
);

create index if not exists pay_rates_position_idx on position_pay_rates (position_id);
create index if not exists pay_rates_restaurant_idx on position_pay_rates (restaurant_id);

alter table position_pay_rates enable row level security;

-- Manager + admin + assistant_manager can read pay rates.
-- Regular employees cannot — pay scales are management-only reference.
drop policy if exists "pay_rates_manager_read" on position_pay_rates;
create policy "pay_rates_manager_read"
  on position_pay_rates for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager', 'assistant_manager')
    )
  );

-- Admin (owner) only can write.
drop policy if exists "pay_rates_admin_write" on position_pay_rates;
create policy "pay_rates_admin_write"
  on position_pay_rates for all
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ── updated_at triggers (reuse existing helper if present) ─────
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists set_positions_updated_at on positions;
    create trigger set_positions_updated_at
      before update on positions
      for each row execute function set_updated_at();

    drop trigger if exists set_pay_rates_updated_at on position_pay_rates;
    create trigger set_pay_rates_updated_at
      before update on position_pay_rates
      for each row execute function set_updated_at();
  end if;
end $$;

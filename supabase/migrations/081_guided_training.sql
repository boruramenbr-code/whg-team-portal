-- 081_guided_training.sql
--
-- Guided new-hire training (Randy, Sept 16 2026). New hires follow one
-- step-by-step path: Welcome → Paperwork → Meet your team → Learn the job
-- + Floor training → Floor-ready. Built on the existing training ladder:
--   • trainee_assignments — who is training whom, when they started, and
--     which manager set it up.
--   • track_modules.completion gains 'trainer': the assigned trainer (or
--     any manager) marks it done. Existing "Floor Training: …" shadow-shift
--     steps switch to 'trainer'; "Skill: …" checks stay manager-only.
--   • track_modules.module_type gains 'team' — the "Meet your team" step,
--     seeded into WHG Foundations.
--   • Floor-ready now takes a manager's final sign-off (a
--     floor_ready_overrides row, which records who signed). Finishing every
--     step makes someone "ready for sign-off". No one had been marked
--     floor-ready when this shipped.
--
-- Idempotent — safe to run more than once.

-- ── Trainer assignments ────────────────────────────────────────────────
create table if not exists trainee_assignments (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  trainer_id  uuid references auth.users(id) on delete set null,
  start_date  date not null default current_date,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists trainee_assignments_trainer_idx
  on trainee_assignments (trainer_id);

alter table trainee_assignments enable row level security;

drop policy if exists "trainee_assignments_read" on trainee_assignments;
create policy "trainee_assignments_read"
  on trainee_assignments for select to authenticated
  using (
    user_id = auth.uid()
    or trainer_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager', 'assistant_manager')
    )
  );

-- ── New step types ─────────────────────────────────────────────────────
-- Drop the existing check constraints by what they check, not by name, so
-- this works however Postgres named them.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'track_modules'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%module_type%' or pg_get_constraintdef(oid) ilike '%completion%')
  loop
    execute format('alter table track_modules drop constraint %I', r.conname);
  end loop;
end $$;

alter table track_modules add constraint track_modules_module_type_check
  check (module_type in ('video_series', 'menu_category', 'quiz', 'photo_test', 'skill', 'note', 'team'));
alter table track_modules add constraint track_modules_completion_check
  check (completion in ('self', 'exam', 'manager', 'trainer'));

-- Shadow shifts: the trainer marks them.
update track_modules
   set completion = 'trainer', updated_at = now()
 where module_type = 'skill'
   and completion = 'manager'
   and title like 'Floor Training:%';

-- "Meet your team" in WHG Foundations.
insert into track_modules (track_id, title, title_es, module_type, completion, required, sort_order, description, description_es)
select t.id, 'Meet your team', 'Conoce a tu equipo', 'team', 'self', true, 150,
       'See the faces of your managers and teammates, and who is training you. Say hi in person on your first shift.',
       'Mira las caras de tus gerentes y compañeros, y quién te va a entrenar. Salúdalos en persona en tu primer turno.'
  from training_tracks t
 where t.level = 'foundations'
   and t.active
   and not exists (
     select 1 from track_modules m
      where m.track_id = t.id and m.module_type = 'team'
   );

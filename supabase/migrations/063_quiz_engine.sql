-- ============================================================
-- WHG TEAM PORTAL — QUIZ ENGINE (Phase B of Training)
--
-- Generic multiple-choice + true/false quiz engine. Attaches to a
-- training video, a menu category, OR stands freeform (both nullable).
--
-- Two kinds:
--   • exam — required. Passing counts toward "floor-ready" in Phase C.
--   • quiz — optional knowledge check.
--
-- Retakes: unlimited (Randy's locked decision). Each attempt is a full
-- row so the manager view can show every try (Phase C).
--
-- Grading is server-side and immediate on submit. Scores are stored
-- 0-100. Passed = score >= pass_threshold.
--
-- True/False is stored as multiple_choice with exactly two auto-created
-- choices ('True'/'False' with 'Verdadero'/'Falso' bilingual). The
-- player renders them as a two-button pair; grading uses the same
-- selected_choice_id -> is_correct path as MC. Keeps the schema uniform.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) QUIZZES --------------------------------------------------
create table if not exists quizzes (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  title_es          text,
  description       text,
  description_es    text,
  -- 'exam' = counts toward floor-ready gate (Phase C). 'quiz' = optional.
  kind              text not null default 'quiz'
                    check (kind in ('exam', 'quiz')),
  -- null = applies to every restaurant. Otherwise scoped to one.
  restaurant_id     uuid references restaurants(id) on delete cascade,
  -- Passing score threshold (0-100). Default 80. Configurable per quiz.
  pass_threshold    int  not null default 80
                    check (pass_threshold between 0 and 100),
  -- Audience scoping — same convention as onboarding checklist items.
  applies_to        text not null default 'all'
                    check (applies_to in ('all', 'foh', 'boh', 'mgmt')),
  -- Optional linkage — a quiz can attach to a video OR a menu category
  -- OR stand freeform. Both null = freeform. Both set is allowed but
  -- unusual; the UI leads with "attach to..." and picks one.
  video_id          uuid references training_videos(id) on delete set null,
  menu_category_id  uuid references menu_categories(id) on delete set null,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists quizzes_restaurant_active_idx
  on quizzes (restaurant_id, active);
create index if not exists quizzes_video_idx
  on quizzes (video_id) where video_id is not null;
create index if not exists quizzes_menu_category_idx
  on quizzes (menu_category_id) where menu_category_id is not null;

-- 2) QUESTIONS ------------------------------------------------
create table if not exists quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  question_text  text not null,
  question_text_es text,
  -- 'multiple_choice' with N choices, OR 'true_false' with 2 fixed choices
  -- ('True'/'False'). Both use quiz_choices under the hood.
  question_type  text not null default 'multiple_choice'
                 check (question_type in ('multiple_choice', 'true_false')),
  sort_order     int  not null default 100,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_sort_idx
  on quiz_questions (quiz_id, active, sort_order);

-- 3) CHOICES --------------------------------------------------
create table if not exists quiz_choices (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references quiz_questions(id) on delete cascade,
  choice_text    text not null,
  choice_text_es text,
  is_correct     boolean not null default false,
  sort_order     int  not null default 100,
  created_at     timestamptz not null default now()
);

create index if not exists quiz_choices_question_sort_idx
  on quiz_choices (question_id, sort_order);

-- 4) ATTEMPTS -------------------------------------------------
create table if not exists quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  -- 0-100. Server sets this on submit.
  score          int  check (score between 0 and 100),
  -- score >= quiz.pass_threshold snapshot at submit time.
  passed         boolean,
  started_at     timestamptz not null default now(),
  submitted_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- Powers "did this user pass?" lookups and manager attempt lists.
create index if not exists quiz_attempts_user_quiz_idx
  on quiz_attempts (user_id, quiz_id, submitted_at desc);
create index if not exists quiz_attempts_quiz_submitted_idx
  on quiz_attempts (quiz_id, submitted_at desc)
  where submitted_at is not null;

-- 5) ANSWERS --------------------------------------------------
create table if not exists quiz_answers (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references quiz_attempts(id) on delete cascade,
  question_id        uuid not null references quiz_questions(id) on delete cascade,
  selected_choice_id uuid references quiz_choices(id) on delete set null,
  is_correct         boolean not null,
  created_at         timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists quiz_answers_attempt_idx
  on quiz_answers (attempt_id);

-- 6) RLS ------------------------------------------------------
alter table quizzes         enable row level security;
alter table quiz_questions  enable row level security;
alter table quiz_choices    enable row level security;
alter table quiz_attempts   enable row level security;
alter table quiz_answers    enable row level security;

-- READ: any authenticated staff can see quizzes assigned to their
-- restaurant (or global). Video and menu attachments are visible to
-- whoever can see the parent content. RLS keeps it tight.
drop policy if exists "quizzes_read_scoped" on quizzes;
create policy "quizzes_read_scoped"
  on quizzes for select to authenticated
  using (
    active
    and (
      restaurant_id is null
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and (p.role = 'admin' or p.restaurant_id = quizzes.restaurant_id)
      )
      or exists (
        select 1 from user_locations ul
        where ul.profile_id = auth.uid()
          and ul.restaurant_id = quizzes.restaurant_id
      )
    )
  );

drop policy if exists "quiz_questions_read_all_visible" on quiz_questions;
create policy "quiz_questions_read_all_visible"
  on quiz_questions for select to authenticated
  using (
    active
    and exists (
      select 1 from quizzes q
      where q.id = quiz_questions.quiz_id
        and q.active
    )
  );

drop policy if exists "quiz_choices_read_all_visible" on quiz_choices;
create policy "quiz_choices_read_all_visible"
  on quiz_choices for select to authenticated
  using (
    exists (
      select 1 from quiz_questions qq
      where qq.id = quiz_choices.question_id
        and qq.active
    )
  );

-- WRITE: manager+ can author quizzes/questions/choices. All writes in
-- the API go through the service-role client after a role check, but
-- these policies keep any accidental RLS-writes safe.
drop policy if exists "quizzes_write_mgmt" on quizzes;
create policy "quizzes_write_mgmt"
  on quizzes for all to authenticated
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

drop policy if exists "quiz_questions_write_mgmt" on quiz_questions;
create policy "quiz_questions_write_mgmt"
  on quiz_questions for all to authenticated
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

drop policy if exists "quiz_choices_write_mgmt" on quiz_choices;
create policy "quiz_choices_write_mgmt"
  on quiz_choices for all to authenticated
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

-- ATTEMPTS: user sees their own; managers/admins see all in their scope.
-- All INSERTs/UPDATEs go through the API's service-role client after
-- validation, so we only need the SELECT policy to be permissive-safe.
drop policy if exists "quiz_attempts_read_own_or_mgmt" on quiz_attempts;
create policy "quiz_attempts_read_own_or_mgmt"
  on quiz_attempts for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

drop policy if exists "quiz_attempts_insert_own" on quiz_attempts;
create policy "quiz_attempts_insert_own"
  on quiz_attempts for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "quiz_attempts_update_own_or_mgmt" on quiz_attempts;
create policy "quiz_attempts_update_own_or_mgmt"
  on quiz_attempts for update to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

drop policy if exists "quiz_answers_read_own_or_mgmt" on quiz_answers;
create policy "quiz_answers_read_own_or_mgmt"
  on quiz_answers for select to authenticated
  using (
    exists (
      select 1 from quiz_attempts qa
      where qa.id = quiz_answers.attempt_id
        and (
          qa.user_id = auth.uid()
          or exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and p.role in ('manager', 'assistant_manager', 'admin')
          )
        )
    )
  );

-- ============================================================
-- Done. Phase C adds Mission Control reporting + a "floor-ready"
-- signal derived from exam-kind quiz_attempts.passed. No schema
-- change needed there — it reads from these tables.
-- ============================================================

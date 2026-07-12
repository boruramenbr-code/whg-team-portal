-- ============================================================
-- WHG TEAM PORTAL — TRAINING TRACKS (position-based learning ladder)
--
-- Randy's hierarchy (locked 2026-07-12):
--   Level 1  foundations    — everyone, every restaurant
--   Level 2  department     — FOH / BOH / MGMT core
--   Level 3  position       — per-position track (the heart)
--   Level 4  certification  — cross-cutting, assigned where needed
--
-- Rules he chose:
--   • Requirements differ by position; the LIBRARY stays open to all
--     (tracks gate requirements, never visibility of content).
--   • Hands-on skills complete only with MANAGER sign-off (dual-check
--     spirit of the onboarding checklist).
--   • All 22 position tracks exist from day one; Server / Busser /
--     Sushi Chef / Dish Crew are seeded with real modules (Ichiban).
--
-- MODULE TYPES
--   video_series  — ref_id → training_series.  Completion: self.
--   menu_category — ref_id → menu_categories.  Completion: self.
--   quiz          — ref_id → quizzes.          Completion: exam (pass).
--   photo_test    — ref_id NULL. Resolves the restaurant's live
--                   "📸 Menu Photo Test" at read time (the test is
--                   regenerated periodically so a fixed id would break).
--   skill         — hands-on. description says what to demonstrate.
--                   Completion: manager sign-off.
--   note          — read/acknowledge text content. Completion: self.
--
-- Track resolution for a user (in the API):
--   foundations (all) + department core matching onboarding_category +
--   position track matching position_slug (restaurant-specific track
--   wins over the global skeleton) + certifications matching category
--   or position_slugs.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) TRACKS ---------------------------------------------------
create table if not exists training_tracks (
  id             uuid primary key default gen_random_uuid(),
  -- null = applies at every restaurant. Set = restaurant-specific
  -- version (wins over the null/global one for the same audience).
  restaurant_id  uuid references restaurants(id) on delete cascade,
  title          text not null,
  title_es       text,
  description    text,
  description_es text,
  emoji          text,
  level          text not null
                 check (level in ('foundations', 'department', 'position', 'certification')),
  -- Audience: 'all' or a department. position_slugs narrows further
  -- (empty array = everyone in applies_to).
  applies_to     text not null default 'all'
                 check (applies_to in ('all', 'foh', 'boh', 'mgmt')),
  position_slugs text[] not null default '{}',
  sort_order     int  not null default 100,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists training_tracks_level_idx
  on training_tracks (active, level, sort_order);

-- 2) MODULES --------------------------------------------------
create table if not exists track_modules (
  id           uuid primary key default gen_random_uuid(),
  track_id     uuid not null references training_tracks(id) on delete cascade,
  title        text not null,
  title_es     text,
  -- What to do / what to demonstrate (esp. for skill + note types).
  description    text,
  description_es text,
  module_type  text not null
               check (module_type in ('video_series', 'menu_category', 'quiz', 'photo_test', 'skill', 'note')),
  -- Target row for video_series / menu_category / quiz. NULL otherwise.
  ref_id       uuid,
  -- How it completes: self check-off, exam pass, or manager sign-off.
  completion   text not null default 'self'
               check (completion in ('self', 'exam', 'manager')),
  required     boolean not null default true,
  sort_order   int  not null default 100,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists track_modules_track_sort_idx
  on track_modules (track_id, active, sort_order);

-- 3) PROGRESS -------------------------------------------------
create table if not exists module_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_id    uuid not null references track_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  -- Set when a manager signed it off ('manager' completion modules).
  manager_id   uuid references auth.users(id) on delete set null,
  unique (user_id, module_id)
);

create index if not exists module_progress_user_idx
  on module_progress (user_id);

-- 4) RLS ------------------------------------------------------
alter table training_tracks enable row level security;
alter table track_modules   enable row level security;
alter table module_progress enable row level security;

-- Tracks + modules: readable by all staff (library-open principle).
drop policy if exists "training_tracks_read_all" on training_tracks;
create policy "training_tracks_read_all"
  on training_tracks for select to authenticated using (true);

drop policy if exists "track_modules_read_all" on track_modules;
create policy "track_modules_read_all"
  on track_modules for select to authenticated using (true);

-- Progress: you can read your own; managers can read anyone's.
drop policy if exists "module_progress_read" on module_progress;
create policy "module_progress_read"
  on module_progress for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

-- All writes go through the API's service-role client after validation
-- (self-completion only for 'self' modules; manager role for sign-offs).

-- 5) SEED -----------------------------------------------------
do $$
declare
  ichiban_id uuid;
  t_id uuid;
  pos record;
  s_30rule uuid;
  mc_rolls uuid; mc_specialty uuid; mc_nigiri uuid; mc_hot uuid;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  select id into s_30rule from training_series where title like '%30%25 Rule%' or title like '%30%Rule%' limit 1;
  if ichiban_id is not null then
    select id into mc_rolls     from menu_categories where restaurant_id = ichiban_id and name = 'Sushi Rolls' limit 1;
    select id into mc_specialty from menu_categories where restaurant_id = ichiban_id and name = 'Specialty Rolls' limit 1;
    select id into mc_nigiri    from menu_categories where restaurant_id = ichiban_id and name = 'Sushi & Sashimi' limit 1;
    select id into mc_hot       from menu_categories where restaurant_id = ichiban_id and name = 'Hot Small Plates' limit 1;
  end if;

  -- ── LEVEL 1: Foundations (everyone) ──
  if not exists (select 1 from training_tracks where level = 'foundations') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description, description_es)
    values ('WHG Foundations', 'Fundamentos WHG', '🌱', 'foundations', 'all', 100,
            'Who we are and how we treat people — every member of this family starts here.',
            'Quiénes somos y cómo tratamos a la gente — cada miembro de esta familia empieza aquí.')
    returning id into t_id;

    insert into track_modules (track_id, title, title_es, module_type, ref_id, completion, sort_order, description, description_es)
    values
      (t_id, 'Read Our Story', 'Lee Nuestra Historia', 'note', null, 'self', 100,
       'Open the Onboarding tab and read Our Story, Mission & Values. This is why we exist.',
       'Abre la pestaña de Onboarding y lee Nuestra Historia, Misión y Valores.'),
      (t_id, 'Watch: Preston Lee''s 30% Rule', 'Mira: la Regla del 30% de Preston Lee', 'video_series', s_30rule, 'self', 200,
       'Service vs hospitality — the difference between getting it right and getting it remembered.',
       'Servicio vs hospitalidad — la diferencia entre hacerlo bien y hacer que te recuerden.'),
      (t_id, 'Teamwork: leave it better than you found it', 'Trabajo en equipo', 'note', null, 'self', 300,
       'Full hands in, full hands out. Help the next shift win. If you see something that needs doing, it''s yours.',
       'Manos llenas al entrar, manos llenas al salir. Ayuda al siguiente turno a ganar.');
  end if;

  -- ── LEVEL 2: Department cores ──
  if not exists (select 1 from training_tracks where level = 'department' and applies_to = 'foh') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description, description_es)
    values ('FOH Core', 'Núcleo FOH', '🍽️', 'department', 'foh', 200,
            'The front-of-house fundamentals every guest-facing teammate owns.',
            'Los fundamentos de sala que todo compañero de cara al cliente domina.')
    returning id into t_id;
    insert into track_modules (track_id, title, title_es, module_type, completion, sort_order, description, description_es)
    values
      (t_id, 'Greet within 30 seconds', 'Saluda en 30 segundos', 'skill', 'manager', 100,
       'Demonstrate: every guest acknowledged within 30 seconds of sitting down — eye contact, smile, water started.',
       'Demuestra: cada invitado reconocido en 30 segundos — contacto visual, sonrisa, agua en camino.'),
      (t_id, 'Carding & alcohol basics', 'Verificación de edad y alcohol', 'skill', 'manager', 200,
       'Demonstrate the carding steps from the Home tab card: ID in hand, birth date math, photo match, when to refuse.',
       'Demuestra los pasos de verificación: ID en mano, cálculo de fecha, comparación de foto, cuándo rechazar.');
  end if;

  if not exists (select 1 from training_tracks where level = 'department' and applies_to = 'boh') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description, description_es)
    values ('BOH Core', 'Núcleo BOH', '🔪', 'department', 'boh', 210,
            'Kitchen fundamentals — safety, cleanliness, and respect for the craft.',
            'Fundamentos de cocina — seguridad, limpieza y respeto por el oficio.')
    returning id into t_id;
    insert into track_modules (track_id, title, title_es, module_type, completion, sort_order, description, description_es)
    values
      (t_id, 'Kitchen safety walkthrough', 'Recorrido de seguridad', 'skill', 'manager', 100,
       'Walk the kitchen with a lead: burns, cuts, slips, lifting, what to do when something goes wrong.',
       'Recorre la cocina con un líder: quemaduras, cortes, resbalones, cómo levantar, qué hacer si algo sale mal.'),
      (t_id, 'Clean as you go', 'Limpia mientras trabajas', 'skill', 'manager', 200,
       'Demonstrate station discipline for one full shift: towels, sanitizer buckets, cutting board rotation.',
       'Demuestra disciplina de estación un turno completo: toallas, sanitizante, rotación de tablas.');
  end if;

  if not exists (select 1 from training_tracks where level = 'department' and applies_to = 'mgmt') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description)
    values ('Management Core', 'Núcleo de Gerencia', '🧭', 'department', 'mgmt', 220,
            'Leading shifts the WHG way — the Manager Bible is your track.')
    returning id into t_id;
    insert into track_modules (track_id, title, module_type, completion, sort_order, description)
    values
      (t_id, 'Read the Manager Bible', 'note', 'self', 100,
       'Admin → Standards → Manager Bible. Read it end to end — it is the operating manual for your shifts.');
  end if;

  -- ── LEVEL 3: Position tracks ──
  -- Pilots (Ichiban-scoped, filled with real modules): server, busser,
  -- sushi_chef, dish. Everything else: global skeleton, filled later.
  for pos in select slug, name, department from positions where active loop
    if pos.slug in ('server', 'busser', 'sushi_chef', 'dish') and ichiban_id is not null then
      if not exists (select 1 from training_tracks where level = 'position' and position_slugs = array[pos.slug] and restaurant_id = ichiban_id) then
        insert into training_tracks (restaurant_id, title, emoji, level, applies_to, position_slugs, sort_order, description)
        values (ichiban_id, pos.name || ' Track', '🎯', 'position',
                case when pos.department = 'FOH' then 'foh' when pos.department = 'BOH' then 'boh' else 'mgmt' end,
                array[pos.slug], 300, 'Everything a ' || pos.name || ' needs to earn the floor.')
        returning id into t_id;

        if pos.slug = 'server' then
          insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
            (t_id, 'Study: Sushi Rolls',        'menu_category', mc_rolls,     'self',    true,  100, 'Every roll — what''s inside, allergens, how to talk about it.'),
            (t_id, 'Study: Specialty Rolls',    'menu_category', mc_specialty, 'self',    true,  200, 'The money makers. Know your three favorites to recommend.'),
            (t_id, 'Study: Sushi & Sashimi',    'menu_category', mc_nigiri,    'self',    true,  300, 'Know every fish — guests will ask what escolar is.'),
            (t_id, '📸 Pass the Menu Photo Test', 'photo_test',  null,         'exam',    true,  400, 'Name dishes from their photos. Unlimited retakes — pass to be floor-ready.'),
            (t_id, 'Skill: Tray carrying',      'skill',         null,         'manager', true,  500, 'Demonstrate to a manager: loaded tray, one hand, through the dining room safely.'),
            (t_id, 'Skill: Water & greet service', 'skill',      null,         'manager', true,  600, 'Demonstrate: waters delivered correctly, greeting script natural, not robotic.'),
            (t_id, 'Skill: Hibachi service steps', 'skill',      null,         'manager', true,  700, 'Walk a manager through every step of the hibachi table process.');
        elsif pos.slug = 'busser' then
          insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
            (t_id, 'Skill: Table reset standard', 'skill',       null,         'manager', true,  100, 'Demonstrate a full reset to standard in under 2 minutes.'),
            (t_id, 'Skill: Tray & bus tub handling', 'skill',    null,         'manager', true,  200, 'Demonstrate safe carrying — stacking, balance, the route through the room.'),
            (t_id, 'Skill: Reading the room',    'skill',        null,         'manager', true,  300, 'Show a manager you can spot: empty glasses, finished plates, guests looking around.'),
            (t_id, 'Menu awareness (optional)',  'menu_category', mc_rolls,    'self',    false, 400, 'Not required — but bussers who know the menu become servers.');
        elsif pos.slug = 'sushi_chef' then
          insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
            (t_id, 'Skill: Rolling fundamentals', 'skill',       null,         'manager', true,  100, 'Demonstrate to the sushi lead: rice handling, pressure, consistent rolls.'),
            (t_id, 'Skill: Cutting skills',      'skill',        null,         'manager', true,  200, 'Demonstrate: clean 8-piece cuts, sashimi slices, consistency across a full order.'),
            (t_id, 'Skill: Knife sharpening',    'skill',        null,         'manager', true,  300, 'Demonstrate whetstone sharpening and daily edge maintenance.'),
            (t_id, 'Study: Sushi Rolls build specs', 'menu_category', mc_rolls, 'self',   true,  400, 'Every roll''s build — inside, toppings, sauces. The prep notes are your spec sheet.'),
            (t_id, 'Study: Specialty Rolls build specs', 'menu_category', mc_specialty, 'self', true, 500, 'Specialty builds — exact toppings and finishes. Consistency is the brand.'),
            (t_id, '📸 Pass the Menu Photo Test', 'photo_test',  null,         'exam',    true,  600, 'If you build it, you can name it at a glance.');
        elsif pos.slug = 'dish' then
          insert into track_modules (track_id, title, module_type, ref_id, completion, required, sort_order, description) values
            (t_id, 'Skill: Dish pit flow',       'skill',        null,         'manager', true,  100, 'Demonstrate the flow: scrape → rack → wash → sanitize → air dry → put away. No shortcuts.'),
            (t_id, 'Skill: Chemical safety',     'skill',        null,         'manager', true,  200, 'Show a manager: which chemicals, correct dilution, never mixing, where the SDS sheets live.'),
            (t_id, 'Skill: Closing cleaning list', 'skill',      null,         'manager', true,  300, 'Complete a full closing checklist with a lead — floors, drains, mats, trash run.');
        end if;
      end if;
    else
      if not exists (select 1 from training_tracks where level = 'position' and position_slugs = array[pos.slug] and restaurant_id is null) then
        insert into training_tracks (title, emoji, level, applies_to, position_slugs, sort_order, description, active)
        values (pos.name || ' Track', '🎯', 'position',
                case when pos.department = 'FOH' then 'foh' when pos.department = 'BOH' then 'boh' else 'mgmt' end,
                array[pos.slug], 310, 'Track for ' || pos.name || ' — modules coming as training content is built.', true);
      end if;
    end if;
  end loop;

  -- ── LEVEL 4: Certifications ──
  if not exists (select 1 from training_tracks where level = 'certification' and title = 'Responsible Alcohol Service') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, position_slugs, sort_order, description)
    values ('Responsible Alcohol Service', 'Servicio Responsable de Alcohol', '🪪', 'certification', 'foh',
            array['server', 'bartender', 'shift_leader', 'togo'], 400,
            'Carding, cutoffs, and the law. Required before serving a single drink.')
    returning id into t_id;
    insert into track_modules (track_id, title, module_type, completion, sort_order, description) values
      (t_id, 'Bar card on file', 'skill', 'manager', 100, 'Manager confirms your bar card is uploaded and current.'),
      (t_id, 'Carding demonstration', 'skill', 'manager', 200, 'Demonstrate the full carding routine from the Home tab card, including a polite refusal.');
  end if;

  if not exists (select 1 from training_tracks where level = 'certification' and title = 'Food Safety Basics') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description)
    values ('Food Safety Basics', 'Seguridad Alimentaria', '🧤', 'certification', 'boh', 410,
            'Temps, cross-contamination, handwashing, allergens. Non-negotiable.')
    returning id into t_id;
    insert into track_modules (track_id, title, module_type, completion, sort_order, description) values
      (t_id, 'Handwashing & glove standard', 'skill', 'manager', 100, 'Demonstrate when and how — every time, no exceptions.'),
      (t_id, 'Temps & cross-contamination', 'skill', 'manager', 200, 'Show a lead: danger zone temps, raw storage order, board and towel discipline.');
  end if;

  if not exists (select 1 from training_tracks where level = 'certification' and title = 'Allergen Awareness') then
    insert into training_tracks (title, title_es, emoji, level, applies_to, sort_order, description)
    values ('Allergen Awareness', 'Conciencia de Alérgenos', '⚠️', 'certification', 'foh', 420,
            'Every FOH teammate can answer "does this have shellfish?" correctly or knows exactly who to ask.')
    returning id into t_id;
    insert into track_modules (track_id, title, module_type, ref_id, completion, sort_order, description) values
      (t_id, 'Study allergen chips on the menu', 'menu_category', mc_hot, 'self', 100,
       'Open any menu item — the red allergen box is the answer key. Learn the 9 allergen icons.'),
      (t_id, 'Allergy order protocol', 'skill', null, 'manager', 200,
       'Demonstrate: guest declares an allergy → what you say, who you tell, how it''s rung in.');
  end if;
end $$;

-- ============================================================
-- Done. The API resolves each user's ladder from these tables.
-- ============================================================

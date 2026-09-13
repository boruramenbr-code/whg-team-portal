-- ============================================================
-- 078 — Handbook Quick Guide (cards)
--
-- Randy's call (2026-09-12): the handbook becomes three ways in —
--   • Quick Guide: each booklet section broken into short, friendly
--     cards (one idea per card, big type, a graphic, "what happens
--     if" callouts) — staff flip through them like phone stories.
--   • Booklet: the full official handbook, unchanged (what people sign).
--   • Ask: the AI for anything the cards don't cover.
--
-- Guardrails:
--   • Cards are SUMMARIES written only from the booklet's wording; each
--     card section links to its booklet section.
--   • booklet_section_id + reviewed_at: when a booklet section is edited
--     after its cards were last reviewed, the API flags the section for
--     admins so summaries never drift from policy.
--   • published = false → visible to admins only (preview while drafting).
--
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists handbook_card_sections (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  title_es           text,
  blurb              text,
  blurb_es           text,
  emoji              text,
  cover_url          text,
  -- The (English) booklet section these cards summarize.
  booklet_section_id uuid references handbook_sections(id) on delete set null,
  sort_order         int  not null default 100,
  published          boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists handbook_card_sections_sort_idx
  on handbook_card_sections (active, published, sort_order);

create table if not exists handbook_cards (
  id                uuid primary key default gen_random_uuid(),
  section_id        uuid not null references handbook_card_sections(id) on delete cascade,
  sort_order        int  not null default 100,
  -- The one thing to remember, shown in large type.
  headline          text not null,
  headline_es       text,
  -- Short supporting points, one per line.
  points            text,
  points_es         text,
  -- Optional "What happens if…" callout.
  callout           text,
  callout_es        text,
  -- When set, the card also appears as a "Most asked" question chip.
  quick_question    text,
  quick_question_es text,
  image_url         text,
  -- Last time this card was checked against its booklet section.
  reviewed_at       timestamptz not null default now(),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists handbook_cards_section_sort_idx
  on handbook_cards (section_id, active, sort_order);

-- RLS: signed-in employees read active rows; the API decides what's
-- published. Writes go through the service role only.
alter table handbook_card_sections enable row level security;
alter table handbook_cards enable row level security;

drop policy if exists "handbook_card_sections_read" on handbook_card_sections;
create policy "handbook_card_sections_read" on handbook_card_sections
  for select to authenticated using (active = true);

drop policy if exists "handbook_cards_read" on handbook_cards;
create policy "handbook_cards_read" on handbook_cards
  for select to authenticated using (active = true);

-- Public bucket for card graphics.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('handbook-cards', 'handbook-cards', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "handbook_cards_public_read" on storage.objects;
create policy "handbook_cards_public_read"
on storage.objects for select
using (bucket_id = 'handbook-cards');

-- ============================================================
-- WHG TEAM PORTAL — REWRITE WELCOME NOTE (THEM-FIRST VOICE)
-- The previous welcome note read like a system message ("Welcome
-- to the WHG Team Portal..."). New version is from Randy's voice,
-- warm and them-focused, with a clear "this app vs Telegram"
-- orientation so new hires know what each tool is for.
--
-- Schedule is correctly attributed to 7shifts (not this app).
--
-- Updates the most recent active welcome message; inserts one if
-- none exists. Owner can always re-edit later via admin panel.
--
-- Idempotent (safe to re-run).
-- ============================================================

do $$
declare
  v_id uuid;
  v_content text := E'Saying yes to restaurant work takes a certain kind of person — someone willing to move fast, take care of people, and figure things out under pressure. We hire for that, and we''re glad you''re here.\n\nYou''ve got teammates and managers in your corner from day one. Ask questions. Lean on the people around you. Nobody figures this place out alone.\n\nThe first few weeks have a lot of moving parts. Two tools cover most of it: **this app is your daily dashboard** — training, policies, your onboarding checklist, daily updates, who''s on tonight. **Telegram is where we communicate** — announcements, shift changes, day-to-day. Get both installed and you''ve got the channels you need.\n\n— Randy';
begin
  select id into v_id
  from welcome_messages
  where is_active = true
  order by updated_at desc nulls last
  limit 1;

  if v_id is null then
    insert into welcome_messages (content, is_active)
    values (v_content, true);
  else
    update welcome_messages
    set content = v_content,
        updated_at = now()
    where id = v_id;
  end if;
end $$;

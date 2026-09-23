-- ============================================================
-- 093 — Break pay follows federal (DOL) rules (Randy, Sept 23 2026)
--
-- Randy: "I will always follow DOL rules." Replaces "clock out for every
-- break" everywhere with what federal wage law requires:
--
--   • Short breaks — rest or restroom, up to 20 minutes — are PAID time.
--     Stay clocked in. (29 CFR 785.18)
--   • Meal breaks are UNPAID only when they're at least 30 minutes and
--     you're completely relieved of duty. Clock out, clock back in.
--     (29 CFR 785.19)
--   • Asked to do any work during a meal break? That time is paid.
--
-- Peak-hour limits and the 5-minute / 10-minute urgent-break guidance
-- stay — those breaks are now clearly paid.
--
-- Handbook (EN + ES), the manager Theft Recognition Guide, and the four
-- Quick Guide cards that mention clocking out for breaks change together.
-- Then publishes the last three Quick Guide topics — all 14 live.
--
-- Safe to run more than once. The last statement prints the result.
-- ============================================================

update handbook_sections set body = replace(body, $Q$- Staying clocked in while on a break is a timekeeping violation. You must clock out before your break begins and clock back in when you return.$Q$, $Q$- Short breaks are paid. A rest or restroom break of up to 20 minutes counts as time worked — stay clocked in.
- Meal breaks are unpaid only when they are at least 30 minutes and you are completely relieved of duty. Clock out before your meal break begins and clock back in when you return. If you are asked to do any work during a meal break, that time is paid — stay clocked in, or tell your manager so it can be corrected.$Q$), updated_at = now()
where id = '536f80e3-2598-478d-93c3-17c48e56ed00';

update handbook_sections set body = replace(body, $Q$- Permanecer con el reloj marcado mientras está en descanso es una violación de control de tiempo. Debe marcar salida antes de que comience su descanso y marcar entrada cuando regrese.$Q$, $Q$- Los descansos cortos son pagados. Un descanso o ida al baño de hasta 20 minutos cuenta como tiempo trabajado — permanezca con el reloj marcado.
- Los descansos para comer no son pagados solo cuando duran al menos 30 minutos y usted queda completamente libre de sus tareas. Marque salida antes de que comience su descanso para comer y marque entrada cuando regrese. Si se le pide hacer cualquier trabajo durante un descanso para comer, ese tiempo se paga — permanezca con el reloj marcado, o avísele a su gerente para que se corrija.$Q$), updated_at = now()
where id = '6126650f-df04-42ad-b76a-ab4ed0622a8c';

update handbook_sections set body = replace(body, $Q$You must clock out before leaving your station. Staying clocked in during a break is a timekeeping violation. On-premise clocked-out breaks: eat in the designated area, use your phone, decompress — but keep interactions with clocked-in staff brief and do not distract coworkers mid-service.$Q$, $Q$Short breaks of up to 20 minutes — including restroom breaks — are paid; stay clocked in. Meal breaks of 30 minutes or more, completely off duty, are unpaid; clock out before your meal break and back in when you return (see Timekeeping). On-premise breaks: eat in the designated area, use your phone, decompress — but keep interactions with working staff brief and do not distract coworkers mid-service.$Q$), updated_at = now()
where id = '68307b89-e904-403f-8674-84071f366992';

update handbook_sections set body = replace(body, $Q$Debe marcar su salida antes de dejar su estación. Permanecer con el reloj marcado durante un descanso es una violación de control de tiempo. Descansos en el local con reloj de salida marcado: coma en el área designada, use su teléfono, descanse — pero mantenga las interacciones con el personal que está trabajando breves y no distraiga a sus compañeros a mitad del servicio.$Q$, $Q$Los descansos cortos de hasta 20 minutos — incluidas las idas al baño — son pagados; permanezca con el reloj marcado. Los descansos para comer de 30 minutos o más, completamente libre de tareas, no son pagados; marque salida antes de su descanso para comer y entrada cuando regrese (vea Control de Tiempo). Descansos en el local: coma en el área designada, use su teléfono, descanse — pero mantenga las interacciones con el personal que está trabajando breves y no distraiga a sus compañeros a mitad del servicio.$Q$), updated_at = now()
where id = 'c99634a5-d8a9-46d4-b323-c1a14b9b6285';

update handbook_sections set body = replace(body, $Q$Your meal can only be eaten on your designated, clocked-out break$Q$, $Q$Your meal can only be eaten on your designated break, off the floor$Q$), updated_at = now()
where active = true and body like '%designated, clocked-out break%';

update handbook_sections set body = replace(body, $Q$Phone use is permitted only on your designated, clocked-out break$Q$, $Q$Phone use is permitted only on your designated break$Q$), updated_at = now()
where active = true and body like '%Phone use is permitted only on your designated, clocked-out break%';

update handbook_sections set body = replace(body, $Q$Su comida solo puede ser consumida en su descanso designado con reloj de salida marcado$Q$, $Q$Su comida solo puede ser consumida en su descanso designado, fuera del piso$Q$), updated_at = now()
where active = true and body like '%Su comida solo puede ser consumida en su descanso designado con reloj%';

update handbook_sections set body = replace(body, $Q$descanso designado con reloj de salida marcado$Q$, $Q$descanso designado$Q$), updated_at = now()
where active = true and body like '%descanso designado con reloj de salida marcado%';

update handbook_sections set body = replace(body, $Q$- Taking breaks on the clock without clocking out for them$Q$, $Q$- Taking meal breaks (30+ minutes) without clocking out for them — short breaks up to 20 minutes are paid and stay on the clock$Q$), updated_at = now()
where active = true and body like '%- Taking breaks on the clock without clocking out for them%';


-- ── Quick Guide cards ──────────────────────────────────────────────
update handbook_cards set
  headline = $Q$Short breaks are paid. Meal breaks are clocked out.$Q$,
  headline_es = $Q$Los descansos cortos se pagan. Los de comida se marcan fuera.$Q$,
  points = $Q$Short breaks — rest or restroom, up to 20 minutes — are paid. Stay clocked in.
Meal breaks of at least 30 minutes, completely off duty, are unpaid. Clock out, then clock back in when you return.$Q$,
  points_es = $Q$Los descansos cortos — descanso o baño, de hasta 20 minutos — se pagan. Quédate con el reloj marcado.
Los descansos para comer de al menos 30 minutos, completamente libre de tareas, no se pagan. Marca salida y vuelve a marcar entrada al regresar.$Q$,
  callout = $Q$Asked to do any work during your meal break? That time is paid — stay clocked in, or tell your manager so it's corrected.$Q$,
  callout_es = $Q$¿Te piden hacer cualquier trabajo durante tu descanso para comer? Ese tiempo se paga — quédate con el reloj marcado, o avísale a tu gerente para que se corrija.$Q$,
  infographic = $Q${"type": "compare", "left": {"title": {"en": "Short break", "es": "Descanso corto"}, "icon": "clock", "lines": [{"en": "Up to 20 minutes — rest or restroom", "es": "Hasta 20 minutos — descanso o baño"}, {"en": "Paid time", "es": "Tiempo pagado"}, {"en": "Stay clocked in", "es": "Quédate con el reloj marcado"}]}, "right": {"title": {"en": "Meal break", "es": "Descanso para comer"}, "icon": "bowl", "lines": [{"en": "At least 30 minutes, completely off duty", "es": "Al menos 30 minutos, completamente libre de tareas"}, {"en": "Unpaid", "es": "No pagado"}, {"en": "Clock out, then back in when you return", "es": "Marca salida y vuelve a marcar entrada al regresar"}]}, "note": {"en": "Asked to do any work during your meal break? That time is paid — stay clocked in, or tell your manager so it's corrected.", "es": "¿Te piden hacer cualquier trabajo durante tu descanso para comer? Ese tiempo se paga — quédate con el reloj marcado, o avísale a tu gerente para que se corrija."}, "why": {"en": "Federal law counts short breaks as work time, so you're always paid for them — a full meal break is your time, off the clock.", "es": "La ley federal cuenta los descansos cortos como tiempo trabajado, así que siempre se te pagan — un descanso completo para comer es tu tiempo, fuera del reloj."}, "example": {"en": "Quick restroom break at 7:10? Stay clocked in. A 30-minute dinner break at 4:00? Clock out at 4:00, back in at 4:30.", "es": "¿Una ida rápida al baño a las 7:10? Quédate con el reloj marcado. ¿Un descanso de 30 minutos para cenar a las 4:00? Marca salida a las 4:00 y entrada a las 4:30."}}$Q$::jsonb, updated_at = now()
where id = 'e14cab05-dd78-44ef-bdde-869a7deec108';

update handbook_cards set
  headline = $Q$Take breaks out of guests’ view.$Q$,
  headline_es = $Q$Toma tus descansos fuera de la vista de los clientes.$Q$,
  points = $Q$Short breaks (up to 20 minutes) are paid — stay clocked in. Meal breaks of 30+ minutes are clocked out.
On break, eat in the designated area, use your phone, decompress.
Keep chats with coworkers who are working brief — don’t distract anyone mid-service.$Q$,
  points_es = $Q$Los descansos cortos (hasta 20 minutos) se pagan — quédate con el reloj marcado. Los descansos para comer de 30+ minutos se marcan fuera.
En tu descanso: come en el área designada, usa tu teléfono, relájate.
Mantén breves las pláticas con compañeros que están trabajando — no los distraigas a mitad del servicio.$Q$,
  callout = $Q$Breaks never happen in service areas or anywhere guests can see.$Q$,
  callout_es = $Q$Los descansos nunca se toman en áreas de servicio ni donde los clientes puedan verte.$Q$,
  infographic = $Q${"type": "dodont", "do": [{"en": "Eat in the designated area", "es": "Come en el área designada"}, {"en": "Use your phone, decompress", "es": "Usa tu teléfono, relájate"}, {"en": "Short break? Stay clocked in. Meal break (30+ min)? Clock out.", "es": "¿Descanso corto? Quédate con el reloj marcado. ¿Para comer (30+ min)? Marca salida."}], "dont": [{"en": "Take a break in service areas or anywhere guests can see", "es": "Tomar un descanso en áreas de servicio o donde te vean los clientes"}, {"en": "Long chats with coworkers who are working", "es": "Platicar mucho con compañeros que están trabajando"}, {"en": "Distract anyone mid-service", "es": "Distraer a alguien a mitad del servicio"}], "note": {"en": "Short breaks up to 20 minutes are paid. Meal breaks of 30+ minutes, completely off duty, are unpaid.", "es": "Los descansos cortos de hasta 20 minutos se pagan. Los descansos para comer de 30+ minutos, completamente libre de tareas, no se pagan."}, "noteTone": "info", "why": {"en": "A real break means real rest — and accurate punches keep everyone's pay right.", "es": "Un descanso de verdad significa descansar de verdad — y los registros correctos mantienen bien el pago de todos."}, "example": {"en": "Taking your 30-minute meal break at 3:15? Clock out, then eat in the designated area — not at a table guests can see.", "es": "¿Tomas tu descanso de 30 minutos para comer a las 3:15? Marca salida y come en el área designada — no en una mesa donde te vean los clientes."}}$Q$::jsonb, updated_at = now()
where id = 'ac5096a2-03dc-43a1-bbd5-edffac06ff2c';

update handbook_cards set
  points = $Q$No personal phones on the floor, in service areas, or in any guest-facing space.
Use it only on your break — not between tables, at expo, or in the restroom during service.
Managers may use phones for work communication only.$Q$,
  points_es = $Q$Nada de teléfonos personales en el piso, en áreas de servicio ni en ningún espacio frente a los clientes.
Úsalo solo en tu descanso — no entre mesas, no en la estación de expedición y no en el baño durante el servicio.
Los gerentes pueden usar el teléfono solo para comunicación de trabajo.$Q$,
  infographic = $Q${"type": "dodont", "do": [{"en": "Use it only on your break", "es": "Úsalo solo en tu descanso"}, {"en": "A quick glance for a genuine emergency is understandable", "es": "Una mirada rápida por una emergencia genuina es entendible"}], "dont": [{"en": "On the floor, in service areas, or any guest-facing space", "es": "En el piso, en áreas de servicio o en cualquier espacio frente a los clientes"}, {"en": "Between tables, at expo, or in the restroom during service", "es": "Entre mesas, en la estación de expedición o en el baño durante el servicio"}, {"en": "Scrolling, texting, or social media during service", "es": "Navegar, mandar mensajes o usar redes sociales durante el servicio"}], "note": {"en": "Managers may use phones for work communication only.", "es": "Los gerentes pueden usar el teléfono solo para comunicación de trabajo."}, "noteTone": "info", "why": {"en": "A phone in hand pulls your attention from guests and your team — and guests notice right away.", "es": "Un teléfono en la mano te quita atención de los clientes y de tu equipo — y los clientes lo notan de inmediato."}, "example": {"en": "Want to check a text between tickets at expo? Wait for your clocked-out break.", "es": "¿Quieres revisar un mensaje entre comandas en la estación de expedición? Espera a tu descanso con salida marcada."}}$Q$::jsonb, updated_at = now()
where id = '0772784b-8509-45d3-80c8-1e2aeae1ca69';

update handbook_cards set
  points = $Q$Eat it only on your designated break, off the floor.
We want you to know the menu and enjoy the food you help serve.$Q$,
  points_es = $Q$Cómela solo en tu descanso designado, fuera del piso.
Queremos que conozcas el menú y disfrutes la comida que ayudas a servir.$Q$,
  infographic = $Q${"type": "compare", "left": {"title": {"en": "Your meal discount", "es": "Tu descuento de comida"}, "icon": "bowl", "lines": [{"en": "Eat it only on your designated break", "es": "Cómela solo en tu descanso designado"}, {"en": "Off the floor — never at your station", "es": "Fuera del piso — nunca en tu estación"}]}, "right": {"title": {"en": "Managers", "es": "Gerentes"}, "icon": "gift", "lines": [{"en": "One free shift meal per shift", "es": "Una comida de turno gratis por turno"}, {"en": "Up to $15", "es": "Hasta $15"}, {"en": "No more than two free meals a day", "es": "No más de dos comidas gratis al día"}]}, "why": {"en": "We want you to know the menu and enjoy the food you help serve.", "es": "Queremos que conozcas el menú y disfrutes la comida que ayudas a servir."}, "example": {"en": "A manager working a double gets up to two free meals that day — one per shift, each up to $15.", "es": "Un gerente que trabaja doble turno recibe hasta dos comidas gratis ese día — una por turno, cada una de hasta $15."}}$Q$::jsonb, updated_at = now()
where id = '7af67978-c484-4994-b2ce-ee45af82f6d1';

update handbook_cards set infographic = $Q${"type": "day", "from": "10:00", "to": "22:00", "blocks": [{"start": "11:30", "end": "13:30"}, {"start": "17:30", "end": "20:30"}], "blockLabel": {"en": "Peak — no scheduled breaks", "es": "Hora pico — sin descansos programados"}, "openLabel": {"en": "Outside peak hours, breaks happen at manager-approved times.", "es": "Fuera de las horas pico, los descansos son en horarios aprobados por el gerente."}, "note": {"en": "Urgent restroom need or genuine emergency? Notify the manager on duty. Five minutes is expected; ten is the absolute maximum — and it's paid, so stay clocked in.", "es": "¿Necesidad urgente de ir al baño o una emergencia genuina? Avisa al gerente en turno. Se esperan cinco minutos; diez es el máximo absoluto — y se paga, así que quédate con el reloj marcado."}, "noteTone": "info", "why": {"en": "Peak hours are when guests need all of us — one missing person is felt across the whole floor.", "es": "Las horas pico son cuando los clientes nos necesitan a todos — una persona menos se siente en todo el piso."}, "example": {"en": "Working 4 to 10? Any scheduled break falls before 5:30 or after 8:30, at a time your manager approves.", "es": "¿Trabajas de 4 a 10? Cualquier descanso programado es antes de las 5:30 o después de las 8:30, a la hora que apruebe tu gerente."}}$Q$::jsonb, updated_at = now() where id = '088b995a-c832-4cc6-b7b5-b6c930a2e0cd';

update handbook_cards set infographic = $Q${"type": "day", "from": "10:00", "to": "22:00", "blocks": [{"start": "11:30", "end": "13:30"}, {"start": "17:30", "end": "20:30"}], "blockLabel": {"en": "Peak — no scheduled breaks", "es": "Hora pico — sin descansos programados"}, "openLabel": {"en": "Outside peak hours, breaks happen at manager-approved times.", "es": "Fuera de las horas pico, los descansos son en horarios aprobados por el gerente."}, "note": {"en": "Urgent restroom need or genuine emergency? Notify the manager on duty. Five minutes is expected; ten is the absolute maximum — and it's paid, so stay clocked in.", "es": "¿Necesidad urgente de ir al baño o una emergencia genuina? Avisa al gerente en turno. Se esperan cinco minutos; diez es el máximo absoluto — y se paga, así que quédate con el reloj marcado."}, "noteTone": "info", "why": {"en": "Peak hours are when guests need all of us — one missing person is felt across the whole floor.", "es": "Las horas pico son cuando los clientes nos necesitan a todos — una persona menos se siente en todo el piso."}, "example": {"en": "Working 4 to 10? Any scheduled break falls before 5:30 or after 8:30, at a time your manager approves.", "es": "¿Trabajas de 4 a 10? Cualquier descanso programado es antes de las 5:30 o después de las 8:30, a la hora que apruebe tu gerente."}}$Q$::jsonb, updated_at = now() where id = 'd2137f4f-0f78-45eb-b5a4-6b2c9ee6dc2d';

-- Cards sourced from the edited sections: reviewed as of now.
update handbook_cards set reviewed_at = now()
where booklet_section_id in (select id from handbook_sections where active and updated_at > now() - interval '5 minutes')
   or section_id in (select id from handbook_card_sections
                     where booklet_section_id in (select id from handbook_sections where active and updated_at > now() - interval '5 minutes'));

-- ── Publish the last three topics ─────────────────────────────────
update handbook_card_sections set published = true, updated_at = now()
where active = true and title in ('Clocking In & Out', 'Phones, Breaks & Daily Conduct', 'Things Most People Don’t Know');

-- ── Result (expect 0, 0, 0, 14) ──────────────────────────────────
select
  (select count(*) from handbook_sections where active and (body like '%clocked in during a break is a timekeeping violation%' or body like '%clocked in while on a break is a timekeeping violation%')) as handbook_old_break_rule_left,
  (select count(*) from handbook_sections where active and (body like '%clocked-out break%' or body like '%con reloj de salida marcado%')) as handbook_clocked_out_break_left,
  (select count(*) from handbook_cards where active and (points ilike '%clocked-out break%' or callout ilike '%clocked in during a break%')) as cards_old_break_rule_left,
  (select count(*) from handbook_card_sections where active and published) as published_topics;

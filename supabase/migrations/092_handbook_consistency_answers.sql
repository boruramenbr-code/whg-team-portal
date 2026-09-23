-- ============================================================
-- 092 — Handbook consistency: Randy's answers (Sept 23 2026)
--
--   #2 Time fraud "can mean" immediate termination — everywhere
--   #3 Only DELIBERATE early/late punches to inflate pay are time fraud;
--      an early punch without an OK, on its own, is flagged and may be
--      adjusted (7shifts also blocks clock-ins more than 10 minutes early)
--   #4 "Military duty" added to the Job Basics protected list, matching
--      the Harassment section
--   #5 Bar Card: "sells or serves" (the state's wording) — not "handles"
--   #6 90-day sentence points to the benefits rules already in the
--      handbook: eligibility for the standard benefits your employment
--      status qualifies for (full-time after 90 days; part-time only if
--      specified in writing). No change to who gets what.
--
-- Handbook (EN + ES) and the matching Quick Guide cards change together.
-- Cards sourced from the edited sections are marked reviewed, so the
-- Quick Guide doesn't flag "handbook changed" for these deliberate edits.
-- Then publishes Pay & Payroll, Drugs & Alcohol, and Job Basics.
--
-- NOT in here: #1 break pay — held for Randy's attorney.
-- Safe to run more than once. The last statement prints the result.
-- ============================================================

update handbook_sections set body = replace(body, $Q$Deliberate manipulation of time records to inflate pay — including unauthorized early clock-ins, late clock-outs, or having another employee punch for you — is considered time fraud and will result in immediate termination.$Q$, $Q$Deliberate manipulation of time records to inflate pay — such as deliberately clocking in early or out late, or having another employee punch for you — is considered time fraud and may result in immediate termination. An early clock-in without manager approval, on its own, is flagged and may be adjusted.$Q$), updated_at = now()
where id = 'c0534a86-1a79-4674-b60f-7cb3ef2975fe';

update handbook_sections set body = replace(body, $Q$La manipulación deliberada de registros de tiempo para inflar el pago — incluyendo entradas anticipadas no autorizadas, salidas tardías, o hacer que otro empleado marque por usted — se considera fraude de tiempo y resultará en terminación inmediata.$Q$, $Q$La manipulación deliberada de registros de tiempo para inflar el pago — como marcar entrada antes o salida después a propósito, o hacer que otro empleado marque por usted — se considera fraude de tiempo y puede resultar en terminación inmediata. Una entrada anticipada sin aprobación del gerente, por sí sola, se marca y puede ajustarse.$Q$), updated_at = now()
where id = '555b3b9b-9cdd-45f9-80db-e8da7f23246f';

update handbook_sections set body = replace(body, $Q$We do not make employment decisions based on race, color, religion, sex, pregnancy, sexual orientation, gender identity, national origin, age, disability, genetic information, veteran status, or any other characteristic protected by applicable law.$Q$, $Q$We do not make employment decisions based on race, color, religion, sex, pregnancy, sexual orientation, gender identity, national origin, age, disability, genetic information, veteran status, military duty, or any other characteristic protected by applicable law.$Q$), updated_at = now()
where id = 'bd4e5e0d-6a36-4d4b-8331-d9f6f84953e3';

update handbook_sections set body = replace(body, $Q$No tomamos decisiones de empleo basadas en raza, color, religión, sexo, embarazo, orientación sexual, identidad de género, origen nacional, edad, discapacidad, información genética, estado de veterano, ni ninguna otra característica protegida por la ley aplicable.$Q$, $Q$No tomamos decisiones de empleo basadas en raza, color, religión, sexo, embarazo, orientación sexual, identidad de género, origen nacional, edad, discapacidad, información genética, estado de veterano, servicio militar, ni ninguna otra característica protegida por la ley aplicable.$Q$), updated_at = now()
where id = 'd583f438-4467-4344-8a36-eb9ba97aa5e2';

update handbook_sections set body = replace(body, $Q$Any employee who serves or handles alcohol must hold a valid Louisiana Permit #A (Bar Card) before serving.$Q$, $Q$Any employee who sells or serves alcohol must hold a valid Louisiana Permit #A (Bar Card) before selling or serving.$Q$), updated_at = now()
where id = 'b2685652-feaa-47c2-b742-3a860851a904';

update handbook_sections set body = replace(body, $Q$Todo empleado que sirva o maneje alcohol debe tener un Permiso #A de Louisiana (Bar Card) válido antes de servir.$Q$, $Q$Todo empleado que venda o sirva alcohol debe tener un Permiso #A de Louisiana (Bar Card) válido antes de vender o servir.$Q$), updated_at = now()
where id = 'dadabce7-26d8-4ae8-b6a8-bd71a583c29b';

update handbook_sections set body = replace(body, $Q$Successful completion of the 90-day period does not guarantee continued employment, but it does mark the official start of your tenure with the Company and triggers eligibility for standard Company benefits.$Q$, $Q$Successful completion of the 90-day period does not guarantee continued employment, but it does mark the official start of your tenure with the Company and triggers eligibility for the standard Company benefits your employment status qualifies for.$Q$), updated_at = now()
where id = 'bd4e5e0d-6a36-4d4b-8331-d9f6f84953e3';

update handbook_sections set body = replace(body, $Q$Completar exitosamente el período de 90 días no garantiza empleo continuo, pero sí marca el inicio oficial de su permanencia con la Compañía y activa la elegibilidad para los beneficios estándar de la Compañía.$Q$, $Q$Completar exitosamente el período de 90 días no garantiza empleo continuo, pero sí marca el inicio oficial de su permanencia con la Compañía y activa la elegibilidad para los beneficios estándar de la Compañía que correspondan a su tipo de empleo.$Q$), updated_at = now()
where title = 'Fundamentos del Empleo' and active = true;


-- ── Quick Guide cards ──────────────────────────────────────────────
update handbook_cards set
  points = $Q$Deliberately manipulating time records to inflate pay is time fraud.
That includes deliberately clocking in early or out late.
It also includes having another employee punch for you.$Q$,
  points_es = $Q$Manipular a propósito los registros de tiempo para inflar tu pago es fraude de tiempo.
Eso incluye marcar entrada antes o salida después a propósito.
También incluye pedirle a otro empleado que marque por ti.$Q$,
  callout = $Q$Time fraud can mean immediate termination.$Q$,
  callout_es = $Q$El fraude de tiempo puede significar terminación inmediata.$Q$,
  infographic = $Q${"type": "dodont", "do": [{"en": "Record only the hours you actually work", "es": "Registra solo las horas que realmente trabajas"}], "dont": [{"en": "Deliberately manipulate time records to inflate pay", "es": "Manipular a propósito los registros de tiempo para inflar tu pago"}, {"en": "Clock in early or out late on purpose to inflate pay", "es": "Marcar entrada antes o salida después a propósito para inflar tu pago"}, {"en": "Have another employee punch for you", "es": "Pedirle a otro empleado que marque por ti"}], "note": {"en": "All of these are time fraud — it can mean immediate termination. An early punch without a manager’s OK, on its own, is flagged and may be adjusted.", "es": "Todo esto es fraude de tiempo — puede significar terminación inmediata. Una entrada anticipada sin el visto bueno de un gerente, por sí sola, se marca y puede ajustarse."}, "noteTone": "warn", "why": {"en": "Every punch is a record of real work — payroll and the team's trust both depend on it being true.", "es": "Cada registro es constancia de trabajo real — la nómina y la confianza del equipo dependen de que sea verdad."}}$Q$::jsonb, updated_at = now()
where id = 'e822d1a8-8a64-455e-96d7-7e5a950127a7';

update handbook_cards set
  points = replace(points, 'veteran status, or any', 'veteran status, military duty, or any'),
  points_es = replace(points_es, 'estado de veterano u otra', 'estado de veterano, servicio militar u otra'),
  infographic = $Q${"type": "compare", "left": {"title": {"en": "Based on", "es": "Se basan en"}, "icon": "check", "lines": [{"en": "Performance", "es": "Desempeño"}, {"en": "Qualifications", "es": "Calificaciones"}, {"en": "Behavior", "es": "Comportamiento"}, {"en": "Business need", "es": "Necesidades del negocio"}]}, "right": {"title": {"en": "Never based on", "es": "Nunca en"}, "icon": "x", "lines": [{"en": "Race, color, religion, sex, pregnancy", "es": "Raza, color, religión, sexo, embarazo"}, {"en": "Sexual orientation, gender identity, national origin", "es": "Orientación sexual, identidad de género, origen nacional"}, {"en": "Age, disability, genetic information, veteran status, military duty", "es": "Edad, discapacidad, información genética, estado de veterano, servicio militar"}, {"en": "Any other characteristic protected by law", "es": "Cualquier otra característica protegida por la ley aplicable"}]}, "note": {"en": "Applies to hiring, scheduling, pay, advancement, discipline, and separation.", "es": "Aplica a contratación, horarios, compensación, avance, disciplina y separación."}, "noteTone": "info", "why": {"en": "Every decision about your job should come down to your work and what the business needs — never who you are.", "es": "Cada decisión sobre tu empleo debe depender de tu trabajo y de lo que el negocio necesita — nunca de quién eres."}}$Q$::jsonb, updated_at = now()
where id = '6685bafb-33fa-4597-84bd-eb1a159a515d';

update handbook_cards set
  headline = $Q$Sell or serve alcohol? You need a Bar Card first.$Q$,
  headline_es = $Q$¿Vendes o sirves alcohol? Necesitas tu Bar Card primero.$Q$,
  points = replace(points, 'a legal requirement before serving.', 'a legal requirement before selling or serving.'),
  points_es = replace(points_es, 'un requisito legal antes de servir.', 'un requisito legal antes de vender o servir.'),
  infographic = $Q${"type": "icon", "icon": "clipboard", "phrase": {"en": "Louisiana Permit #A — required before you sell or serve", "es": "Permiso de Luisiana #A — obligatorio antes de vender o servir"}, "sub": {"en": "Get it and keep it valid. Onboarding covers how to get yours.", "es": "Sácalo y mantenlo vigente. En tu incorporación te explicamos cómo obtenerlo."}, "note": {"en": "No employee under 18 may serve alcohol in any capacity.", "es": "Ningún empleado menor de 18 años puede servir alcohol en ninguna capacidad."}, "noteTone": "warn", "why": {"en": "It's the law in Louisiana — serving without a valid card puts you and the restaurant at legal risk.", "es": "Es la ley en Louisiana — servir sin una tarjeta vigente te pone a ti y al restaurante en riesgo legal."}, "example": {"en": "New server or cashier? Get your Bar Card before you sell or serve your first beer or sake.", "es": "¿Mesero o cajero nuevo? Saca tu Bar Card antes de vender o servir tu primera cerveza o sake."}}$Q$::jsonb, updated_at = now()
where id = 'e87ad5a4-4178-40b4-b531-0b8559324dfa';

update handbook_cards set
  callout = $Q$Completing it starts your official tenure and eligibility for the standard benefits your employment status qualifies for — but doesn’t guarantee continued employment.$Q$,
  callout_es = $Q$Completarlo marca el inicio oficial de tu permanencia y activa la elegibilidad para los beneficios estándar que correspondan a tu tipo de empleo — pero no garantiza empleo continuo.$Q$,
  infographic = $Q${"type": "stat", "value": "90", "unit": {"en": "days", "es": "días"}, "label": {"en": "Your introductory period", "es": "Tu período introductorio"}, "sub": {"en": "Starts day one: you learn the role and culture; we see if it's the right long-term fit. We watch attendance, attitude, learning ability, professionalism, and teamwork.", "es": "Empieza tu primer día: tú aprendes el puesto y la cultura; nosotros evaluamos si es una buena opción a largo plazo. Observamos asistencia, actitud, capacidad de aprendizaje, profesionalismo y trabajo en equipo."}, "icon": "calendar", "footer": {"tone": "info", "text": {"en": "Completing it starts your official tenure and eligibility for the standard benefits your employment status qualifies for — but doesn’t guarantee continued employment.", "es": "Completarlo marca el inicio oficial de tu permanencia y activa la elegibilidad para los beneficios estándar que correspondan a tu tipo de empleo — pero no garantiza empleo continuo."}}, "why": {"en": "It's a fair chance for both sides: you get to know us, and we get to know how you work.", "es": "Es una oportunidad justa para ambos lados: tú nos conoces a nosotros, y nosotros conocemos cómo trabajas."}, "example": {"en": "Start on March 2? Your first 90 days run through May 30.", "es": "¿Empiezas el 2 de marzo? Tus primeros 90 días van hasta el 30 de mayo."}}$Q$::jsonb, updated_at = now()
where id = 'd0b63078-7657-47b6-a687-3cf3f209d76e';

-- Cards sourced from the edited handbook sections: reviewed as of now.
update handbook_cards set reviewed_at = now()
where booklet_section_id in ('555b3b9b-9cdd-45f9-80db-e8da7f23246f', 'b2685652-feaa-47c2-b742-3a860851a904', 'bd4e5e0d-6a36-4d4b-8331-d9f6f84953e3', 'c0534a86-1a79-4674-b60f-7cb3ef2975fe', 'd583f438-4467-4344-8a36-eb9ba97aa5e2', 'dadabce7-26d8-4ae8-b6a8-bd71a583c29b')
   or section_id in (select id from handbook_card_sections where booklet_section_id in ('555b3b9b-9cdd-45f9-80db-e8da7f23246f', 'b2685652-feaa-47c2-b742-3a860851a904', 'bd4e5e0d-6a36-4d4b-8331-d9f6f84953e3', 'c0534a86-1a79-4674-b60f-7cb3ef2975fe', 'd583f438-4467-4344-8a36-eb9ba97aa5e2', 'dadabce7-26d8-4ae8-b6a8-bd71a583c29b'));

-- ── Publish the three topics these answers unblock ────────────────
update handbook_card_sections set published = true, updated_at = now()
where active = true and title in ('Pay & Payroll', 'Drugs & Alcohol', 'Job Basics');

-- ── Result (expect 0, 0, 2, and 11 if 091 ran first) ───────────────
select
  (select count(*) from handbook_sections where active and (body like '%time fraud and will result%' or body like '%fraude de tiempo y resultará%')) as time_fraud_still_says_will,
  (select count(*) from handbook_sections where active and body like '%serves or handles alcohol%') as handbook_still_saying_handles,
  (select count(*) from handbook_sections where active and body like '%veteran status, military duty%') as handbook_lists_with_military_duty,
  (select count(*) from handbook_card_sections where active and published) as published_topics;

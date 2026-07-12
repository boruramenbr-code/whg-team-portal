-- ============================================================
-- WHG TEAM PORTAL — SEED ICHIBAN MENU (Phase A content preload)
--
-- Populates menu_categories and menu_items for Ichiban Sushi from the
-- live Toast online ordering menu. 8 categories, ~150 items.
--
-- What's authoritative here (pulled straight from Toast):
--   • Category names
--   • Item names
--   • Prices
--   • Descriptions (where Toast has them)
--
-- What's inferred (Randy should verify + adjust in the admin UI):
--   • Ingredients: parsed from description + standard sushi/hibachi
--     recipe knowledge. Formatted one per line.
--   • Allergens: standard whitelist (shellfish, fish, soy, wheat, egg,
--     dairy, peanut, tree_nut, sesame). Assumes eel sauce / ponzu /
--     teriyaki / tempura batter carry their common allergens.
--   • Prep notes: short server-facing hints (garnish, plating pattern,
--     what to say to the guest). NOT chef prep — that goes in Manager
--     Bible later.
--   • Upsell tips: server-focused one-liners.
--   • Spanish translations: menu names transliterated (like El Bulli
--     convention — dish names stay proper nouns, ingredient lists +
--     descriptions translate). Randy's Spanish-speaking staff can
--     refine.
--
-- What's NOT filled:
--   • photo_url — Randy adds via admin UI on a per-item basis.
--
-- Sort order convention:
--   • Categories: 100, 200, 300... in Toast display order.
--   • Items within category: 10, 20, 30...
--   • Room to insert without renumbering.
--
-- Idempotent — every insert uses WHERE NOT EXISTS on (name, restaurant_id)
-- so re-running does nothing harmful. Manager edits in the admin UI are
-- preserved on re-run.
-- ============================================================

do $$
declare
  ichiban_id uuid;
  cat_hot uuid; cat_cold uuid; cat_salads uuid; cat_rolls uuid;
  cat_specialty uuid; cat_nigiri uuid; cat_entrees uuid; cat_rice uuid;
begin
  select id into ichiban_id from restaurants where lower(name) like 'ichiban%' limit 1;
  if ichiban_id is null then
    raise notice 'Ichiban restaurant not found — skipping menu seed';
    return;
  end if;

  -- ── CATEGORIES ────────────────────────────────────────────

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Hot Small Plates', 'Aperitivos Calientes', 100
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Hot Small Plates');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Cold Small Plates', 'Aperitivos Fríos', 200
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Cold Small Plates');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Salads', 'Ensaladas', 300
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Salads');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Sushi Rolls', 'Rollos de Sushi', 400
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Sushi Rolls');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Specialty Rolls', 'Rollos de Especialidad', 500
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Specialty Rolls');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Sushi & Sashimi', 'Sushi y Sashimi', 600
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Sushi & Sashimi');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Entrées', 'Platillos Principales', 700
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Entrées');

  insert into menu_categories (restaurant_id, name, name_es, sort_order)
  select ichiban_id, 'Fried Rice, Noodles & Soups', 'Arroz Frito, Fideos y Sopas', 800
  where not exists (select 1 from menu_categories where restaurant_id = ichiban_id and name = 'Fried Rice, Noodles & Soups');

  -- Grab the category ids we just inserted for use in item inserts.
  select id into cat_hot       from menu_categories where restaurant_id = ichiban_id and name = 'Hot Small Plates';
  select id into cat_cold      from menu_categories where restaurant_id = ichiban_id and name = 'Cold Small Plates';
  select id into cat_salads    from menu_categories where restaurant_id = ichiban_id and name = 'Salads';
  select id into cat_rolls     from menu_categories where restaurant_id = ichiban_id and name = 'Sushi Rolls';
  select id into cat_specialty from menu_categories where restaurant_id = ichiban_id and name = 'Specialty Rolls';
  select id into cat_nigiri    from menu_categories where restaurant_id = ichiban_id and name = 'Sushi & Sashimi';
  select id into cat_entrees   from menu_categories where restaurant_id = ichiban_id and name = 'Entrées';
  select id into cat_rice      from menu_categories where restaurant_id = ichiban_id and name = 'Fried Rice, Noodles & Soups';

  -- ============================================================
  -- HOT SMALL PLATES
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Baked Salmon Appetizer', 'Salmón Horneado', 'Salmon and snow crab baked and topped with eel sauce and sesame seeds.', 'Salmón y kanikama horneados y cubiertos con salsa de anguila y semillas de sésamo.',
    E'Fresh salmon\nSnow crab mix\nEel sauce\nSesame seeds', E'Salmón fresco\nMezcla de kanikama\nSalsa de anguila\nSemillas de sésamo',
    array['fish','shellfish','soy','wheat','sesame'], 'Comes hot — plate on a small oval dish; garnish with a lemon wedge if bar has them.', 'Se sirve caliente — presenta en plato ovalado; adorna con rodaja de limón si el bar tiene.',
    'Suggest with a chilled sake or a Sapporo tall.', 'Sugiere con un sake frío o una Sapporo grande.',
    '$10.50', 10
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Baked Salmon Appetizer');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Creamy Spicy Shrimp', 'Camarón Cremoso Picante', 'Golden tempura fried jumbo shrimp tossed in our savory creamy spicy mayo.', 'Camarón jumbo dorado en tempura, bañado en nuestra mayonesa cremosa picante.',
    E'Jumbo shrimp\nTempura batter\nCreamy spicy mayo (mayo, sriracha, sesame oil)\nGreen onion garnish', E'Camarón jumbo\nMasa tempura\nMayonesa cremosa picante (mayonesa, sriracha, aceite de sésamo)\nCebollín',
    array['shellfish','egg','wheat','soy','sesame'], 'Served hot right out of the fryer — get it to the table fast so the tempura stays crisp.', 'Servir caliente al salir de la freidora — llévalo rápido para que la tempura no pierda su textura crujiente.',
    'Pairs great with Kirin Light or a spicy margarita.', 'Combina bien con Kirin Light o una margarita picante.',
    '$10.50', 20
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Creamy Spicy Shrimp');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Edamame', 'Edamame', 'Steamed young soybeans dusted with sea salt.', 'Frijoles de soya jóvenes al vapor con sal de mar.',
    E'Edamame pods\nSea salt', E'Vainas de edamame\nSal de mar',
    array['soy'], 'Small or large — confirm portion size with the guest at the table.', 'Chico o grande — confirma el tamaño con el huésped en la mesa.',
    'Cheapest starter — always suggest for tables waiting on sushi.', 'Aperitivo más económico — siempre sugiere para mesas esperando el sushi.',
    '$6.50+', 30
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Edamame');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Gyoza Dumplings', 'Gyoza (Empanadas Japonesas)', 'Steamed, fried, or pan-fried homemade pork and cabbage gyoza dumplings.', 'Empanadas de cerdo y col hechas en casa — al vapor, fritas o a la sartén.',
    E'Ground pork\nCabbage\nGarlic and ginger\nGyoza wrapper\nDipping sauce (soy, vinegar, chili oil)', E'Cerdo molido\nCol\nAjo y jengibre\nMasa gyoza\nSalsa para mojar (soya, vinagre, aceite de chile)',
    array['wheat','soy','sesame'], 'Ask guest: steamed, fried, or pan-fried. Default is pan-fried if they don''t care.', 'Pregunta al huésped: al vapor, fritas o a la sartén. Por defecto: a la sartén si no tienen preferencia.',
    'Classic first-timer starter — suggest alongside a bowl of miso.', 'Aperitivo clásico para nuevos comensales — sugiere con un tazón de miso.',
    '$9.50', 40
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Gyoza Dumplings');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Ika Fries', 'Papas de Calamar (Ika Fries)', 'Tempura fried squid strings with a side of our seafood sauce.', 'Tiras de calamar en tempura con nuestra salsa mariscos al lado.',
    E'Squid (calamari) strings\nTempura batter\nSeafood/yum yum sauce', E'Tiras de calamar\nMasa tempura\nSalsa de mariscos (yum yum)',
    array['shellfish','egg','wheat','soy'], 'Serve immediately — cools fast and gets rubbery if it sits.', 'Servir de inmediato — se enfría rápido y se pone chicloso si espera.',
    'Fun starter to introduce guests curious about squid — less scary than a whole tentacle.', 'Aperitivo divertido para huéspedes curiosos sobre el calamar — menos intimidante que un tentáculo entero.',
    '$8.50', 50
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Ika Fries');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Sushi Egg Rolls', 'Rollos Primavera de Sushi', 'Crawfish, avocado, crab mix, cream cheese, wasabi mayo, and sweet chili sauce.', 'Cangrejo de río, aguacate, mezcla de cangrejo, queso crema, mayonesa de wasabi y salsa dulce de chile.',
    E'Crawfish\nAvocado\nCrab mix\nCream cheese\nEgg roll wrapper\nWasabi mayo\nSweet chili sauce', E'Cangrejo de río\nAguacate\nMezcla de cangrejo\nQueso crema\nMasa de rollo primavera\nMayonesa de wasabi\nSalsa dulce de chile',
    array['shellfish','dairy','egg','wheat','soy','sesame'], 'Baton Rouge crossover dish — talk it up with locals.', 'Platillo con toque de Baton Rouge — resáltalo con clientes locales.',
    'One of our most-ordered starters. Great for groups sharing.', 'Uno de nuestros aperitivos más pedidos. Ideal para compartir en grupo.',
    '$10.00', 60
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Sushi Egg Rolls');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Tempura', 'Tempura de Pollo', 'Tempura fried chicken.', 'Pollo frito en tempura.',
    E'Chicken breast strips\nTempura batter\nTentsuyu dipping sauce (soy, mirin, dashi)', E'Tiras de pechuga de pollo\nMasa tempura\nSalsa tentsuyu (soya, mirin, dashi)',
    array['egg','wheat','soy','fish'], 'Chicken tempura is a lighter starter — good for guests who don''t want seafood.', 'Tempura de pollo es un aperitivo ligero — bueno para clientes que no quieren mariscos.',
    'Confirm size — small (starter) or large (light entrée).', 'Confirma el tamaño — chico (aperitivo) o grande (platillo ligero).',
    '$6.00+', 70
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Tempura');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Tokyo Poppers', 'Poppers de Tokio', 'Stuffed jalapeños with krab mix, spicy tuna, and cream cheese. Tempura fried and topped with sweet chili sauce and mustard sauce.', 'Jalapeños rellenos de mezcla de cangrejo, atún picante y queso crema. Fritos en tempura y cubiertos con salsa dulce de chile y salsa de mostaza.',
    E'Jalapeño peppers\nKrab mix\nSpicy tuna mix\nCream cheese\nTempura batter\nSweet chili sauce\nMustard sauce', E'Jalapeños\nMezcla de cangrejo\nAtún picante\nQueso crema\nMasa tempura\nSalsa dulce de chile\nSalsa de mostaza',
    array['fish','shellfish','dairy','egg','wheat','soy'], 'Warn heat-sensitive guests — these keep a real jalapeño kick even after frying.', 'Advierte a clientes sensibles al picante — mantienen el picor del jalapeño real incluso después de freírse.',
    'Server''s pick for adventurous diners. Great to share.', 'Recomendación del mesero para comensales aventureros. Ideal para compartir.',
    '$10.50', 80
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Tokyo Poppers');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Vegetable Spring Rolls', 'Rollos Primavera de Vegetales', 'Crispy fried spring rolls stuffed with mixed vegetables. Served with sweet chili sauce.', 'Rollos primavera fritos y crujientes rellenos de vegetales mixtos. Servidos con salsa dulce de chile.',
    E'Cabbage, carrots, and mixed vegetables\nSpring roll wrapper\nSweet chili sauce', E'Col, zanahorias y vegetales mixtos\nMasa de rollo primavera\nSalsa dulce de chile',
    array['wheat','soy'], 'Only vegetarian starter on the menu — pitch it that way.', 'Único aperitivo vegetariano del menú — véndelo así.',
    'Great for guests with dietary restrictions or vegetarian kids.', 'Ideal para clientes con restricciones alimenticias o niños vegetarianos.',
    '$6.50', 90
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Vegetable Spring Rolls');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_hot, ichiban_id, 'Wasabi Shrimp', 'Camarón con Wasabi', 'Golden tempura fried jumbo shrimp tossed in a sweet wasabi mayo.', 'Camarón jumbo dorado en tempura, bañado en mayonesa dulce de wasabi.',
    E'Jumbo shrimp\nTempura batter\nSweet wasabi mayo (mayo, wasabi paste, sugar)', E'Camarón jumbo\nMasa tempura\nMayonesa dulce de wasabi (mayonesa, pasta de wasabi, azúcar)',
    array['shellfish','egg','wheat','soy'], 'Sweet + wasabi kick — great for guests who want flavor without heavy heat.', 'Dulce con toque de wasabi — bueno para clientes que quieren sabor sin picor fuerte.',
    'Sister dish to Creamy Spicy Shrimp — offer both if the table can''t decide.', 'Platillo hermano al Camarón Cremoso Picante — ofrece ambos si la mesa no se decide.',
    '$10.50', 100
  where not exists (select 1 from menu_items where category_id = cat_hot and name = 'Wasabi Shrimp');

  -- ============================================================
  -- COLD SMALL PLATES
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Beef Tataki', 'Beef Tataki (Res Marinada)', '(9 pc.) Thinly-sliced rare ribeye topped with Sriracha, togarashi, ponzu sauce, green onions, and sesame seeds.', '(9 pzas) Ribeye rebanado fino, poco cocido, cubierto con sriracha, togarashi, ponzu, cebollín y semillas de sésamo.',
    E'Rare-seared ribeye (9 slices)\nSriracha\nTogarashi\nPonzu sauce\nGreen onions\nSesame seeds', E'Ribeye sellado poco cocido (9 rebanadas)\nSriracha\nTogarashi\nSalsa ponzu\nCebollín\nSemillas de sésamo',
    array['soy','sesame','fish'], 'Served rare — confirm the guest is comfortable with rare beef before submitting.', 'Se sirve poco cocido — confirma que el cliente esté cómodo con carne cruda antes de mandar el pedido.',
    'The starter that converts sushi skeptics — great for beef lovers hesitant about raw fish.', 'El aperitivo que convence a escépticos del sushi — ideal para amantes de la carne dudosos del pescado crudo.',
    '$14.50', 10
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Beef Tataki');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Red Snapper Sashimi Appetizer', 'Sashimi de Huachinango', '(6 pc.) Red snapper sashimi.', '(6 pzas) Sashimi de huachinango.',
    E'Fresh red snapper (6 slices)\nGrated daikon\nShiso leaf\nWasabi and pickled ginger', E'Huachinango fresco (6 rebanadas)\nDaikon rallado\nHoja de shiso\nWasabi y jengibre encurtido',
    array['fish'], 'Light, clean starter — good for guests who want to taste raw fish without commitment.', 'Aperitivo ligero y limpio — bueno para clientes que quieren probar pescado crudo sin comprometerse.',
    'Pair with a Ginjo sake to bring out the sweetness.', 'Combina con un sake Ginjo para resaltar la dulzura.',
    '$12.50', 20
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Red Snapper Sashimi Appetizer');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Salmon Sashimi Appetizer', 'Sashimi de Salmón', '(6 pc.) Salmon sashimi.', '(6 pzas) Sashimi de salmón.',
    E'Fresh salmon (6 slices)\nGrated daikon\nShiso leaf\nWasabi and pickled ginger', E'Salmón fresco (6 rebanadas)\nDaikon rallado\nHoja de shiso\nWasabi y jengibre encurtido',
    array['fish'], 'Ichiban''s salmon is Atlantic — buttery and mild. Confirm slice count with the guest.', 'El salmón de Ichiban es del Atlántico — mantecoso y suave. Confirma el número de piezas con el cliente.',
    'Best entry-point sashimi — offer it first for sashimi rookies.', 'El sashimi ideal para principiantes — ofrécelo primero a nuevos comensales.',
    '$14.00+', 30
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Salmon Sashimi Appetizer');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Sashimi Sampler', 'Muestra de Sashimi', 'Variety of fresh fish.', 'Variedad de pescados frescos.',
    E'Tuna, salmon, yellowtail, and rotating chef''s selection\nGrated daikon\nShiso leaf\nWasabi and pickled ginger', E'Atún, salmón, yellowtail y selección rotativa del chef\nDaikon rallado\nHoja de shiso\nWasabi y jengibre encurtido',
    array['fish'], 'Ask the sushi bar which extra fish is in today''s sampler before answering guest questions.', 'Pregunta en la barra de sushi qué pescado extra está en la muestra de hoy antes de responderle al cliente.',
    'Best way to introduce a table to sashimi — one plate, everyone gets a taste.', 'La mejor forma de introducir a una mesa al sashimi — un solo plato, todos prueban.',
    '$16.50', 40
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Sashimi Sampler');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Sushi Sampler', 'Muestra de Sushi', 'Assortment of nigiri sushi.', 'Variedad de sushi nigiri.',
    E'Assorted nigiri (chef''s pick — usually tuna, salmon, yellowtail, shrimp, and one more)\nWasabi and pickled ginger', E'Nigiri variado (elección del chef — usualmente atún, salmón, yellowtail, camarón y uno más)\nWasabi y jengibre encurtido',
    array['fish','shellfish','soy'], 'Rice underneath, fish on top — the pairing they''ll see at the sushi bar.', 'Arroz debajo, pescado encima — lo que verán en la barra de sushi.',
    'Great "let me try a bit of everything" plate.', 'Ideal para "quiero probar un poco de todo".',
    '$13.50', 50
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Sushi Sampler');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Tuna Sashimi Appetizer', 'Sashimi de Atún', '(6 pc.) Tuna sashimi.', '(6 pzas) Sashimi de atún.',
    E'Fresh yellowfin tuna (6 slices)\nGrated daikon\nShiso leaf\nWasabi and pickled ginger', E'Atún yellowfin fresco (6 rebanadas)\nDaikon rallado\nHoja de shiso\nWasabi y jengibre encurtido',
    array['fish'], 'Tuna is deep red — visually the most striking sashimi. Show it off when running.', 'El atún es rojo intenso — visualmente el sashimi más impactante. Presúmelo al servir.',
    'Highest-margin sashimi — worth suggesting to guests who want the classic.', 'Sashimi con más margen — vale la pena sugerirlo a clientes que quieren el clásico.',
    '$17.50', 60
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Tuna Sashimi Appetizer');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Tuna Tataki', 'Tuna Tataki (Atún Marinado)', '(9 pc.) Thinly sliced tuna topped with ponzu sauce, masago, Sriracha, green onions, and sesame seeds.', '(9 pzas) Atún rebanado fino cubierto con ponzu, masago, sriracha, cebollín y semillas de sésamo.',
    E'Seared tuna (9 slices)\nPonzu sauce\nMasago\nSriracha\nGreen onions\nSesame seeds', E'Atún sellado (9 rebanadas)\nSalsa ponzu\nMasago\nSriracha\nCebollín\nSemillas de sésamo',
    array['fish','soy','sesame'], 'Seared on the outside, raw in the center — explain if the guest asks.', 'Sellado por fuera, crudo por dentro — explícalo si el cliente pregunta.',
    'Perfect middle-ground plate: not fully raw, not fully cooked. Great transitional dish.', 'Plato intermedio perfecto: ni completamente crudo, ni completamente cocido. Ideal para transicionar.',
    '$15.50', 70
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Tuna Tataki');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Yellow Tail Sashimi Appetizer', 'Sashimi de Yellowtail', '(6 pc.) Yellowtail sashimi.', '(6 pzas) Sashimi de yellowtail (hamachi).',
    E'Fresh yellowtail (hamachi) (6 slices)\nGrated daikon\nShiso leaf\nWasabi and pickled ginger', E'Yellowtail (hamachi) fresco (6 rebanadas)\nDaikon rallado\nHoja de shiso\nWasabi y jengibre encurtido',
    array['fish'], 'Yellowtail is a customer favorite — richer flavor than salmon, milder than tuna.', 'El yellowtail es favorito del cliente — más sabor que el salmón, más suave que el atún.',
    'Sushi bar''s choice for anyone who wants "the best fish."', 'La elección de la barra para quien quiera "el mejor pescado".',
    '$15.00', 80
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Yellow Tail Sashimi Appetizer');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_cold, ichiban_id, 'Yellowtail Yuzu', 'Yellowtail Yuzu', '(9 pc.) Thinly sliced yellowtail, jalapeños, sweet red onions, cilantro, and yuzu vinaigrette.', '(9 pzas) Yellowtail rebanado fino, jalapeños, cebolla morada dulce, cilantro y vinagreta de yuzu.',
    E'Yellowtail (hamachi) (9 slices)\nJalapeños\nSweet red onions\nCilantro\nYuzu vinaigrette', E'Yellowtail (hamachi) (9 rebanadas)\nJalapeños\nCebolla morada dulce\nCilantro\nVinagreta de yuzu',
    array['fish','soy'], 'Bright, citrusy dish — pitch as "sushi meets ceviche."', 'Platillo cítrico y refrescante — véndelo como "sushi que se encuentra con ceviche".',
    'A Ya-Ya''s style favorite — Baton Rouge guests love this one.', 'Favorito estilo Ya-Ya — a los clientes de Baton Rouge les encanta.',
    '$15.50', 90
  where not exists (select 1 from menu_items where category_id = cat_cold and name = 'Yellowtail Yuzu');

  -- ============================================================
  -- SALADS
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Cucumber Krab Salad', 'Ensalada de Pepino y Cangrejo', 'Thinly sliced cucumber tossed with our house-made ponzu sauce. Topped with crab stick and sesame seeds.', 'Pepino rebanado fino con nuestra salsa ponzu casera. Cubierto con kanikama y semillas de sésamo.',
    E'Cucumber\nHouse ponzu sauce\nCrab stick (imitation crab)\nSesame seeds', E'Pepino\nSalsa ponzu casera\nKanikama (cangrejo imitación)\nSemillas de sésamo',
    array['shellfish','fish','soy','sesame','wheat'], 'Light, crisp — good side for a heavier entrée.', 'Ligero, crujiente — buena guarnición para un platillo principal más pesado.',
    'Add-on for teriyaki dinners.', 'Complemento para las cenas de teriyaki.',
    '$9.00', 10
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Cucumber Krab Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Cucumber Salad', 'Ensalada de Pepino', 'Thinly sliced cucumber tossed with our house-made ponzu sauce and sesame seeds.', 'Pepino rebanado fino con nuestra salsa ponzu casera y semillas de sésamo.',
    E'Cucumber\nHouse ponzu sauce\nSesame seeds', E'Pepino\nSalsa ponzu casera\nSemillas de sésamo',
    array['soy','sesame','fish','wheat'], 'Simplest salad — light, refreshing. Naturally vegetarian.', 'La ensalada más simple — ligera y refrescante. Naturalmente vegetariana.',
    'Cheapest palate cleanser between sashimi courses.', 'El acompañante más económico para limpiar el paladar entre platos de sashimi.',
    '$6.00', 20
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Cucumber Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Ichiban Salad', 'Ensalada Ichiban', 'Mixed greens tossed in our house-made ginger dressing. Topped with crispy noodles.', 'Verduras mixtas con nuestro aderezo casero de jengibre. Cubierto con fideos crujientes.',
    E'Mixed greens\nGinger dressing (ginger, carrot, onion, soy, rice vinegar, sesame oil)\nCrispy chow mein noodles', E'Verduras mixtas\nAderezo de jengibre (jengibre, zanahoria, cebolla, soya, vinagre de arroz, aceite de sésamo)\nFideos chow mein crujientes',
    array['soy','wheat','sesame'], 'The house salad — signature ginger dressing is the star. Guests ask for extra dressing all the time.', 'La ensalada de la casa — el aderezo de jengibre es la estrella. Los clientes piden aderezo extra frecuentemente.',
    'Automatic first-suggestion for anyone browsing the menu.', 'Recomendación automática para quien navegue el menú.',
    '$12.00', 30
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Ichiban Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Sashimi Salad', 'Ensalada de Sashimi', 'Mixed greens with assorted sashimi, masago, and wasabi tobiko tossed in our house-made ponzu vinaigrette.', 'Verduras mixtas con sashimi variado, masago y wasabi tobiko con nuestra vinagreta ponzu casera.',
    E'Mixed greens\nAssorted sashimi (tuna, salmon, yellowtail)\nMasago\nWasabi tobiko\nHouse ponzu vinaigrette', E'Verduras mixtas\nSashimi variado (atún, salmón, yellowtail)\nMasago\nWasabi tobiko\nVinagreta ponzu casera',
    array['fish','soy','sesame'], 'Full meal in a bowl — good option for guests avoiding rice/carbs.', 'Comida completa en un tazón — buena opción para clientes que evitan arroz/carbohidratos.',
    'Pitch as the "low-carb sashimi plate" for keto-minded guests.', 'Véndelo como "el plato de sashimi bajo en carbohidratos" para clientes keto.',
    '$17.00', 40
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Sashimi Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Seafood Salad', 'Ensalada de Mariscos', 'Sliced cucumber, crab, whitefish, katsuobushi, salmon, tuna, octopus, sesame seeds, masago, and green onions tossed in our house-made ponzu sauce.', 'Pepino rebanado, cangrejo, pescado blanco, katsuobushi, salmón, atún, pulpo, semillas de sésamo, masago y cebollín con nuestra salsa ponzu casera.',
    E'Cucumber\nSnow crab\nWhitefish\nKatsuobushi (bonito flakes)\nSalmon\nTuna\nOctopus\nSesame seeds\nMasago\nGreen onions\nHouse ponzu sauce', E'Pepino\nKanikama\nPescado blanco\nKatsuobushi (hojuelas de bonito)\nSalmón\nAtún\nPulpo\nSemillas de sésamo\nMasago\nCebollín\nSalsa ponzu casera',
    array['fish','shellfish','soy','sesame'], 'Kitchen-sink seafood plate — great for adventurous eaters.', 'Plato de mariscos "todo incluido" — ideal para comensales aventureros.',
    'The most seafood on any single salad — worth calling out.', 'La ensalada con más mariscos del menú — vale la pena mencionarlo.',
    '$11.00', 50
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Seafood Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Seaweed Salad', 'Ensalada de Algas', 'Mixed seaweed tossed in sesame dressing.', 'Algas mixtas con aderezo de sésamo.',
    E'Marinated seaweed (wakame)\nSesame dressing\nSesame seeds', E'Algas marinadas (wakame)\nAderezo de sésamo\nSemillas de sésamo',
    array['soy','sesame','wheat'], 'Bright green, chilled — visual pop on the table.', 'Verde brillante, servido frío — resalta visualmente en la mesa.',
    'Vegan-friendly starter. Pitch to anyone asking about vegetarian options.', 'Aperitivo vegano. Recomiéndalo a quien pregunte por opciones vegetarianas.',
    '$6.50', 60
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Seaweed Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Snow Krab Salad', 'Ensalada de Kanikama', 'Snow crab mix topped with sliced avocado, masago, and sesame seeds.', 'Mezcla de kanikama cubierta con aguacate rebanado, masago y semillas de sésamo.',
    E'Snow crab mix (kanikama + mayo)\nSliced avocado\nMasago\nSesame seeds', E'Mezcla de kanikama (kanikama + mayonesa)\nAguacate rebanado\nMasago\nSemillas de sésamo',
    array['shellfish','fish','egg','wheat','sesame'], 'Not real snow crab — this is the imitation krab mix. Clarify if asked.', 'No es cangrejo de nieve real — es la mezcla de kanikama imitación. Aclara si preguntan.',
    'Sushi-lite starter for guests who like the flavor but don''t want raw fish.', 'Aperitivo estilo sushi para clientes que quieren el sabor pero no el pescado crudo.',
    '$9.50', 70
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Snow Krab Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Spicy Salmon Salad', 'Ensalada de Salmón Picante', 'Sliced cucumbers, diced salmon, avocado, masago, and green onions tossed with our house-made ponzu sauce.', 'Pepino rebanado, salmón en cubos, aguacate, masago y cebollín con nuestra salsa ponzu casera.',
    E'Cucumber\nDiced fresh salmon\nAvocado\nMasago\nGreen onions\nHouse ponzu\nSpicy sauce', E'Pepino\nSalmón fresco en cubos\nAguacate\nMasago\nCebollín\nSalsa ponzu casera\nSalsa picante',
    array['fish','soy','sesame'], 'Diced salmon = smaller pieces than sashimi. Confirm heat level with the guest.', 'Salmón en cubos = piezas más pequeñas que el sashimi. Confirma el nivel de picante con el cliente.',
    'Sister to Spicy Tuna Salad — offer both if the table is split on fish preference.', 'Hermana de la Ensalada de Atún Picante — ofrece ambas si la mesa se divide en preferencia de pescado.',
    '$12.00', 80
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Spicy Salmon Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Spicy Tuna Salad', 'Ensalada de Atún Picante', 'Sliced cucumbers, diced tuna, avocado, masago, and green onions tossed with our house-made ponzu sauce.', 'Pepino rebanado, atún en cubos, aguacate, masago y cebollín con nuestra salsa ponzu casera.',
    E'Cucumber\nDiced fresh tuna\nAvocado\nMasago\nGreen onions\nHouse ponzu\nSpicy sauce', E'Pepino\nAtún fresco en cubos\nAguacate\nMasago\nCebollín\nSalsa ponzu casera\nSalsa picante',
    array['fish','soy','sesame'], 'Fresh tuna, medium heat. Ask about their spice tolerance if it seems relevant.', 'Atún fresco, picante medio. Pregunta por su tolerancia al picante si aplica.',
    'One of the biggest sellers in this category.', 'Uno de los más vendidos en esta categoría.',
    '$12.00', 90
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Spicy Tuna Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Squid Salad', 'Ensalada de Calamar', 'Marinated tender squid tossed in a sesame dressing.', 'Calamar tierno marinado con aderezo de sésamo.',
    E'Marinated squid\nSesame dressing\nSesame seeds', E'Calamar marinado\nAderezo de sésamo\nSemillas de sésamo',
    array['shellfish','soy','sesame'], 'Chewy texture is intentional — great for regulars, warn newcomers.', 'La textura chiclosa es intencional — perfecta para clientes frecuentes, advierte a nuevos.',
    'Pair with a chilled sake to bring out the umami.', 'Combina con un sake frío para resaltar el umami.',
    '$7.50', 100
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Squid Salad');

  insert into menu_items (category_id, restaurant_id, name, name_es, description, description_es, ingredients, ingredients_es, allergens, prep_notes, prep_notes_es, upsell_note, upsell_note_es, price, sort_order)
  select cat_salads, ichiban_id, 'Takosu Salad', 'Takosu (Ensalada de Pulpo)', 'Thinly sliced octopus with thinly sliced lemon, cucumber, wakame, and green onions with our house-made ponzu sauce.', 'Pulpo rebanado fino con limón, pepino, wakame y cebollín, con nuestra salsa ponzu casera.',
    E'Thinly sliced octopus\nLemon slices\nCucumber\nWakame (seaweed)\nGreen onions\nHouse ponzu sauce', E'Pulpo rebanado fino\nRodajas de limón\nPepino\nWakame (alga)\nCebollín\nSalsa ponzu casera',
    array['shellfish','soy','sesame'], 'Tender, citrus-forward — this is the octopus for people who "don''t like octopus."', 'Tierno con toque cítrico — este es el pulpo para quienes "no les gusta el pulpo".',
    'A regulars'' favorite. Worth mentioning by name.', 'Favorito de los clientes frecuentes. Vale la pena mencionarlo por nombre.',
    '$12.00', 110
  where not exists (select 1 from menu_items where category_id = cat_salads and name = 'Takosu Salad');

  -- ============================================================
  -- SUSHI ROLLS
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Avocado Roll', 'Avocado inside a rice + nori roll.',
    E'Sushi rice\nNori\nAvocado', array['soy','sesame'],
    'Vegetarian. Great for kids or first-time sushi eaters.',
    'Add-on for a table wanting a lighter roll to balance a heavy specialty.',
    '$4.75', 10
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Avocado Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'BBQ Yellow Tail Roll', 'Cucumber, masago, BBQ yellowtail, benito flakes, and green onions. Topped with eel sauce and sesame seeds.',
    E'Sushi rice\nNori\nCucumber\nMasago\nBBQ yellowtail (seared with sauce)\nBonito flakes\nGreen onions\nEel sauce\nSesame seeds', array['fish','soy','sesame'],
    'Yellowtail is torched with BBQ glaze — smoky and sweet finish.',
    'Great alt for guests who like teriyaki flavors and are curious about sushi.',
    '$6.75', 20
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'BBQ Yellow Tail Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Boston Hand Roll', 'Hand-rolled cone with salmon, avocado, and lettuce.',
    E'Sushi rice\nNori (cone-shaped)\nFresh salmon\nAvocado\nLettuce\nMayo', array['fish','soy','egg','sesame'],
    'Hand roll = cone shape, meant to eat with your hands right away. Explain to first-timers.',
    'Great grab-and-go option for lunch guests in a hurry.',
    '$8.00+', 30
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Boston Hand Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'California Roll', 'Avocado, cucumber, crab stick, and masago.',
    E'Sushi rice\nNori\nAvocado\nCucumber\nCrab stick (imitation)\nMasago', array['shellfish','fish','egg','wheat','soy','sesame'],
    'The universal beginner roll. No raw fish. Confirm this if a guest is nervous.',
    'Always order for a table with sushi first-timers.',
    '$6.00', 40
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'California Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Crawfish Roll', 'Spicy crawfish.',
    E'Sushi rice\nNori\nSpicy crawfish (crawfish + spicy mayo)\nGreen onions', array['shellfish','egg','soy','sesame'],
    'Local Louisiana crossover — always pitch to Baton Rouge guests.',
    'A regular favorite. Confirm heat level if guest is spice-shy.',
    '$7.50', 50
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Crawfish Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Crunchy Dynamite Roll', 'Assortment of fish mixed in chili sauce with tempura flakes.',
    E'Sushi rice\nNori\nAssorted fish (tuna, salmon, yellowtail)\nChili sauce\nTempura flakes', array['fish','egg','wheat','soy','sesame'],
    'Assorted fish rotates — check the sushi bar if guest asks what''s in it.',
    'For guests who want the Dynamite Roll with extra crunch.',
    '$6.75', 60
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Crunchy Dynamite Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Crunchy Roll', 'Snow crab and tempura flakes.',
    E'Sushi rice\nNori\nSnow crab mix\nTempura flakes\nEel sauce drizzle', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Simple, kid-friendly, no raw fish. Great starter roll.',
    'Featured item on Toast — worth calling out.',
    '$6.00', 70
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Crunchy Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Cucumber Roll', 'Cucumber sesame seeds.',
    E'Sushi rice\nNori\nCucumber\nSesame seeds', array['soy','sesame'],
    'Vegetarian, gluten-free (confirm no cross-contact if guest asks).',
    'The lightest roll on the menu.',
    '$4.75', 80
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Cucumber Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Dragon Roll', 'Cucumber, avocado, masago, and crab stick. Topped with BBQ eel and avocado.',
    E'Sushi rice\nNori\nCucumber\nAvocado\nMasago\nCrab stick\nBBQ eel (unagi)\nAvocado slices on top\nEel sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Dragon-scale plating with avocado — highlight when running the plate.',
    'One of our most photographed rolls — great for a table celebrating.',
    '$12.75', 90
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Dragon Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Dynamite Roll', 'Assortment of fish mixed in a chili sauce.',
    E'Sushi rice\nNori\nAssorted fish\nChili sauce', array['fish','soy','sesame'],
    'Base of the Crunchy Dynamite — no tempura flakes on this one.',
    'Great for spice fans who want a lighter roll.',
    '$6.75', 100
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Dynamite Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Futomaki Roll', 'Tomago, crab stick, cucumber, avocado, asparagus, Japanese pickles, masago, and sesame seeds.',
    E'Sushi rice\nNori\nTamago (sweet egg)\nCrab stick\nCucumber\nAvocado\nAsparagus\nJapanese pickles\nMasago\nSesame seeds', array['shellfish','fish','egg','soy','sesame'],
    'Big, thick "traditional" style roll. Wider than most.',
    'Great for guests who want a fully-loaded roll without raw fish.',
    '$10.25', 110
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Futomaki Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Miami Roll', 'Fresh salmon, avocado, mango, and masago.',
    E'Sushi rice\nNori\nFresh salmon\nAvocado\nMango\nMasago', array['fish','soy','sesame'],
    'Fruit + fish combo — sweet and light.',
    'Summertime favorite. Pitch during warm months.',
    '$8.00', 120
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Miami Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Philadelphia Roll', 'Cream cheese, avocado, smoked salmon, and scallions.',
    E'Sushi rice\nNori\nCream cheese\nAvocado\nSmoked salmon\nScallions', array['fish','dairy','soy','sesame'],
    'Smoked salmon (not raw) — good for guests unsure about raw fish.',
    'Great gateway roll for people who like bagels + lox.',
    '$7.00', 130
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Philadelphia Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Rainbow Roll', 'Snow crab, avocado, and asparagus. Topped with tuna, salmon, and yellowtail.',
    E'Sushi rice\nNori\nSnow crab\nAvocado\nAsparagus\nTuna (on top)\nSalmon (on top)\nYellowtail (on top)', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Multi-colored fish on top — visually striking. Show it off when running.',
    'A best-seller. Great one-roll intro to sashimi-quality fish.',
    '$13.75', 140
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Rainbow Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Rice Paper Roll', 'Lettuce, avocado, asparagus, tuna, masago, and crab stick wrapped in rice paper. Served with a hoisin dipping sauce. *Sauce contains peanuts.',
    E'Rice paper wrapper (no rice, no nori)\nLettuce\nAvocado\nAsparagus\nTuna\nMasago\nCrab stick\nHoisin dipping sauce (contains peanuts)', array['fish','shellfish','peanut','soy','sesame'],
    'PEANUT ALLERGY WARNING — hoisin sauce contains peanuts. Confirm with guest before submitting.',
    'The only rice paper roll — worth mentioning if guest is curious about lighter options.',
    '$9.00', 150
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Rice Paper Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Rock & Roll', 'Snow crab, tempura fried shrimp, avocado, and masago. Topped with eel sauce.',
    E'Sushi rice\nNori\nSnow crab\nTempura fried shrimp\nAvocado\nMasago\nEel sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Featured item on Toast. All cooked/imitation — no raw fish.',
    'One of our top three sellers. Always safe to recommend.',
    '$9.25', 160
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Rock & Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Salmon Roll', 'Salmon, avocado, scallions, and masago.',
    E'Sushi rice\nNori\nFresh salmon\nAvocado\nScallions\nMasago', array['fish','soy','sesame'],
    'Clean, classic salmon roll.',
    'Beginner-friendly raw fish roll.',
    '$6.75', 170
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Salmon Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Salmon Skin Roll', 'Japanese pickles, masago, benito flakes, scallions, cucumber, and crispy salmon skin.',
    E'Sushi rice\nNori\nCrispy salmon skin\nJapanese pickles\nMasago\nBonito flakes\nScallions\nCucumber', array['fish','soy','sesame'],
    'Salmon skin is roasted/crispy — no raw fish, but rich flavor.',
    'Great for adventurous eaters who want texture and umami.',
    '$5.25', 180
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Salmon Skin Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Shrimp Tempura Roll', 'Tempura fried shrimp, avocado, cucumber, and masago. Topped with eel sauce and sesame seeds.',
    E'Sushi rice\nNori\nTempura fried shrimp\nAvocado\nCucumber\nMasago\nEel sauce\nSesame seeds', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Cooked shrimp — no raw fish. Universal crowd-pleaser.',
    'Second-safest first roll after California.',
    '$8.75', 190
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Shrimp Tempura Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Smoked Salmon Roll', 'Smoked salmon and avocado.',
    E'Sushi rice\nNori\nSmoked salmon\nAvocado', array['fish','soy','sesame'],
    'Smoked (not raw) salmon — good for the raw-fish-hesitant.',
    'Pair with a Philadelphia roll for a "cold cure" combo.',
    '$6.75', 200
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Smoked Salmon Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Snow Crab Roll', 'Snow crab, avocado, and asparagus.',
    E'Sushi rice\nNori\nSnow crab mix\nAvocado\nAsparagus', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Imitation snow crab mix — clarify if asked.',
    'A step up from the California for guests who want more crab flavor.',
    '$6.75', 210
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Snow Crab Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Soft Shell Crab Roll', 'Tempura fried soft-shell crab with cucumber, avocado, and eel sauce.',
    E'Sushi rice\nNori\nTempura fried soft-shell crab (whole)\nCucumber\nAvocado\nMasago\nEel sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Whole soft-shell crab means legs may stick out — warn the guest so it doesn''t surprise them.',
    'Textural fan-favorite. Great for someone who wants crunch.',
    '$9.00', 220
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Soft Shell Crab Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Special Eel Roll', 'BBQ eel, cucumber, avocado, and masago. Topped with eel sauce.',
    E'Sushi rice\nNori\nBBQ eel (unagi)\nCucumber\nAvocado\nMasago\nEel sauce', array['fish','shellfish','soy','sesame'],
    'BBQ eel is cooked — sweet, smoky. Not raw.',
    'For guests who like teriyaki flavors.',
    '$6.50', 230
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Special Eel Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Spicy Salmon Roll', 'Salmon mixed in spicy chili sauce and green onions.',
    E'Sushi rice\nNori\nFresh salmon\nSpicy chili sauce\nGreen onions', array['fish','soy','sesame'],
    'Confirm heat tolerance with the guest.',
    'One of the top spicy rolls.',
    '$6.75', 240
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Spicy Salmon Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Spicy Shrimp Roll', 'Steamed shrimp, cucumber, and chili sauce.',
    E'Sushi rice\nNori\nSteamed shrimp\nCucumber\nChili sauce', array['shellfish','soy','sesame'],
    'Steamed shrimp — cooked, no raw fish. Milder spice than tuna/salmon versions.',
    'Cooked spicy option for guests who don''t want raw fish.',
    '$6.50', 250
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Spicy Shrimp Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Spicy Tuna Roll', 'Tuna mixed in spicy chili sauce and green onions.',
    E'Sushi rice\nNori\nFresh tuna\nSpicy chili sauce\nGreen onions', array['fish','soy','sesame'],
    'One of the top-selling classic rolls. Confirm heat tolerance.',
    'Universal upsell. If guest hesitates on ordering, this closes the deal.',
    '$6.75', 260
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Spicy Tuna Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Spring Roll', 'Cucumber, avocado, tomago, masago, fried onions, asparagus, and masago wrapped in rice paper. Served with a side of naruto sauce.',
    E'Rice paper wrapper (no rice)\nCucumber\nAvocado\nTamago (sweet egg)\nMasago\nFried onions\nAsparagus\nNaruto sauce', array['fish','egg','soy','sesame'],
    'Rice paper — no sushi rice inside. Lighter option.',
    'Good for vegetarians (confirm — has masago/egg).',
    '$8.50', 270
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Spring Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Summer Roll', 'Fresh salmon, crab stick, cucumber, avocado, lettuce, asparagus, masago, and mango wrapped in rice paper. Served with a naruto dipping sauce.',
    E'Rice paper wrapper (no rice)\nFresh salmon\nCrab stick\nCucumber\nAvocado\nLettuce\nAsparagus\nMasago\nMango\nNaruto dipping sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Rice paper, no rice — a very light "salad in a roll" style.',
    'Best summer-season roll on the menu.',
    '$9.00', 280
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Summer Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Tokyo Roll', 'Tuna, snow crab, and avocado. Topped with sesame seeds and eel sauce.',
    E'Sushi rice\nNori\nFresh tuna\nSnow crab\nAvocado\nSesame seeds\nEel sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Simple, clean flavors. Tuna is raw.',
    'Middle-of-the-menu safe bet for guests who want fresh fish.',
    '$8.25', 290
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Tokyo Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Tuna Roll', 'Tuna.',
    E'Sushi rice\nNori\nFresh tuna', array['fish','soy'],
    'Purist''s roll — just rice, nori, and tuna. Nothing else.',
    'For guests who want to taste the fish clean.',
    '$7.00', 300
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Tuna Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Vegetable Roll', 'Avocado, cucumber, asparagus plus 3 types of japanese pickles wrapped in rice and seaweed.',
    E'Sushi rice\nNori\nAvocado\nCucumber\nAsparagus\n3 types of Japanese pickles', array['soy','sesame'],
    'Vegan-friendly. Confirm with sushi bar that no bonito is added.',
    'Only fully vegetarian roll worth calling out.',
    '$6.00', 310
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Vegetable Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Yellow Tail Roll', 'Masago, avocado, yellowtail, and green onions.',
    E'Sushi rice\nNori\nYellowtail (hamachi)\nMasago\nAvocado\nGreen onions', array['fish','soy','sesame'],
    'Raw yellowtail. Clean flavor.',
    'Regular favorite. Great for yellowtail fans.',
    '$7.00', 320
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Yellow Tail Roll');

  -- Naruto rolls (wrapped in cucumber instead of nori/rice)
  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Kani Naruto', 'Crab stick, masago, and avocado wrapped in cucumber. Served with naruto sauce.',
    E'Cucumber wrapper (no rice, no nori)\nCrab stick\nMasago\nAvocado\nNaruto sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Naruto style = cucumber wrap, no rice. Low-carb option.',
    'Great for keto/low-carb guests. Pitch it that way.',
    '$10.50', 330
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Kani Naruto');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Salmon Naruto', 'Salmon, masago, and avocado wrapped in cucumber. Served with ponzu sauce.',
    E'Cucumber wrapper (no rice, no nori)\nFresh salmon\nMasago\nAvocado\nPonzu sauce', array['fish','soy','sesame'],
    'No rice, no nori. Raw salmon inside.',
    'Keto/low-carb salmon roll.',
    '$11.50', 340
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Salmon Naruto');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Snow Crab Naruto', 'Snow crab, avocado, and asparagus wrapped in cucumber. Served with naruto sauce.',
    E'Cucumber wrapper (no rice, no nori)\nSnow crab mix\nAvocado\nAsparagus\nNaruto sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'No rice, no nori. Imitation snow crab.',
    'Great low-carb intro roll — no raw fish.',
    '$10.50', 350
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Snow Crab Naruto');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Tuna Naruto', 'Tuna, avocado, and masago wrapped in cucumber. Served with ponzu sauce.',
    E'Cucumber wrapper (no rice, no nori)\nFresh tuna\nAvocado\nMasago\nPonzu sauce', array['fish','soy','sesame'],
    'No rice, no nori. Raw tuna inside.',
    'Keto/low-carb tuna option.',
    '$12.25', 360
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Tuna Naruto');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rolls, ichiban_id, 'Yellowtail Naruto', 'Yellowtail, masago, and Avocado wrapped in cucumber. Served with ponzu sauce.',
    E'Cucumber wrapper (no rice, no nori)\nYellowtail (hamachi)\nMasago\nAvocado\nPonzu sauce', array['fish','soy','sesame'],
    'No rice, no nori. Raw yellowtail.',
    'Keto/low-carb yellowtail lover''s pick.',
    '$11.75', 370
  where not exists (select 1 from menu_items where category_id = cat_rolls and name = 'Yellowtail Naruto');

  -- ============================================================
  -- SPECIALTY ROLLS
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Aphrodite Roll', 'Shrimp tempura, cream cheese, cucumber and mango wrapped in soy paper. Topped with snow crab, strawberry, kiwi, creamy strawberry sauce and toasted coconut.',
    E'Soy paper wrapper\nShrimp tempura\nCream cheese\nCucumber\nMango\nSnow crab\nStrawberry\nKiwi\nCreamy strawberry sauce\nToasted coconut', array['shellfish','fish','dairy','egg','wheat','soy','sesame','tree_nut'],
    'Coconut is a tree nut — flag for allergy-sensitive guests.',
    'Dessert-like specialty roll. Great for birthdays or date nights.',
    '$14.75', 10
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Aphrodite Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Bayou Roll', 'Soft-shell crab and avocado topped with spicy tuna, crunchy flakes, masago, scallions, and eel sauce.',
    E'Sushi rice\nNori\nTempura soft-shell crab\nAvocado\nSpicy tuna\nCrunchy flakes\nMasago\nScallions\nEel sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Louisiana crossover — always pitch to Baton Rouge guests.',
    'The soft-shell crab lover''s specialty roll.',
    '$14.75', 20
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Bayou Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Caliente Roll', 'Tuna and guacamole mix wrapped in soy paper.',
    E'Soy paper wrapper\nFresh tuna\nGuacamole mix\nSpicy sauce', array['fish','soy','sesame'],
    'Confirm heat level. No rice/nori — wrapped in soy paper.',
    'For guests who want fresh tuna with a Mexican-inspired twist.',
    '$15.00', 30
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Caliente Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Death Valley Roll', 'Extremely spicy specialty roll. Assortment of hot sauces and hot toppings.',
    E'Sushi rice\nNori\nSpicy fish mix\nHabanero chili sauce\nSriracha\nHabanero masago\nJalapeños\nWasabi tobiko', array['fish','soy','sesame'],
    'EXTREME SPICE — warn every guest before submitting. Not for the faint of heart.',
    'For the ones who ask for the spiciest thing on the menu.',
    '$15.00', 40
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Death Valley Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Fiesta Roll', 'A colorful specialty roll — details vary by sushi bar. Check with the chef if guests ask for specifics.',
    E'Sushi rice\nNori\nAssorted fish and toppings (check with sushi bar)', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Confirm current build with the sushi bar before answering guest ingredient questions.',
    'Ask the chef what''s in it tonight — variety keeps it fresh.',
    '$14.75', 50
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Fiesta Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Fire in the hole Roll', 'Tempura shrimp, avocado, cream cheese, and jalapeños on the inside. Topped with snow crab, tuna, avocado, habanero chili sauce, spicy ponzu, wasabi tobiko, and habanero masago.',
    E'Sushi rice\nNori\nTempura shrimp\nAvocado\nCream cheese\nJalapeños\nSnow crab\nTuna\nHabanero chili sauce\nSpicy ponzu\nWasabi tobiko\nHabanero masago', array['fish','shellfish','dairy','egg','wheat','soy','sesame'],
    'EXTREME SPICE with habanero — warn heat-sensitive guests firmly.',
    'Hottest premium specialty roll. Ideal for spice-seekers who want more than heat — this has flavor too.',
    '$19.00', 60
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Fire in the hole Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Fried Snapper Roll', 'Snow crab, avocado, masago, cream cheese, tempura fried snapper with a side of our in-house seafood sauce.',
    E'Sushi rice\nNori\nSnow crab\nAvocado\nMasago\nCream cheese\nTempura fried red snapper\nSeafood/yum yum sauce', array['fish','shellfish','dairy','egg','wheat','soy','sesame'],
    'Fried snapper — no raw fish. Good for the fried-fish-loving crowd.',
    'Great for New Orleans-style seafood fans.',
    '$13.75', 70
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Fried Snapper Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'He Roll', 'Snow crab, tuna, avocado, obba mint leaf, and Red Onions on the inside. Topped with tuna, yellowtail, jalapeño, and our house-made yuzu vinaigrette.',
    E'Sushi rice\nNori\nSnow crab\nTuna\nAvocado\nObba (shiso) mint leaf\nRed onions\nTuna (on top)\nYellowtail (on top)\nJalapeño\nYuzu vinaigrette', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Shiso leaf (obba) has a distinct anise/mint flavor — mention if guest hasn''t had it.',
    'Great for guests who want bright, citrusy sushi.',
    '$16.25', 80
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'He Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Ichiban Roll', 'Our most popular roll. Seared peppered tuna and avocado on the inside. Topped with wasabi tobiko, snow crab, crunchy flakes, and eel sauce.',
    E'Sushi rice\nNori\nSeared peppered tuna\nAvocado\nWasabi tobiko\nSnow crab\nCrunchy tempura flakes\nEel sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'THE house signature. Learn it cold — guests ask for "the Ichiban" specifically.',
    'Automatic recommendation for first-time guests. Best seller.',
    '$14.75', 90
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Ichiban Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Japonaise Roll', 'Spicy tuna, cream cheese, avocado, and jalapeños on the inside. Topped with snow crab, tempura fried soft-shell crawfish, and seafood sauce.',
    E'Sushi rice\nNori\nSpicy tuna\nCream cheese\nAvocado\nJalapeños\nSnow crab\nTempura soft-shell crawfish\nSeafood/yum yum sauce', array['fish','shellfish','dairy','egg','wheat','soy','sesame'],
    'Soft-shell crawfish is a Louisiana specialty — worth calling out.',
    'Bayou meets sushi. Great order for locals.',
    '$15.75', 100
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Japonaise Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Katana Roll', 'A layered specialty roll with premium fish. Check sushi bar for tonight''s build.',
    E'Sushi rice\nNori\nAssorted premium fish (check sushi bar)', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Confirm build with sushi bar. Layered, visually striking.',
    'Premium specialty option.',
    '$15.50', 110
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Katana Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Kiss Me Roll', 'Avocado, snow krab, tempura soft-shelled crawfish. Topped with steamed shrimp, smoked salmon, avocado, Japanese honey mustard and green onions.',
    E'Sushi rice\nNori\nAvocado\nSnow crab\nTempura soft-shell crawfish\nSteamed shrimp\nSmoked salmon\nAvocado (on top)\nJapanese honey mustard\nGreen onions', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Sweet + savory finish. All fish is cooked or smoked — no raw.',
    'Great for guests who want the specialty roll experience without raw fish.',
    '$15.00', 120
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Kiss Me Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Lagniappe Roll', 'Spicy tuna, snow crab, avocado, & asparagus. Topped with guacamole, tuna, yellowtail, spicy ponzu, creamy cilantro sauce, cilantro, & truffle oil.',
    E'Sushi rice\nNori\nSpicy tuna\nSnow crab\nAvocado\nAsparagus\nGuacamole\nTuna (on top)\nYellowtail (on top)\nSpicy ponzu\nCreamy cilantro sauce\nCilantro\nTruffle oil', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Lagniappe = "a little extra" in Louisiana French. Premium roll — truffle finish.',
    'Top-tier specialty roll. Great for anniversaries and special occasions.',
    '$19.50', 130
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Lagniappe Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'LSU Roll', 'Tempura fried oysters, snow crab, asparagus, and avocado on the inside. Topped with tempura flakes, and our in-house Purple and Gold LSU sauce.',
    E'Sushi rice\nNori\nTempura fried oysters\nSnow crab\nAsparagus\nAvocado\nTempura flakes\nPurple and Gold LSU sauce (spicy mayo + eel sauce)', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Purple + Gold plating — LSU pride. Automatic sell on game days.',
    'Baton Rouge trademark. Always call out to LSU fans and alumni.',
    '$14.75', 140
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'LSU Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Mango Tango Roll', 'Snow crab and mango wrapped in soy paper. Topped with fresh salmon, mango salsa, spicy ponzu, jalapeño sauce, and lemon zest.',
    E'Soy paper wrapper\nSnow crab\nMango\nFresh salmon (on top)\nMango salsa\nSpicy ponzu\nJalapeño sauce\nLemon zest', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Fruit-forward, bright, citrusy. Soy paper wrap (no nori).',
    'Summer favorite. Pitch to guests who want something bright and refreshing.',
    '$18.00', 150
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Mango Tango Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Mardi Gras Roll', 'Colorful festive specialty roll — sushi bar build. Check with the chef for tonight''s ingredients.',
    E'Sushi rice\nNori\nAssorted colorful toppings (check sushi bar)', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Purple/green/gold plating for Mardi Gras. Confirm build with sushi bar.',
    'Ideal for Mardi Gras season and celebrations. $20 premium tier.',
    '$20.00', 160
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Mardi Gras Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Mistake Roll', 'A sushi bar special — chef''s freestyle roll when something unexpected comes together beautifully.',
    E'Sushi rice\nNori\nChef''s pick — varies daily', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Confirm ingredients with sushi bar before submitting. Great story to tell the guest — "a happy accident."',
    'Adventurous guests love the story. Great for regulars who''ve tried everything.',
    '$11.25', 170
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Mistake Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Moscona Roll', 'Tempura fried shrimp, snow crab, and crushed macadamia nuts on the inside. Topped with garlic butter-seared red snapper, sriracha, yuzu honey, and toasted coconut.',
    E'Sushi rice\nNori\nTempura fried shrimp\nSnow crab\nCrushed macadamia nuts\nGarlic butter-seared red snapper\nSriracha\nYuzu honey\nToasted coconut', array['fish','shellfish','dairy','egg','wheat','soy','sesame','tree_nut'],
    'TREE NUT ALLERGY — macadamia + coconut. Confirm with allergy-sensitive guests.',
    'Rich, buttery, tropical. Great for guests who want something distinctive.',
    '$15.00', 180
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Moscona Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'On The Fly Roll', 'Chef''s freestyle premium roll — check with the sushi bar for tonight''s build.',
    E'Sushi rice\nNori\nPremium fish assortment (chef''s pick — check with sushi bar)', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Freestyle build — confirm ingredients with the sushi bar.',
    'Premium tier ($19). Great for guests who want the chef to surprise them.',
    '$19.00', 190
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'On The Fly Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Pink Lady Roll', 'Spicy salmon, snow crab, asparagus, avocado, and tempura flakes wrapped in a pink soy paper.',
    E'Pink soy paper wrapper\nSpicy salmon\nSnow crab\nAsparagus\nAvocado\nTempura flakes', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Pink soy paper wrap — visually striking. Great photo item.',
    'Pitch to date-night tables. Also popular with bachelorette parties.',
    '$14.75', 200
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Pink Lady Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Popeye Roll', 'Fresh salmon, snow crab, and avocado. Wrapped with baby spinach, rice, and rice paper. Topped with jalapeño sauce and sweet chili sauce.',
    E'Rice paper + baby spinach wrapper\nSushi rice\nFresh salmon\nSnow crab\nAvocado\nJalapeño sauce\nSweet chili sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Baby spinach wrap = the "Popeye" gimmick. Confirm mild spice level.',
    'Different textural experience than a standard roll.',
    '$13.50', 210
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Popeye Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Red Dragon Roll', 'Snow crab and cucumber. Topped with eel, tuna, and eel sauce.',
    E'Sushi rice\nNori\nSnow crab\nCucumber\nBBQ eel (on top)\nFresh tuna (on top)\nEel sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'BBQ eel is cooked; tuna is raw. Explain the mix.',
    'A dragon roll variation — great for guests who liked the standard Dragon and want to try more.',
    '$14.75', 220
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Red Dragon Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Red Stick Roll', 'Snow crab and cucumber. Topped with fresh salmon, tempura flakes, and Sriracha.',
    E'Sushi rice\nNori\nSnow crab\nCucumber\nFresh salmon (on top)\nTempura flakes\nSriracha', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Red Stick = Baton Rouge. Local pride roll.',
    'The Baton Rouge signature. Always call out to local guests.',
    '$14.75', 230
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Red Stick Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Rock & Eel Roll', 'Tempura fried eel, snow crab, avocado, and tempura flakes. Topped with masago and eel sauce.',
    E'Sushi rice\nNori\nTempura fried eel (unagi)\nSnow crab\nAvocado\nTempura flakes\nMasago\nEel sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Fried eel — no raw fish. Sweet + savory.',
    'For guests who like eel and want a crunchy specialty option.',
    '$14.75', 240
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Rock & Eel Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Salmon Zest Roll', 'Snow crab and fresh salmon wrapped in soy paper. Topped with fresh salmon and lemon zest. Served with ponzu sauce.',
    E'Soy paper wrapper\nSnow crab\nFresh salmon (inside)\nFresh salmon (on top)\nLemon zest\nPonzu sauce', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Soy paper wrap. Bright citrus finish from the zest.',
    'For salmon lovers who want a clean, bright roll.',
    '$15.25', 250
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Salmon Zest Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'SLAMMIN SALMON', 'Premium salmon-focused specialty roll — check with the sushi bar for tonight''s build.',
    E'Sushi rice\nNori\nMultiple preparations of salmon (fresh, spicy, seared — check with sushi bar)', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Salmon showcase — confirm current build.',
    'Top-tier salmon lover''s pick. $20 premium.',
    '$20.00', 260
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'SLAMMIN SALMON');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Surf & Turf Roll', 'Tempura fried shrimp, cream cheese, asparagus, and crab stick. Topped with thinly sliced ribeye, teriyaki sauce, Sriracha, and scallions.',
    E'Sushi rice\nNori\nTempura fried shrimp\nCream cheese\nAsparagus\nCrab stick\nThinly sliced ribeye (on top)\nTeriyaki sauce\nSriracha\nScallions', array['shellfish','fish','dairy','egg','wheat','soy','sesame'],
    'Beef on top of sushi — for guests who "don''t like fish."',
    'Converts steak-lovers into sushi eaters. Always pitch to reluctant guests.',
    '$16.75', 270
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Surf & Turf Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Surf Roll', 'Tempura fried shrimp, cream cheese, and avocado. Topped with tuna, sriracha, sesame seeds, and ponzu sauce.',
    E'Sushi rice\nNori\nTempura fried shrimp\nCream cheese\nAvocado\nFresh tuna (on top)\nSriracha\nSesame seeds\nPonzu sauce', array['shellfish','fish','dairy','egg','wheat','soy','sesame'],
    'Cooked + raw combo. Explain to first-timers.',
    'Middle-tier specialty. Reliable choice.',
    '$14.75', 280
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Surf Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Thai Roll', 'Snow crab, avocado, asparagus, whitefish, and cream cheese deep-fried in panko. Topped with a savory sweet sauce.',
    E'Sushi rice\nNori\nSnow crab\nAvocado\nAsparagus\nWhitefish\nCream cheese\nPanko coating (deep-fried)\nSweet-savory sauce', array['fish','shellfish','dairy','egg','wheat','soy','sesame'],
    'ENTIRE ROLL is deep-fried in panko. Not raw — cooked hot.',
    'For guests who want fried sushi. Great "beginner sushi" pitch.',
    '$13.25', 290
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Thai Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Tuck & Roll', 'Soft-shell crab, asparagus, and spicy tuna. Topped with spicy mayo and eel sauce.',
    E'Sushi rice\nNori\nTempura soft-shell crab\nAsparagus\nSpicy tuna\nSpicy mayo\nEel sauce', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Soft-shell crab whole — legs may stick out. Warn guests.',
    'A specialty roll at a lower price point ($10.75). Great value pitch.',
    '$10.75', 300
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Tuck & Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Volcano Roll', 'Tempura fried shrimp, avocado, and cucumber. Topped with a creamy crawfish, escolar and crab stick. Finished with eel sauce, green onions, and masago.',
    E'Sushi rice\nNori\nTempura fried shrimp\nAvocado\nCucumber\nCreamy crawfish topping\nEscolar\nCrab stick\nEel sauce\nGreen onions\nMasago', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Escolar is a rich fish — some people are sensitive to it. Warn if guest asks about digestion.',
    'Louisiana + Japan crossover. Sells itself with locals.',
    '$15.00', 310
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Volcano Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Who-Dat Roll', 'A Louisiana Saints-themed specialty roll — check with the sushi bar for tonight''s build.',
    E'Sushi rice\nNori\nAssorted seafood (check sushi bar)\nBlack and gold plating', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Confirm current build. Saints game days = auto-suggest.',
    'Perfect for Saints game watch parties. Local pride.',
    '$14.75', 320
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Who-Dat Roll');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_specialty, ichiban_id, 'Ya-Ya Roll', 'Spicy crawfish, fried oysters, and avocado topped with snow crab, steamed shrimp, Tabasco mayo, and Cajun seasoning.',
    E'Sushi rice\nNori\nSpicy crawfish\nFried oysters\nAvocado\nSnow crab\nSteamed shrimp\nTabasco mayo\nCajun seasoning', array['shellfish','fish','egg','wheat','soy','sesame'],
    'Full Louisiana treatment — crawfish + oysters + Tabasco + Cajun. Local heavyweight.',
    'The most "Louisiana" thing on the menu. Pitch hard to first-time out-of-town guests.',
    '$15.75', 330
  where not exists (select 1 from menu_items where category_id = cat_specialty and name = 'Ya-Ya Roll');

  -- ============================================================
  -- SUSHI & SASHIMI (NIGIRI/SASHIMI, 2 PIECES EACH)
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Asparagus', '(2 pc.) Asparagus nigiri or sashimi.',
    E'Sushi rice\nNori strip\nAsparagus', array['soy'],
    'Vegetarian option. Sushi or sashimi — confirm with guest.',
    'Cheapest vegetarian nigiri.',
    '$4.25+', 10
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Asparagus');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Avocado', '(2 pc.) Avocado nigiri or sashimi.',
    E'Sushi rice\nNori strip\nAvocado', array['soy'],
    'Vegetarian, no fish. Great for kids.',
    'A gateway nigiri for people nervous about fish.',
    '$4.25+', 20
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Avocado');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Baby Soft Shell Crab', '(2 pc.) Tempura fried baby soft-shell crab nigiri.',
    E'Sushi rice\nNori strip\nTempura fried baby soft-shell crab', array['shellfish','egg','wheat','soy','sesame'],
    'Whole crab piece — legs may stick out. Warn the guest.',
    'Textural showpiece — great story to tell.',
    '$7.25+', 30
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Baby Soft Shell Crab');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Black Tobiko', '(2 pc.) Black tobiko (flying fish roe) nigiri.',
    E'Sushi rice\nNori strip\nBlack tobiko', array['fish','soy','egg'],
    'Small crunchy roe — pops in the mouth.',
    'Beautiful visual — jet black on white rice.',
    '$5.25+', 40
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Black Tobiko');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Crab Stick', '(2 pc.) Crab stick (imitation crab) nigiri.',
    E'Sushi rice\nNori strip\nCrab stick (kanikama)', array['shellfish','fish','egg','wheat','soy'],
    'Imitation crab, not real. Clarify if guest asks. No raw fish.',
    'Kid-friendly nigiri option.',
    '$5.00+', 50
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Crab Stick');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Eel', '(2 pc.) BBQ eel (unagi) nigiri.',
    E'Sushi rice\nNori strip\nBBQ eel (unagi)\nEel sauce', array['fish','soy'],
    'Eel is COOKED and glazed, not raw. Great intro to nigiri.',
    'Sweet + smoky. Great for first-time nigiri eaters.',
    '$5.50+', 60
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Eel');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Egg', '(2 pc.) Sweet egg (tamago) nigiri.',
    E'Sushi rice\nNori strip\nTamago (sweet Japanese omelet)', array['egg','soy','fish'],
    'Sweet, cooked egg — not raw. Kids love it.',
    'Best "training wheels" nigiri.',
    '$4.50+', 70
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Egg');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Escolar', '(2 pc.) Escolar (white tuna) nigiri or sashimi.',
    E'Sushi rice\nNori strip\nEscolar (white tuna)', array['fish','soy'],
    'Very rich, buttery. Some guests find it heavy — limit portions if asked.',
    'The "hidden gem" for guests who love butter-fish flavor.',
    '$5.50+', 80
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Escolar');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Fresh Salmon', '(2 pc.) Fresh salmon nigiri or sashimi.',
    E'Sushi rice\nNori strip\nFresh salmon', array['fish','soy'],
    'Mild, buttery. Universal starter fish for nigiri.',
    'The default salmon nigiri pick.',
    '$6.00+', 90
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Fresh Salmon');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Habanero Tobiko', '(2 pc.) Habanero-infused tobiko nigiri.',
    E'Sushi rice\nNori strip\nHabanero tobiko (spicy roe)', array['fish','soy','egg'],
    'Spicy roe — warn heat-sensitive guests.',
    'Textural + spicy — great for adventurous eaters.',
    '$5.50+', 100
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Habanero Tobiko');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Hokkaido Scallops', '(2 pc.) Hokkaido scallop nigiri.',
    E'Sushi rice\nNori strip\nHokkaido scallop (raw)', array['shellfish','soy'],
    'Premium raw scallop from Hokkaido, Japan. Sweet, clean flavor.',
    'Premium option — worth the price. Great for regulars.',
    '$9.00', 110
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Hokkaido Scallops');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Kanpachi (Baby Yellowtail)', '(2 pc.) Baby yellowtail nigiri. *May be out of stock — check with the sushi bar.',
    E'Sushi rice\nNori strip\nKanpachi (baby yellowtail)', array['fish','soy'],
    'Frequently out of stock — CONFIRM availability with sushi bar before quoting.',
    'Premium, seasonal. Worth pushing when available.',
    '$9.00', 120
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Kanpachi (Baby Yellowtail)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'King Salmon', '(2 pc.) King salmon nigiri. *May be out of stock — check with the sushi bar.',
    E'Sushi rice\nNori strip\nKing salmon', array['fish','soy'],
    'Frequently out of stock — CONFIRM availability with sushi bar before quoting.',
    'Premium salmon — richer than Atlantic. Great for salmon lovers.',
    '$10.00', 130
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'King Salmon');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Lemon Fish', '(2 pc.) Lemon fish (cobia) nigiri. *May be out of stock — check with the sushi bar.',
    E'Sushi rice\nNori strip\nLemon fish (cobia)', array['fish','soy'],
    'Frequently out of stock — CONFIRM availability with sushi bar before quoting.',
    'Sweet, mild — great for salmon lovers who want variety.',
    '$5.25+', 140
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Lemon Fish');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Mackerel', '(2 pc.) Mackerel (saba) nigiri.',
    E'Sushi rice\nNori strip\nMackerel (saba)', array['fish','soy'],
    'Strong, oily flavor. Traditional Japanese pick. Not for mild-fish preferences.',
    'Purist''s pick — mention as a "true sushi bar experience."',
    '$5.00+', 150
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Mackerel');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Monkfish Liver', '(2 pc.) Monkfish liver (ankimo) — the "foie gras of the sea."',
    E'Sushi rice\nNori strip\nMonkfish liver (ankimo)', array['fish','soy'],
    'Rich, buttery liver — an acquired taste. Great story to tell.',
    'The connoisseur''s pick. Confidence-builder for advanced guests.',
    '$8.25+', 160
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Monkfish Liver');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Octopus', '(2 pc.) Octopus (tako) nigiri.',
    E'Sushi rice\nNori strip\nCooked octopus (tako)', array['shellfish','soy'],
    'Cooked, chewy texture. Not raw.',
    'Textural nigiri for guests who want something different.',
    '$5.50+', 170
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Octopus');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Quail Egg', '(2 pc.) Quail egg nigiri — often served on top of other nigiri like uni.',
    E'Sushi rice\nNori strip\nRaw quail egg', array['egg','soy','fish'],
    'Raw quail egg — small, mild flavor.',
    'Traditionally served as topping for uni or salmon roe.',
    '$4.00+', 180
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Quail Egg');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Red Snapper', '(2 pc.) Red snapper (tai) nigiri or sashimi.',
    E'Sushi rice\nNori strip\nRed snapper (tai)', array['fish','soy'],
    'Clean, mild white fish. Great starter nigiri.',
    'For guests who want to try raw fish but not tuna or salmon.',
    '$5.25+', 190
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Red Snapper');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Salmon Roe', '(2 pc.) Salmon roe (ikura) nigiri.',
    E'Sushi rice\nNori strip\nSalmon roe (ikura)', array['fish','soy'],
    'Large orange pearls — bursts in the mouth. Salty pop.',
    'Visually stunning. Great for the "fish egg" curious.',
    '$5.25+', 200
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Salmon Roe');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Shrimp', '(2 pc.) Steamed shrimp (ebi) nigiri.',
    E'Sushi rice\nNori strip\nSteamed shrimp (ebi)', array['shellfish','soy'],
    'Steamed shrimp — cooked, not raw.',
    'Great cooked-nigiri option for beginners.',
    '$5.25+', 210
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Shrimp');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Smelt Roe', '(2 pc.) Smelt roe (masago) nigiri.',
    E'Sushi rice\nNori strip\nSmelt roe (masago)', array['fish','soy'],
    'Small orange roe. Crunchy pop.',
    'Textural nigiri — the same masago used on many rolls.',
    '$5.25+', 220
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Smelt Roe');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Smoked Salmon', '(2 pc.) Smoked salmon nigiri.',
    E'Sushi rice\nNori strip\nSmoked salmon', array['fish','soy'],
    'Smoked, not raw. Good for guests hesitant about raw fish.',
    'Bagels-and-lox flavor for the sushi-curious.',
    '$5.75+', 230
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Smoked Salmon');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Snowcrab Leg', '(2 pc.) Real snow crab leg nigiri. *May be out of stock — check with the sushi bar.',
    E'Sushi rice\nNori strip\nReal snow crab meat', array['shellfish','soy'],
    'Frequently out of stock — CONFIRM availability with sushi bar. This is REAL crab, not imitation.',
    'When available, a premium showcase.',
    '$9.00', 240
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Snowcrab Leg');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Squid', '(2 pc.) Squid (ika) nigiri.',
    E'Sushi rice\nNori strip\nSquid (ika)', array['shellfish','soy'],
    'Chewy, mild. Traditional Japanese pick.',
    'Textural nigiri. Great for guests exploring beyond the classics.',
    '$5.25+', 250
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Squid');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Surf Clam', '(2 pc.) Surf clam (hokkigai) nigiri.',
    E'Sushi rice\nNori strip\nSurf clam (hokkigai)', array['shellfish','soy'],
    'Sweet, chewy — cooked shellfish. Not raw.',
    'A safer shellfish option than raw clams.',
    '$5.25+', 260
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Surf Clam');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Tofu Skin', '(2 pc.) Tofu skin (inari) nigiri — sweet tofu pouch stuffed with rice.',
    E'Sweet tofu skin pouch (inari age)\nSushi rice', array['soy'],
    'Sweet, vegetarian. Distinctive stuffed-pouch shape.',
    'Vegetarian nigiri option. Kids like the sweetness.',
    '$4.50+', 270
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Tofu Skin');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Tuna', '(2 pc.) Fresh tuna nigiri or sashimi.',
    E'Sushi rice\nNori strip\nFresh yellowfin tuna', array['fish','soy'],
    'Classic red tuna. The default tuna nigiri.',
    'Highest-margin nigiri. Always suggest to tuna lovers.',
    '$6.00+', 280
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Tuna');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Wasabi Tobiko', '(2 pc.) Wasabi-infused tobiko nigiri.',
    E'Sushi rice\nNori strip\nWasabi tobiko (spicy green roe)', array['fish','soy'],
    'Wasabi-infused roe. Sinus-clearing kick.',
    'A visual pop (green) with real heat. Good for adventurous eaters.',
    '$5.25+', 290
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Wasabi Tobiko');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'White Tuna', '(2 pc.) White tuna (escolar) nigiri or sashimi.',
    E'Sushi rice\nNori strip\nWhite tuna (escolar)', array['fish','soy'],
    'Same as escolar — rich, buttery. Limit portions if guest asks about oil sensitivity.',
    'The "butter fish" pitch for guests who love mouthfeel.',
    '$5.25+', 300
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'White Tuna');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_nigiri, ichiban_id, 'Yellowtail', '(2 pc.) Fresh yellowtail (hamachi) nigiri or sashimi.',
    E'Sushi rice\nNori strip\nYellowtail (hamachi)', array['fish','soy'],
    'Rich, buttery — the middle-ground between tuna and salmon.',
    'The most-recommended premium nigiri. Guests almost always come back for more.',
    '$5.75+', 310
  where not exists (select 1 from menu_items where category_id = cat_nigiri and name = 'Yellowtail');

  -- ============================================================
  -- ENTRÉES
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Baked Salmon Dinner', 'Baked salmon fillet served with miso soup, salad, white rice, and vegetables.',
    E'Baked salmon fillet\nMiso soup\nHouse salad with ginger dressing\nWhite rice\nSteamed vegetables', array['fish','soy','sesame','wheat'],
    'Full dinner — comes with soup + salad. Good for guests who want a hot entrée.',
    'For guests who want a Japanese dinner but not sushi.',
    '$21.00', 10
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Baked Salmon Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Chicken Katsu Dinner', 'Panko-crusted chicken and tonkatsu sauce.',
    E'Panko-breaded chicken cutlet\nTonkatsu sauce\nWhite rice\nHouse salad\nMiso soup', array['egg','wheat','soy','sesame'],
    'Fried chicken cutlet — great for kids and adults hesitant about Japanese food.',
    'Sushi-hesitant guests almost always order this. Safe recommendation.',
    '$17.00', 20
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Chicken Katsu Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Shrimp Tempura Dinner', '(6 pc.) Shrimp and (6 pc.) assorted veggies.',
    E'6 pc tempura shrimp\n6 pc tempura vegetables (broccoli, sweet potato, zucchini, mushroom)\nTentsuyu dipping sauce\nWhite rice\nMiso soup\nHouse salad', array['shellfish','egg','wheat','soy','sesame','fish'],
    'Comes with soup + salad + rice. Classic tempura dinner.',
    'Kid-friendly option that adults enjoy too.',
    '$17.00', 30
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Shrimp Tempura Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Teriyaki Dinner', 'Choice of protein (chicken, beef, salmon, shrimp) with teriyaki glaze. Served with soup, salad, rice, and vegetables.',
    E'Choice of protein (chicken/beef/salmon/shrimp)\nHouse teriyaki sauce\nWhite rice\nSteamed vegetables\nMiso soup\nHouse salad', array['fish','soy','sesame','wheat'],
    'Confirm protein choice with guest. Price varies.',
    'Great "hibachi-like" experience for people who don''t want the hibachi grill show.',
    '$17.00+', 40
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Teriyaki Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Chirashi Sushi Dinner', 'Assortment of sashimi on a bed of rice.',
    E'Sushi rice bed\nAssorted sashimi (tuna, salmon, yellowtail, white fish, shrimp, and more)\nMasago\nWasabi and pickled ginger', array['fish','shellfish','soy','egg','sesame'],
    'The "sashimi bowl" — variety of raw fish over rice.',
    'Premium sashimi lover''s dinner. Better value than ordering individual sashimi.',
    '$30.00', 50
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Chirashi Sushi Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Maki Sushi Platter', 'Assortment of rolls served together as a full dinner.',
    E'Assorted sushi rolls (California, tuna, salmon, or similar — check with sushi bar)\nMiso soup\nHouse salad', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Rolls only — no nigiri. Good for group orders too.',
    'Value-oriented sushi dinner. Great for regulars who prefer rolls.',
    '$22.00', 60
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Maki Sushi Platter');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Sashimi Platter Dinner', 'Assortment of sashimi.',
    E'Premium sashimi assortment (tuna, salmon, yellowtail, white fish, and rotating chef selections)\nMiso soup\nHouse salad\nWasabi and pickled ginger', array['fish','shellfish','soy'],
    'Confirm with sushi bar what''s in tonight''s assortment.',
    'The sashimi purist''s dinner — no rice, just fish.',
    '$27.00', 70
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Sashimi Platter Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Sushi Platter Dinner', 'Assortment of nigiri sushi and a California roll.',
    E'Assorted nigiri sushi (tuna, salmon, yellowtail, shrimp, etc.)\nCalifornia roll\nMiso soup\nHouse salad', array['fish','shellfish','egg','wheat','soy','sesame'],
    'Best "full sushi experience" plate — nigiri + one roll.',
    'The universal "I''ll have the sushi platter" order. Reliable.',
    '$25.00', 80
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Sushi Platter Dinner');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_entrees, ichiban_id, 'Unagi Donburi Dinner', 'BBQ eel over a bed of rice, served with soup and salad.',
    E'Sushi rice bed\nBBQ eel (unagi)\nEel sauce\nMiso soup\nHouse salad', array['fish','soy','sesame'],
    'BBQ eel is cooked and glazed — sweet and smoky.',
    'For guests who love the Special Eel Roll and want an entrée version.',
    '$20.00', 90
  where not exists (select 1 from menu_items where category_id = cat_entrees and name = 'Unagi Donburi Dinner');

  -- ============================================================
  -- FRIED RICE, NOODLES & SOUPS
  -- ============================================================

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Combo Fried Rice', 'Fried rice with a combination of proteins (chicken, beef, shrimp).',
    E'Sushi rice, chicken, beef, shrimp\nEgg\nCarrots, peas, green onions\nYum yum sauce and soy sauce', array['shellfish','egg','soy','sesame','wheat'],
    'Loaded with three proteins. Full meal for a hungry guest.',
    'Great pairing with a light appetizer.',
    '$16.00', 10
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Combo Fried Rice');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Fried Rice', 'Classic fried rice with choice of protein.',
    E'Sushi rice\nChoice of protein (chicken, beef, shrimp, or vegetable)\nEgg\nCarrots, peas, green onions\nYum yum sauce and soy sauce', array['egg','soy','sesame','wheat'],
    'Confirm protein choice with guest. Price varies with protein.',
    'Featured item on Toast. A best-seller for takeout.',
    '$11.00+', 20
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Fried Rice');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Clear Soup (8oz)', 'Mushrooms, fried onions, and green onions.',
    E'Clear dashi broth\nMushrooms\nFried onions\nGreen onions', array['soy','fish','wheat'],
    'Small cup. Comes with most dinners.',
    'Great cheap add-on for a light table.',
    '$3.00', 30
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Clear Soup (8oz)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Clear Soup (16oz)', 'Mushrooms, fried onions, and green onions.',
    E'Clear dashi broth\nMushrooms\nFried onions\nGreen onions', array['soy','fish','wheat'],
    'Medium bowl. Sharing size for two.',
    'Bigger portion at better value than two 8oz.',
    '$5.50', 40
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Clear Soup (16oz)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Clear Soup (32oz)', 'Mushrooms, fried onions, and green onions.',
    E'Clear dashi broth\nMushrooms\nFried onions\nGreen onions', array['soy','fish','wheat'],
    'Large bowl. Family-sized.',
    'Best value for a large group. Family style.',
    '$10.00', 50
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Clear Soup (32oz)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Miso Soup (8oz)', 'Wakame, green onions, and tofu.',
    E'Miso broth\nWakame (seaweed)\nGreen onions\nTofu', array['soy','fish','sesame'],
    'Small cup. Comes with most dinners.',
    'Classic Japanese starter. Cheap add-on to any order.',
    '$3.00', 60
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Miso Soup (8oz)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Miso Soup (16oz)', 'Wakame, green onions, and tofu.',
    E'Miso broth\nWakame (seaweed)\nGreen onions\nTofu', array['soy','fish','sesame'],
    'Medium bowl. Sharing size for two.',
    'Better value than two 8oz cups.',
    '$5.50', 70
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Miso Soup (16oz)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Miso Soup (32oz)', 'Wakame, green onions, and tofu.',
    E'Miso broth\nWakame (seaweed)\nGreen onions\nTofu', array['soy','fish','sesame'],
    'Large bowl. Family-sized.',
    'Best value for a large group.',
    '$10.00', 80
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Miso Soup (32oz)');

  insert into menu_items (category_id, restaurant_id, name, description, ingredients, allergens, prep_notes, upsell_note, price, sort_order)
  select cat_rice, ichiban_id, 'Yaki Udon', 'Beef, chicken, shrimp, and assorted vegetables.',
    E'Udon noodles (thick wheat noodles)\nBeef\nChicken\nShrimp\nAssorted vegetables (cabbage, carrot, onion, mushroom)\nYaki udon sauce', array['shellfish','wheat','soy','sesame'],
    'Stir-fried thick noodles. Great alternative to fried rice.',
    'For guests who want noodles instead of rice.',
    '$13.00', 90
  where not exists (select 1 from menu_items where category_id = cat_rice and name = 'Yaki Udon');

end $$;


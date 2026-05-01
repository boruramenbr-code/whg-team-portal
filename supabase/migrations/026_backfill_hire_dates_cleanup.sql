-- 026_backfill_hire_dates_cleanup.sql
-- Cleanup pass for staff whose Paychex name didn't auto-match migration 025.
--
-- Diagnostic reasons each one missed:
--   • Nickname:           Sam Buchner ← Samantha Buchner
--   • Compound names:     Chun Situ ← Chun Hui Situ
--                          Leonardo Romero ← Linan Romero, Leonardo R
--                          Belkis Vicente ← Menjivar Vicente, Belkis P
--                          Lida Martinez ← Perez Martinez, Linda Y
--                          Fiana Fernandez ← Fernandez, Lady Fiana S
--   • Spelling/typo:      Armondo Hernandez ← Armando Hernandez
--                          Esperanza Slivers ← Esperanza Stivers
--                          Grayson LeJeune ← Graysen Lejeune
--                          Lida Martinez ← Linda (also nickname)
--   • Different surnames: Fabiola Garrido ← Fabiola Hernandez (maiden vs married?)
--   • Inactive in Paychex but active in portal: Rachel Saunders
--
-- Match strategy: case-insensitive trimmed full_name (the portal version).
-- Only fills if hire_date is currently NULL.

UPDATE profiles SET hire_date = '2025-04-05', updated_at = now()
  WHERE lower(trim(full_name)) = 'sam buchner'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Boru Ramen')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2025-04-10', updated_at = now()
  WHERE lower(trim(full_name)) = 'chun situ'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Boru Ramen')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2024-09-09', updated_at = now()
  WHERE lower(trim(full_name)) = 'leonardo romero'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Boru Ramen')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2024-03-30', updated_at = now()
  WHERE lower(trim(full_name)) = 'armondo hernandez'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2026-03-04', updated_at = now()
  WHERE lower(trim(full_name)) = 'belkis vicente'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2024-02-21', updated_at = now()
  WHERE lower(trim(full_name)) = 'esperanza slivers'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2024-06-03', updated_at = now()
  WHERE lower(trim(full_name)) = 'fabiola garrido'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2026-03-02', updated_at = now()
  WHERE lower(trim(full_name)) = 'fiana fernandez'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2026-04-16', updated_at = now()
  WHERE lower(trim(full_name)) = 'grayson lejeune'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2025-01-07', updated_at = now()
  WHERE lower(trim(full_name)) = 'lida martinez'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

UPDATE profiles SET hire_date = '2025-12-16', updated_at = now()
  WHERE lower(trim(full_name)) = 'rachel saunders'
    AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'Ichiban Sushi')
    AND status = 'active' AND hire_date IS NULL;

-- 025_backfill_hire_dates.sql
-- Backfill profiles.hire_date from Paychex employee export pulled 2026-04-30.
--
-- Sources:
--   • What Wong LLC      → Boru Ramen     (29 active records)
--   • K K and Sons LLC   → Ichiban Sushi  (72 active records)
--
-- Parsing: case-insensitive trimmed full_name match. Strips Jr/Sr/II/III/IV
-- suffixes from last names (Paychex stores them with the last name).
--
-- Only fills hire_date when currently NULL — preserves any manual edits.
-- Anyone who doesn't match stays NULL and shows the amber
-- "Set this to enable anniversary alerts" hint on their profile.

WITH paychex_data(full_name, restaurant_name, hire_date) AS (
  VALUES
  ('Stafford Bolden', 'Boru Ramen', DATE '2026-01-09'),
  ('Jozi Brian', 'Boru Ramen', DATE '2026-01-21'),
  ('Emma Davis', 'Boru Ramen', DATE '2026-01-24'),
  ('Alec Casillas', 'Boru Ramen', DATE '2022-02-24'),
  ('Sean Brown', 'Boru Ramen', DATE '2025-02-19'),
  ('Kayla Horne', 'Boru Ramen', DATE '2025-02-20'),
  ('Tam Le', 'Boru Ramen', DATE '2025-02-25'),
  ('Tevin Moore', 'Boru Ramen', DATE '2026-02-10'),
  ('Phillip Ricard', 'Boru Ramen', DATE '2026-02-17'),
  ('Lorell Hamilton', 'Boru Ramen', DATE '2021-08-21'),
  ('Peter Le', 'Boru Ramen', DATE '2025-03-17'),
  ('Brooklyn Nicholson', 'Boru Ramen', DATE '2025-03-25'),
  ('Hailee Pham', 'Boru Ramen', DATE '2023-08-16'),
  ('Samantha Buchner', 'Boru Ramen', DATE '2025-04-05'),
  ('Thuy An Nguyen', 'Boru Ramen', DATE '2025-04-06'),
  ('Chun Hui Situ', 'Boru Ramen', DATE '2025-04-10'),
  ('Jevante Moreland', 'Boru Ramen', DATE '2025-04-14'),
  ('Phat Ly', 'Boru Ramen', DATE '2026-04-29'),
  ('Logan Wong', 'Boru Ramen', DATE '2023-07-01'),
  ('Malik Williams', 'Boru Ramen', DATE '2025-07-02'),
  ('Jennifer Tran', 'Boru Ramen', DATE '2025-08-14'),
  ('Kelly Tran', 'Boru Ramen', DATE '2025-08-23'),
  ('STACEY DO', 'Boru Ramen', DATE '2025-10-16'),
  ('Khalil Stephens', 'Boru Ramen', DATE '2026-02-17'),
  ('Sean Pham', 'Boru Ramen', DATE '2023-09-17'),
  ('Leonardo Linan Romero', 'Boru Ramen', DATE '2024-09-09'),
  ('Olivia Leonard', 'Boru Ramen', DATE '2025-10-07'),
  ('Granger Dickinson', 'Boru Ramen', DATE '2022-11-23'),
  ('Corey Williams', 'Boru Ramen', DATE '2021-12-15'),
  ('Linda Perez Martinez', 'Ichiban Sushi', DATE '2025-01-07'),
  ('Allie Peters', 'Ichiban Sushi', DATE '2025-01-20'),
  ('Branson Bell', 'Ichiban Sushi', DATE '2026-01-07'),
  ('Camille Templet', 'Ichiban Sushi', DATE '2026-01-07'),
  ('Gloria Osorioixpata', 'Ichiban Sushi', DATE '2026-01-24'),
  ('Jackielyn Daniels', 'Ichiban Sushi', DATE '2021-02-01'),
  ('Henry Vu', 'Ichiban Sushi', DATE '2025-02-03'),
  ('Bryan Lo', 'Ichiban Sushi', DATE '2018-03-27'),
  ('Betsy Chen', 'Ichiban Sushi', DATE '2023-03-12'),
  ('Tara Dickerson', 'Ichiban Sushi', DATE '2023-03-15'),
  ('Armando Hernandez', 'Ichiban Sushi', DATE '2024-03-30'),
  ('Eleisa Sadmandiartha', 'Ichiban Sushi', DATE '2024-06-09'),
  ('Evan Nguyen', 'Ichiban Sushi', DATE '2025-03-20'),
  ('Lady Fiana Fernandez', 'Ichiban Sushi', DATE '2026-03-02'),
  ('Belkis Menjivar Vicente', 'Ichiban Sushi', DATE '2026-03-04'),
  ('Dominic Piazza', 'Ichiban Sushi', DATE '2026-03-04'),
  ('Macy Smith', 'Ichiban Sushi', DATE '2026-03-07'),
  ('Curtis Logan', 'Ichiban Sushi', DATE '2026-03-09'),
  ('Haylee Rincon', 'Ichiban Sushi', DATE '2026-03-12'),
  ('Ashley Clarkson', 'Ichiban Sushi', DATE '2026-03-17'),
  ('Ana Tomas', 'Ichiban Sushi', DATE '2026-03-17'),
  ('Riley Gordon', 'Ichiban Sushi', DATE '2026-03-20'),
  ('Macie Messina', 'Ichiban Sushi', DATE '2026-03-20'),
  ('Zain Armond', 'Ichiban Sushi', DATE '2023-04-04'),
  ('Rafael Cruz', 'Ichiban Sushi', DATE '2023-04-10'),
  ('Alexis Rogers', 'Ichiban Sushi', DATE '2024-04-21'),
  ('Raymond Gould', 'Ichiban Sushi', DATE '2024-04-21'),
  ('Anna Dentro', 'Ichiban Sushi', DATE '2026-04-01'),
  ('Dixie Stauffer', 'Ichiban Sushi', DATE '2026-04-15'),
  ('Graysen Lejeune', 'Ichiban Sushi', DATE '2026-04-16'),
  ('Sam Mak', 'Ichiban Sushi', DATE '2020-05-29'),
  ('Noah Williams', 'Ichiban Sushi', DATE '2023-05-22'),
  ('Eliza Werline', 'Ichiban Sushi', DATE '2025-05-26'),
  ('Jorda Foster', 'Ichiban Sushi', DATE '2025-07-28'),
  ('Fabiola Hernandez', 'Ichiban Sushi', DATE '2024-06-03'),
  ('Brandon Collins', 'Ichiban Sushi', DATE '2024-06-13'),
  ('Khoi Huynh', 'Ichiban Sushi', DATE '2025-06-28'),
  ('Lianna Nguyen', 'Ichiban Sushi', DATE '2025-07-02'),
  ('Jonathan Long', 'Ichiban Sushi', DATE '2011-07-19'),
  ('Syaiful Soleh', 'Ichiban Sushi', DATE '2016-07-05'),
  ('Christian Putra', 'Ichiban Sushi', DATE '2021-07-12'),
  ('Johnny Fransiscus', 'Ichiban Sushi', DATE '2022-07-07'),
  ('David McCorkle', 'Ichiban Sushi', DATE '2023-07-21'),
  ('Trung Le', 'Ichiban Sushi', DATE '2023-07-24'),
  ('Hunter Morales', 'Ichiban Sushi', DATE '2025-07-08'),
  ('Jenna Peters', 'Ichiban Sushi', DATE '2025-07-25'),
  ('Iwan Tamara', 'Ichiban Sushi', DATE '2015-08-18'),
  ('Michelle Ruxton', 'Ichiban Sushi', DATE '2017-08-03'),
  ('Timothy Jones', 'Ichiban Sushi', DATE '2019-08-01'),
  ('Hannah Ward', 'Ichiban Sushi', DATE '2020-08-09'),
  ('Sarah Dickerson', 'Ichiban Sushi', DATE '2020-08-28'),
  ('Hailey Parker', 'Ichiban Sushi', DATE '2023-08-10'),
  ('Katelyn Alley', 'Ichiban Sushi', DATE '2023-08-23'),
  ('Esperanza Stivers', 'Ichiban Sushi', DATE '2024-02-21'),
  ('Nayeli Raibstein', 'Ichiban Sushi', DATE '2025-08-24'),
  ('Margaret McCormack', 'Ichiban Sushi', DATE '2025-08-24'),
  ('Chelsey Wong', 'Ichiban Sushi', DATE '2013-09-04'),
  ('Kennedy Burke', 'Ichiban Sushi', DATE '2024-10-12'),
  ('Mika Devillier', 'Ichiban Sushi', DATE '2024-10-30'),
  ('Mia Macedo', 'Ichiban Sushi', DATE '2024-11-03'),
  ('Ross Cadby', 'Ichiban Sushi', DATE '2025-10-03'),
  ('Alex Baudouin', 'Ichiban Sushi', DATE '2025-10-06'),
  ('MaRiyah Walker', 'Ichiban Sushi', DATE '2025-11-02'),
  ('Samarah Price', 'Ichiban Sushi', DATE '2025-11-04'),
  ('Caroline Templet', 'Ichiban Sushi', DATE '2025-11-20'),
  ('Rodney Carter', 'Ichiban Sushi', DATE '2025-11-28'),
  ('Marshall Peak', 'Ichiban Sushi', DATE '2016-12-19'),
  ('Kelton Wooten', 'Ichiban Sushi', DATE '2018-12-18'),
  ('Loren Rayford', 'Ichiban Sushi', DATE '2023-12-07'),
  ('Caitlin Nguyen', 'Ichiban Sushi', DATE '2024-12-11'),
  ('Ethan Cheong', 'Ichiban Sushi', DATE '2024-12-27'),
  ('Darrian Jones', 'Ichiban Sushi', DATE '2025-12-18')
)
UPDATE profiles p
SET hire_date  = pd.hire_date,
    updated_at = now()
FROM paychex_data pd
JOIN restaurants r ON r.name = pd.restaurant_name
WHERE lower(trim(p.full_name)) = lower(trim(pd.full_name))
  AND p.restaurant_id = r.id
  AND p.status = 'active'
  AND p.hire_date IS NULL;

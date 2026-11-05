-- Verabatch migration 0013: front-of-label claims.
--
-- Each product keeps the claims picked for it (by key, from the market pack) and its
-- organic settings: {"keys": ["vegan", "handmade"], "organic": {"status": "no",
-- "certifier": "", "front": false, "madeWith": []}}. Which recipe lines are organic is
-- stored on the lines themselves (recipe jsonb, "organic": true).
-- Products already have row level security (migration 0002), which covers this column.
-- (The supplies-cost-invoices branch's migration becomes 0014.)

alter table public.products
  add column if not exists claims jsonb not null default '{"keys": [], "organic": {"status": "no", "certifier": "", "front": false, "madeWith": []}}'::jsonb
  check (jsonb_typeof(claims) = 'object' and pg_column_size(claims) <= 4000);

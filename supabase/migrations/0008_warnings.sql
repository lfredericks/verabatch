-- Verabatch migration 0008: label warnings.
--
-- Each product keeps the standard warnings picked for it (by key, from the market pack)
-- and up to five of the maker's own: {"keys": ["external", "eyes"], "custom": ["Store below 80°F"]}.
-- Products already have row level security (migration 0002), which covers this column.

alter table public.products
  add column if not exists warnings jsonb not null default '{"keys": [], "custom": []}'::jsonb
  check (jsonb_typeof(warnings) = 'object' and pg_column_size(warnings) <= 8000);

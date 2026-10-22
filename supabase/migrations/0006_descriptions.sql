-- Verabatch migration 0006: product descriptions per sales channel (Etsy, website,
-- Amazon, other), checked for risky claims in the app.
alter table public.products
  add column if not exists descriptions jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.products add constraint products_descriptions_object
    check (jsonb_typeof(descriptions) = 'object' and pg_column_size(descriptions) <= 60000);
exception when duplicate_object then null; end $$;

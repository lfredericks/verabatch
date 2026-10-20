-- Verabatch migration 0002: products and their master recipes.
--
-- The recipe is stored exactly as the maker typed it (amounts like "1/2" stay text),
-- as a JSON list of lines: [{ "amount": "1/2", "unit": "cup", "text": "almond oil",
-- "variety": { "group": "lavender", "variety": "true", "form": "eo" } }, ...].
-- Batches (milestone 5) keep their own copy, so editing this never changes a batch.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  type_key text not null default '' check (char_length(type_key) <= 40),
  identity text not null default '' check (char_length(identity) <= 120),
  description text not null default '' check (char_length(description) <= 4000),
  makes integer check (makes is null or makes between 1 and 100000),
  recipe jsonb not null default '[]'::jsonb check (jsonb_typeof(recipe) = 'array' and jsonb_array_length(recipe) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_business_idx on public.products (business_id);

alter table public.products enable row level security;

drop policy if exists "members read products" on public.products;
create policy "members read products" on public.products
  for select to authenticated using (public.is_member(business_id));

drop policy if exists "members add products" on public.products;
create policy "members add products" on public.products
  for insert to authenticated with check (public.is_member(business_id));

drop policy if exists "members change products" on public.products;
create policy "members change products" on public.products
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));

drop policy if exists "members remove products" on public.products;
create policy "members remove products" on public.products
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.products from anon;
grant select, insert, update, delete on public.products to authenticated;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

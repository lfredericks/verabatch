-- Verabatch migration 0004: batches. "I made a batch" saves the date, how many of each
-- size, whether it was the usual recipe, a frozen copy of the recipe used, and a lot
-- number. Editing the product's master recipe never changes a batch.

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  lot text not null check (char_length(lot) between 1 and 40),
  made_on date not null default current_date,
  changed boolean not null default false,
  -- { "<size id>": 5, ... } plus "_none" for products without sizes
  counts jsonb not null default '{}'::jsonb check (jsonb_typeof(counts) = 'object'),
  recipe jsonb not null default '[]'::jsonb check (jsonb_typeof(recipe) = 'array' and jsonb_array_length(recipe) <= 200),
  note text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, lot)
);

create index if not exists batches_product_idx on public.batches (product_id, made_on desc);

create or replace function public.batches_match_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select p.business_id into new.business_id from public.products p where p.id = new.product_id;
  if new.business_id is null then
    raise exception 'no such product';
  end if;
  return new;
end;
$$;

drop trigger if exists batches_business on public.batches;
create trigger batches_business before insert or update on public.batches
  for each row execute function public.batches_match_product();

drop trigger if exists batches_touch on public.batches;
create trigger batches_touch before update on public.batches
  for each row execute function public.touch_updated_at();

alter table public.batches enable row level security;

drop policy if exists "members read batches" on public.batches;
create policy "members read batches" on public.batches
  for select to authenticated using (public.is_member(business_id));

drop policy if exists "members add batches" on public.batches;
create policy "members add batches" on public.batches
  for insert to authenticated with check (public.is_member(business_id));

drop policy if exists "members change batches" on public.batches;
create policy "members change batches" on public.batches
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));

drop policy if exists "members remove batches" on public.batches;
create policy "members remove batches" on public.batches
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.batches from anon;
grant select, insert, update, delete on public.batches to authenticated;

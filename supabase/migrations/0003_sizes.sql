-- Verabatch migration 0003: sizes. A product can come in several sizes, each with its
-- fill amount (what goes in one container) and its front label shape and dimensions.
-- business_id is copied from the product so row level security stays one simple check.

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  fill_amount text not null check (char_length(fill_amount) between 1 and 20),
  fill_unit text not null check (fill_unit in ('oz', 'floz', 'g', 'ml')),
  label_shape text not null default 'rect' check (label_shape in ('rect', 'round')),
  width_in numeric check (width_in is null or (width_in > 0 and width_in <= 40)),
  height_in numeric check (height_in is null or (height_in > 0 and height_in <= 40)),
  diameter_in numeric check (diameter_in is null or (diameter_in > 0 and diameter_in <= 40)),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sizes_product_idx on public.sizes (product_id);

-- The size's business must be the product's business.
create or replace function public.sizes_match_product()
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

drop trigger if exists sizes_business on public.sizes;
create trigger sizes_business before insert or update on public.sizes
  for each row execute function public.sizes_match_product();

drop trigger if exists sizes_touch on public.sizes;
create trigger sizes_touch before update on public.sizes
  for each row execute function public.touch_updated_at();

alter table public.sizes enable row level security;

drop policy if exists "members read sizes" on public.sizes;
create policy "members read sizes" on public.sizes
  for select to authenticated using (public.is_member(business_id));

drop policy if exists "members add sizes" on public.sizes;
create policy "members add sizes" on public.sizes
  for insert to authenticated with check (public.is_member(business_id));

drop policy if exists "members change sizes" on public.sizes;
create policy "members change sizes" on public.sizes
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));

drop policy if exists "members remove sizes" on public.sizes;
create policy "members remove sizes" on public.sizes
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.sizes from anon;
grant select, insert, update, delete on public.sizes to authenticated;

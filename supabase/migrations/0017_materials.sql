-- Verabatch migration 0017: supplies become materials + deliveries (Leslie, Nov 8-9).
--
-- A material is whatever the maker calls it ("Unrefined shea"), added once, bought from any
-- number of shops. Each row in `supplies` is now one DELIVERY of a material (amount, shop,
-- their lot number, dates). On screen: "My supplies" (materials) and "deliveries".
-- Invoices (typed in or, later, read from a photo) group the deliveries that came together.
-- batch_supplies.amount_used records how much of each delivery a batch used, so on-hand
-- totals count down.

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  -- A shop's blend: its ingredient list as given (percentages if known). '' = not a blend.
  blend text not null default '' check (char_length(blend) <= 2000),
  note text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists materials_name_idx on public.materials (business_id, lower(name));

drop trigger if exists materials_touch on public.materials;
create trigger materials_touch before update on public.materials
  for each row execute function public.touch_updated_at();

alter table public.materials enable row level security;

drop policy if exists "members read materials" on public.materials;
create policy "members read materials" on public.materials
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "members add materials" on public.materials;
create policy "members add materials" on public.materials
  for insert to authenticated with check (public.is_member(business_id));
drop policy if exists "members change materials" on public.materials;
create policy "members change materials" on public.materials
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
drop policy if exists "members remove materials" on public.materials;
create policy "members remove materials" on public.materials
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.materials from anon;
grant select, insert, update, delete on public.materials to authenticated;

-- Invoices: the deliveries that came on one order.
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  supplier text not null default '' check (char_length(supplier) <= 120),
  invoice_number text not null default '' check (char_length(invoice_number) <= 60),
  invoice_date date,
  total numeric(12, 2) check (total is null or (total >= 0 and total < 10000000)),
  created_at timestamptz not null default now()
);

create index if not exists invoices_business_idx on public.invoices (business_id, created_at desc);

alter table public.invoices enable row level security;

drop policy if exists "members read invoices" on public.invoices;
create policy "members read invoices" on public.invoices
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "members add invoices" on public.invoices;
create policy "members add invoices" on public.invoices
  for insert to authenticated with check (public.is_member(business_id));
drop policy if exists "members change invoices" on public.invoices;
create policy "members change invoices" on public.invoices
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
drop policy if exists "members remove invoices" on public.invoices;
create policy "members remove invoices" on public.invoices
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.invoices from anon;
grant select, insert, update, delete on public.invoices to authenticated;

-- Deliveries: which material, what it cost, which invoice, certified organic.
alter table public.supplies add column if not exists material_id uuid references public.materials (id) on delete restrict;
alter table public.supplies add column if not exists cost numeric(12, 2) check (cost is null or (cost >= 0 and cost < 10000000));
alter table public.supplies add column if not exists invoice_id uuid references public.invoices (id) on delete set null;
alter table public.supplies add column if not exists organic boolean not null default false;

create index if not exists supplies_material_idx on public.supplies (material_id, received_on);

-- Every existing delivery gets a material, one per name per business ("Unrefined shea").
insert into public.materials (business_id, name)
select distinct on (s.business_id, lower(trim(s.ingredient))) s.business_id, trim(s.ingredient)
from public.supplies s
where s.material_id is null
order by s.business_id, lower(trim(s.ingredient)), s.created_at
on conflict do nothing;

update public.supplies s
set material_id = m.id
from public.materials m
where s.material_id is null and m.business_id = s.business_id and lower(m.name) = lower(trim(s.ingredient));

-- How much of a delivery a batch line used, in the delivery's own unit (null = unknown).
alter table public.batch_supplies add column if not exists amount_used numeric(14, 4) check (amount_used is null or amount_used >= 0);

-- A delivery's material must belong to the same business.
create or replace function public.supplies_material_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.material_id is not null and not exists (
    select 1 from public.materials m where m.id = new.material_id and m.business_id = new.business_id
  ) then
    raise exception 'material belongs to another business';
  end if;
  if new.invoice_id is not null and not exists (
    select 1 from public.invoices i where i.id = new.invoice_id and i.business_id = new.business_id
  ) then
    raise exception 'invoice belongs to another business';
  end if;
  return new;
end;
$$;

drop trigger if exists supplies_material on public.supplies;
create trigger supplies_material before insert or update on public.supplies
  for each row execute function public.supplies_material_match();

-- Verabatch migration 0010: supplier lots ("supplies").
--
-- Each delivery a maker receives (2 lb chamomile flower from a supplier, their lot XXXX-XXXX)
-- is one supply. A batch records which supply lot each of its recipe lines used, so a
-- supplier recall can be traced to every batch, and every batch back to its supplier lots.
-- Amounts on hand are not subtracted yet (Leslie: an option for later).

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  ingredient text not null check (char_length(ingredient) between 1 and 120),
  supplier text not null default '' check (char_length(supplier) <= 120),
  supplier_lot text not null default '' check (char_length(supplier_lot) <= 60),
  amount text not null default '' check (char_length(amount) <= 20),
  unit text not null default '' check (unit in ('', 'oz', 'lb', 'g', 'kg', 'floz', 'ml', 'l', 'gal', 'each')),
  received_on date,
  best_by date,
  note text not null default '' check (char_length(note) <= 2000),
  used_up boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplies_business_idx on public.supplies (business_id, used_up, received_on desc);

drop trigger if exists supplies_touch on public.supplies;
create trigger supplies_touch before update on public.supplies
  for each row execute function public.touch_updated_at();

alter table public.supplies enable row level security;

drop policy if exists "members read supplies" on public.supplies;
create policy "members read supplies" on public.supplies
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "members add supplies" on public.supplies;
create policy "members add supplies" on public.supplies
  for insert to authenticated with check (public.is_member(business_id));
drop policy if exists "members change supplies" on public.supplies;
create policy "members change supplies" on public.supplies
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
drop policy if exists "members remove supplies" on public.supplies;
create policy "members remove supplies" on public.supplies
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.supplies from anon;
grant select, insert, update, delete on public.supplies to authenticated;

-- Which supply lots a batch's recipe line used (an infused oil line can use two: the herb
-- and the oil). A supply that's been used can't be deleted
-- (restrict), so the trace is never lost; deleting a batch removes its links.
create table if not exists public.batch_supplies (
  batch_id uuid not null references public.batches (id) on delete cascade,
  supply_id uuid not null references public.supplies (id) on delete restrict,
  line_key text not null check (char_length(line_key) between 1 and 12),
  business_id uuid not null references public.businesses (id) on delete cascade,
  primary key (batch_id, line_key, supply_id)
);

create index if not exists batch_supplies_supply_idx on public.batch_supplies (supply_id);

-- The link's business is the batch's, and the supply must belong to the same business.
create or replace function public.batch_supplies_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select b.business_id into new.business_id from public.batches b where b.id = new.batch_id;
  if new.business_id is null then
    raise exception 'no such batch';
  end if;
  if not exists (select 1 from public.supplies s where s.id = new.supply_id and s.business_id = new.business_id) then
    raise exception 'supply belongs to another business';
  end if;
  return new;
end;
$$;

drop trigger if exists batch_supplies_business on public.batch_supplies;
create trigger batch_supplies_business before insert or update on public.batch_supplies
  for each row execute function public.batch_supplies_match();

alter table public.batch_supplies enable row level security;

drop policy if exists "members read batch supplies" on public.batch_supplies;
create policy "members read batch supplies" on public.batch_supplies
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "members add batch supplies" on public.batch_supplies;
create policy "members add batch supplies" on public.batch_supplies
  for insert to authenticated with check (public.is_member(business_id));
drop policy if exists "members remove batch supplies" on public.batch_supplies;
create policy "members remove batch supplies" on public.batch_supplies
  for delete to authenticated using (public.is_member(business_id));

revoke all on public.batch_supplies from anon;
grant select, insert, delete on public.batch_supplies to authenticated;

-- Verabatch migration 0018: which of your supplies a recipe line is (Leslie, Nov 9).
--
-- "Which lavender?" then "Which one of yours is it?": a recipe line (by its line key) can point
-- at one of the maker's supplies (materials), or be set to "don't link" (material_id null).
-- No row = not decided yet: batches then match by name, as before. Kept outside the recipe so
-- linking never counts as a recipe change. A variation falls back to its parent's links.

create table if not exists public.line_links (
  product_id uuid not null references public.products (id) on delete cascade,
  line_key text not null check (char_length(line_key) between 1 and 20),
  business_id uuid not null references public.businesses (id) on delete cascade,
  material_id uuid references public.materials (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (product_id, line_key)
);

create index if not exists line_links_material_idx on public.line_links (material_id);

alter table public.line_links enable row level security;

drop policy if exists "members read line links" on public.line_links;
create policy "members read line links" on public.line_links
  for select to authenticated using (public.is_member(business_id));
drop policy if exists "members add line links" on public.line_links;
create policy "members add line links" on public.line_links
  for insert to authenticated with check (public.is_member(business_id));
drop policy if exists "members change line links" on public.line_links;
create policy "members change line links" on public.line_links
  for update to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
drop policy if exists "members remove line links" on public.line_links;
create policy "members remove line links" on public.line_links
  for delete to authenticated using (public.is_member(business_id));

-- The product and the supply must both belong to the same business as the link.
create or replace function public.line_links_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.products p where p.id = new.product_id and p.business_id = new.business_id) then
    raise exception 'product belongs to another business';
  end if;
  if new.material_id is not null and not exists (
    select 1 from public.materials m where m.id = new.material_id and m.business_id = new.business_id
  ) then
    raise exception 'material belongs to another business';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists line_links_check on public.line_links;
create trigger line_links_check before insert or update on public.line_links
  for each row execute function public.line_links_match();

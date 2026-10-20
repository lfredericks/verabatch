-- Verabatch migration 0005: variations. A variation is a product linked to a parent
-- product. It stores only its differences from the parent's recipe ("changes"), so
-- when the parent recipe changes, the variation follows except where it differs.
-- One level only: a variation can't have variations.

alter table public.products
  add column if not exists parent_id uuid references public.products (id) on delete set null,
  add column if not exists changes jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.products add constraint products_changes_array
    check (jsonb_typeof(changes) = 'array' and jsonb_array_length(changes) <= 200);
exception when duplicate_object then null; end $$;

create index if not exists products_parent_idx on public.products (parent_id);

create or replace function public.products_check_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
begin
  if new.parent_id is null then
    return new;
  end if;
  if new.parent_id = new.id then
    raise exception 'a product cannot be its own variation';
  end if;
  select business_id, parent_id into p from public.products where id = new.parent_id;
  if not found or p.business_id <> new.business_id then
    raise exception 'parent product not found';
  end if;
  if p.parent_id is not null then
    raise exception 'a variation cannot have variations';
  end if;
  if exists (select 1 from public.products c where c.parent_id = new.id) then
    raise exception 'a product with variations cannot become a variation';
  end if;
  return new;
end;
$$;

drop trigger if exists products_parent on public.products;
create trigger products_parent before insert or update on public.products
  for each row execute function public.products_check_parent();

-- Verabatch migration 0014: Free plan limits and the three-strikes rule.
--
-- Free = one product (variations count) and up to 3 logged batches, enforced here so it
-- holds even outside the app. businesses.plan already exists (0001) and people can't
-- change it from the app (column grants).
-- Three strikes (Master Plan, Oct 23): a save that turns the Free product into a different
-- product is a strike. The app decides what counts; free_strikes and free_base (the product
-- as it was at the last strike) are written only through record_free_save() below.
-- (The supplies-cost-invoices branch's migration becomes 0015.)

alter table public.businesses
  add column if not exists free_strikes int not null default 0,
  add column if not exists free_base jsonb;

create or replace function public.enforce_free_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
  n int;
begin
  if tg_table_name = 'products' then
    select plan into p from public.businesses where id = new.business_id;
    if p = 'free' then
      select count(*) into n from public.products where business_id = new.business_id;
      if n >= 1 then raise exception 'free_limit_products' using errcode = 'P0001'; end if;
    end if;
  else
    select b.plan into p from public.businesses b join public.products pr on pr.business_id = b.id where pr.id = new.product_id;
    if p = 'free' then
      select count(*) into n from public.batches ba join public.products pr on pr.id = ba.product_id
        where pr.business_id = (select business_id from public.products where id = new.product_id);
      if n >= 3 then raise exception 'free_limit_batches' using errcode = 'P0001'; end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_free_limit on public.products;
create trigger products_free_limit before insert on public.products
  for each row execute function public.enforce_free_limits();

drop trigger if exists batches_free_limit on public.batches;
create trigger batches_free_limit before insert on public.batches
  for each row execute function public.enforce_free_limits();

-- Record a save of the Free product: set the starting point if there is none, or count
-- a strike and move the starting point. Returns the strike count.
create or replace function public.record_free_save(p_business uuid, p_base jsonb, p_strike boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not public.is_member(p_business) then raise exception 'not a member'; end if;
  if pg_column_size(p_base) > 20000 then raise exception 'too big'; end if;
  update public.businesses
    set free_strikes = free_strikes + (case when p_strike then 1 else 0 end),
        free_base = case when p_strike or free_base is null then p_base else free_base end
    where id = p_business
    returning free_strikes into n;
  return n;
end;
$$;

revoke all on function public.record_free_save(uuid, jsonb, boolean) from public, anon;
grant execute on function public.record_free_save(uuid, jsonb, boolean) to authenticated;

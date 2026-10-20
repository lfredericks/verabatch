-- Verabatch migration 0001: businesses and who belongs to them.
--
-- A business has members (one owner in v1). Every later table (products, batches...)
-- belongs to a business, so teams can be added later without reworking the data.
-- Row level security: people only ever see businesses they belong to.

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  city_state_zip text not null default '' check (char_length(city_state_zip) <= 120),
  contact text not null default '' check (char_length(contact) <= 200),
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index if not exists business_members_user_idx on public.business_members (user_id);

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

-- Is the signed-in person a member of this business?
create or replace function public.is_member(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = b and m.user_id = auth.uid()
  );
$$;

drop policy if exists "members read their business" on public.businesses;
create policy "members read their business" on public.businesses
  for select to authenticated using (public.is_member(id));

drop policy if exists "members update their business" on public.businesses;
create policy "members update their business" on public.businesses
  for update to authenticated using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists "people read their own memberships" on public.business_members;
create policy "people read their own memberships" on public.business_members
  for select to authenticated using (user_id = auth.uid());

-- From the app, people may only edit these columns. Plan is changed by billing later,
-- and businesses are created only through create_business() below.
revoke insert, update, delete on public.businesses from anon, authenticated;
grant update (name, city_state_zip, contact) on public.businesses to authenticated;
revoke insert, update, delete on public.business_members from anon, authenticated;

-- Keep updated_at current.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_touch on public.businesses;
create trigger businesses_touch before update on public.businesses
  for each row execute function public.touch_updated_at();

-- Create a business and make the signed-in person its owner, in one step.
-- Each person can own one business in v1.
create or replace function public.create_business(p_name text, p_city_state_zip text, p_contact text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if exists (select 1 from public.business_members where user_id = auth.uid()) then
    raise exception 'you already have a business';
  end if;
  insert into public.businesses (name, city_state_zip, contact)
    values (trim(p_name), trim(coalesce(p_city_state_zip, '')), trim(coalesce(p_contact, '')))
    returning id into new_id;
  insert into public.business_members (business_id, user_id, role)
    values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

revoke all on function public.create_business(text, text, text) from public, anon;
grant execute on function public.create_business(text, text, text) to authenticated;

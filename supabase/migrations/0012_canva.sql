-- Verabatch migration 0012: Canva connection.
--
-- "Open in Canva": each person connects their own Canva account once. Canva's sign-in keys
-- for that person live here, one row per person. Only that person can read or change their row.
-- (The WIP branch supplies-cost-invoices has an unrun 0011 of its own: renumber it to 0013.)

create table if not exists public.canva_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.canva_connections enable row level security;

drop policy if exists "own canva connection read" on public.canva_connections;
create policy "own canva connection read" on public.canva_connections
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "own canva connection add" on public.canva_connections;
create policy "own canva connection add" on public.canva_connections
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "own canva connection change" on public.canva_connections;
create policy "own canva connection change" on public.canva_connections
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own canva connection remove" on public.canva_connections;
create policy "own canva connection remove" on public.canva_connections
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.canva_connections to authenticated;

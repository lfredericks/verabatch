-- Verabatch migration 0015: the waitlist (Leslie, Nov 6-7).
--
-- The WordPress form on verabatch.com posts to app.verabatch.com/api/waitlist, which saves the
-- signup here and adds the person to Resend. Locked down: the public key can only ADD a row.
-- Nobody can read, change or delete rows from the app; Leslie reads them in the Supabase
-- Table Editor. Resend is where unsubscribes live; this copy is for picking beta testers.
-- (The supplies-cost-invoices branch's migration becomes 0016.)

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and length(email) <= 254),
  makes text[] not null default '{}',
  product_count text,
  sells text[] not null default '{}',
  wants text[] not null default '{}',
  source text,
  created_at timestamptz not null default now(),
  check (cardinality(makes) <= 12 and cardinality(sells) <= 12 and cardinality(wants) <= 3)
);

alter table public.waitlist enable row level security;

revoke all on public.waitlist from anon, authenticated;
grant insert on public.waitlist to anon, authenticated;

drop policy if exists "waitlist insert only" on public.waitlist;
create policy "waitlist insert only" on public.waitlist
  for insert to anon, authenticated
  with check (true);

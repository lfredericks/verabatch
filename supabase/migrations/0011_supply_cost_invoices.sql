-- Verabatch migration 0011: supply cost, recognized names and descriptions, and invoices.
--
-- Each supply now records what it cost, the official ingredient name it was matched to
-- (or the maker's description when it isn't recognized), and the invoice it came on.
-- Invoices keep the photo or PDF in a private storage bucket, "invoices", in a folder
-- named after the business (same rules as logos).

alter table public.supplies add column if not exists cost numeric(12, 2) check (cost is null or (cost >= 0 and cost < 10000000));
alter table public.supplies add column if not exists description text not null default '' check (char_length(description) <= 500);
-- {"kind": "official" | "custom", "name": "..."} or null
alter table public.supplies add column if not exists name_pick jsonb check (name_pick is null or jsonb_typeof(name_pick) = 'object');

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  file_path text not null default '' check (char_length(file_path) <= 300),
  file_type text not null default '' check (file_type in ('', 'image/jpeg', 'image/png', 'application/pdf')),
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

-- Which invoice a supply came on (kept if the invoice record is removed).
alter table public.supplies add column if not exists invoice_id uuid references public.invoices (id) on delete set null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];

-- Same folder rule as logos: the first folder is the business id (public.logo_business, migration 0007).
drop policy if exists "members read invoice files" on storage.objects;
create policy "members read invoice files" on storage.objects
  for select to authenticated
  using (bucket_id = 'invoices' and public.is_member(public.logo_business(name)));

drop policy if exists "members add invoice files" on storage.objects;
create policy "members add invoice files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices' and public.is_member(public.logo_business(name)));

drop policy if exists "members remove invoice files" on storage.objects;
create policy "members remove invoice files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'invoices' and public.is_member(public.logo_business(name)));

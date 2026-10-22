-- Verabatch migration 0007: logos.
--
-- A business can upload its logo, and each product can have its own (optional).
-- Files live in a private storage bucket "logos", in a folder named after the business:
--   <business_id>/business-<random>.png
--   <business_id>/product-<product_id>-<random>.png
-- Only members of that business can see, add, replace or remove its files.

alter table public.businesses add column if not exists logo_path text check (logo_path is null or char_length(logo_path) <= 300);
grant update (logo_path) on public.businesses to authenticated;

alter table public.products add column if not exists logo_path text check (logo_path is null or char_length(logo_path) <= 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 4194304, array['image/png', 'image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = 4194304, allowed_mime_types = array['image/png', 'image/jpeg'];

-- The business a logo file belongs to: its first folder, if that folder is a business id.
create or replace function public.logo_business(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-fA-F-]{36}$' then split_part(object_name, '/', 1)::uuid
  end;
$$;

drop policy if exists "members read logos" on storage.objects;
create policy "members read logos" on storage.objects
  for select to authenticated
  using (bucket_id = 'logos' and public.is_member(public.logo_business(name)));

drop policy if exists "members add logos" on storage.objects;
create policy "members add logos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and public.is_member(public.logo_business(name)));

drop policy if exists "members change logos" on storage.objects;
create policy "members change logos" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and public.is_member(public.logo_business(name)))
  with check (bucket_id = 'logos' and public.is_member(public.logo_business(name)));

drop policy if exists "members remove logos" on storage.objects;
create policy "members remove logos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.is_member(public.logo_business(name)));

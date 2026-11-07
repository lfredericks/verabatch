-- Verabatch migration 0016: first and last name on the waitlist (Leslie, Nov 7), both required,
-- and a fill-in for "Something else" under What do you make?
-- (The supplies-cost-invoices branch's migration becomes 0017.)

alter table public.waitlist
  add column if not exists first_name text not null default '' check (length(first_name) <= 60),
  add column if not exists last_name text not null default '' check (length(last_name) <= 60),
  add column if not exists makes_other text check (length(makes_other) <= 100);

update public.waitlist set makes = array_replace(makes, 'Teas and spice blends', 'Teas, spice and herb blends');

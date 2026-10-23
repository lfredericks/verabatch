-- Verabatch migration 0011: wraparound labels and small containers.
--
-- A size's label can be one wraparound strip (front on the left, back text on the right,
-- printed as one piece) instead of a separate front and back. Rectangles only.

alter table public.sizes add column if not exists label_wrap boolean not null default false;

-- Small container: under 12 sq in of room for labels on the whole package. FDA then allows
-- ingredient letters of 1/32 in instead of 1/16 in (21 CFR 701.3(b)). The maker confirms it.
alter table public.sizes add column if not exists label_small boolean not null default false;

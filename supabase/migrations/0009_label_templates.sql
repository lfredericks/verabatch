-- Verabatch migration 0009: oval labels and label sheet templates.
--
-- Sizes can now have oval front labels (width and height across), and remember which
-- ready-made label sheet they were picked from (an Avery template number, like 22807),
-- so whole sheets can be printed later.

alter table public.sizes drop constraint if exists sizes_label_shape_check;
alter table public.sizes add constraint sizes_label_shape_check check (label_shape in ('rect', 'round', 'oval'));

alter table public.sizes add column if not exists label_template text
  check (label_template is null or char_length(label_template) <= 20);

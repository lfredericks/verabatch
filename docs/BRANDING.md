# Branding and themes

The name and the look live in two places, so a rebrand or a market reskin is a
small edit, not a hunt through the code.

| Change | Edit | What it controls |
| --- | --- | --- |
| Name, tagline, home page words, footer | `lib/brand/brand.ts` | Every place the product name appears, page titles, link previews |
| Colors, fonts, corner rounding, logo mark shape | `lib/brand/themes/<theme>.ts` | Every screen, in light and dark mode |
| Which theme the live site uses | Vercel setting `NEXT_PUBLIC_THEME` (e.g. `bakery`) | Unset = `default` |

See every token at **/styleguide** on the live site. Add `?theme=bakery` to preview
another theme without changing the live site.

## Rules for code

- No raw colors, font names or corner sizes in `app/` or `globals.css`. Use the `var(--...)`
  names listed at the top of `globals.css`. Need a new kind of color? Add it to `ColorTokens`
  in `lib/brand/types.ts` and give every theme a value.
- Never type the product name. Use `brand.name`, `pageTitle()`, `brandText()` or `<BrandMark />`.
- Market-specific wording (cosmetics vs baked goods) belongs in the market pack, not the brand.

## Adding a theme

1. Copy `lib/brand/themes/bakery.ts` (it only lists what differs from the default).
2. Change `id`, `label`, colors, fonts.
3. Add it to `THEMES` in `lib/brand/index.ts`.
4. Check it at `/styleguide?theme=<id>`.

## Later

- A real logo file can replace the mark: add an `logo` field to the theme and use it in `app/BrandMark.tsx`.
- Per-market themes can switch by domain (e.g. a bakery domain) instead of one site-wide setting.

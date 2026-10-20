# Verabatch

Recipe in, batch recorded, compliant label out, for small-batch makers. Owner: Leslie.

Read first:
- `docs/PROJECT_HISTORY.md`: how we got here, all decisions, links to the spec and prototypes, current status, next steps.
- `docs/SETUP.md`: accounts, environment variables, one-time Supabase setup.
- The v1 Spec (claude.ai doc linked in the history file) is the source of truth for product decisions.

## Code layout

- `lib/core`: market-agnostic engine (units, recipe math, ingredient order, net contents, lettering, lots, claims, quick entry). Never put cosmetics rules here.
- `lib/packs/cosmetics`: the first market pack. Ingredient and variety names are drafts (`source: "draft"`) until checked against CosIng.
- `app/`: Next.js 15 App Router. `/login` (email code sign-in), `/app` (signed-in area, product list), `/app/products/new` and `/app/products/[id]` (product editor + sizes), `/app/products/[id]/label` (front/back label text; `?batch=` for a lot), `/app/products/[id]/batches/new|[batchId]` (optional batch log), `/auth/confirm` (email link).
- `lib/packs/index.ts`: `activePack()` picks the market. Screens use it, never a pack directly.
- `lib/label.ts`: `buildLabel()` turns product + size + business into label text and print blockers. `lib/sizes.ts`: sizes, net contents, lettering.
- `lib/batches.ts`: batches are OPTIONAL. The label defaults to the usual recipe with no lot; a batch adds its own recipe copy and lot.
- `app/app/products/RecipeLines.tsx`: shared recipe list; saved lines are locked behind a per-line Edit.
- `lib/products.ts`: product shape and `cleanRecipe()` (server-side check of what the browser sends).
- `lib/brand`: product name/words (`brand.ts`) and themes (`themes/`). `/styleguide` shows every token.
- `supabase/migrations`: SQL migrations, applied in order. `supabase/email-templates`: auth emails.
- `tests/`: `spec.test.ts` mirrors the spec's test table; change the test before changing a rule.

## Rules

- Run `npm test` and `npm run build` before every push. Pushes to `main` deploy to Vercel.
- Never commit secrets. `.env.local` holds local settings and is ignored.
- Every business-owned table needs row level security through `public.is_member(business_id)`.
- Design is themed: no raw colors, fonts or the product name in `app/`. Use `lib/brand` (see `docs/BRANDING.md`).
- Leslie isn't a developer: explain steps in plain words, one click at a time.

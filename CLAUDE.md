# Verabatch

Recipe in, batch recorded, compliant label out, for small-batch makers. Owner: Leslie.

Read first:
- `docs/PROJECT_HISTORY.md`: how we got here, all decisions, links to the spec and prototypes, current status, next steps.
- `docs/SETUP.md`: accounts, environment variables, one-time Supabase setup.
- The v1 Spec (claude.ai doc linked in the history file) is the source of truth for product decisions.

## Code layout

- `lib/core`: market-agnostic engine (units, recipe math, ingredient order, net contents, lettering, lots, claims, quick entry). Never put cosmetics rules here.
- `lib/packs/cosmetics`: the first market pack. Ingredient and variety names are drafts (`source: "draft"`) until checked against CosIng.
- `app/`: Next.js 15 App Router. `/login` (email code sign-in), `/app` (signed-in area), `/auth/confirm` (email link).
- `supabase/migrations`: SQL migrations, applied in order. `supabase/email-templates`: auth emails.
- `tests/`: `spec.test.ts` mirrors the spec's test table; change the test before changing a rule.

## Rules

- Run `npm test` and `npm run build` before every push. Pushes to `main` deploy to Vercel.
- Never commit secrets. `.env.local` holds local settings and is ignored.
- Every business-owned table needs row level security through `public.is_member(business_id)`.
- Leslie isn't a developer: explain steps in plain words, one click at a time.

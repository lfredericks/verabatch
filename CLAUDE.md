# Verabatch

Recipe in, batch recorded, compliant label out, for small-batch makers. Owner: Leslie.

Read first:
- `docs/PROJECT_HISTORY.md`: how we got here, all decisions, links to the spec and prototypes, current status, next steps.
- `docs/SETUP.md`: accounts, environment variables, one-time Supabase setup.
- The v1 Spec (claude.ai doc linked in the history file) is the source of truth for product decisions.

## Code layout

- `lib/core`: market-agnostic engine (units, recipe math, ingredient order, net contents, lettering, lots, claims, quick entry). Never put cosmetics rules here.
- `data/cosing-inci-names.txt` + `tests/cosing.test.ts`: every label name must be an official CosIng name or a listed exception (`docs/INGREDIENTS.md`).
- Ingredient names: a recipe line can carry `pick` (official name chosen from suggestions, or the maker's own name). Own names print as typed and are flagged on the label page. Suggestions: `/api/ingredients?q=` (`lib/packs/cosmetics/nameSearch.ts`, common names in `aliases.ts`).
- `lib/packs/cosmetics`: the first market pack. Ingredient and variety names are drafts (`source: "draft"`) until checked against CosIng.
- `app/`: Next.js 15 App Router. `/login` (email code sign-in), `/app` (signed-in area, product list), `/app/products/new` and `/app/products/[id]` (product editor + sizes), `/app/products/[id]/label` (front/back label text; `?batch=` for a lot), `/app/products/[id]/batches/new|[batchId]` (optional batch log), `/auth/confirm` (email link).
- `lib/packs/index.ts`: `activePack()` picks the market. Screens use it, never a pack directly.
- `lib/label.ts`: `buildLabel()` turns product + size + business into label text and print blockers.
- `lib/labelPdf.ts`: the label as an exact-size PDF (front page, back page) for printing and Canva import. Only two font families, both in Canva: Libre Baskerville and Lato (`lib/labelFonts/`, OFL). Letter sizes never go below the FDA minimums. Served at `/app/products/[id]/label/pdf`.
- `lib/logos.ts` + `app/app/LogoField.tsx`: business and product logos (private `logos` bucket, folder = business id). Product logo overrides the business logo on the label front unless the label page's checkboxes say otherwise (both = side by side on the front). Never on the back.
- `lib/warnings.ts` + `lib/packs/cosmetics/warnings.ts` + `app/app/products/Warnings.tsx`: standard label warnings per product (products.warnings = {keys, custom}). Required FDA wording prints as written; the rest join after "Caution:". Warnings print in bold.
- `lib/sizes.ts`: sizes, net contents, lettering. Label shapes: rect, round, oval. `label_wrap` = one wraparound strip (front left 40%, back right); `label_small` = container under 12 sq in, 1/32 in ingredient letters allowed.
- Back label (Leslie's rule): one text size for everything, combine short lines before shrinking, never below the legal minimum; past that, show the cut-off text and suggest labels that fit (`labelsThatFitBack`).
- `lib/containers.ts`: common containers (supplier-measured, each with its source) and the label sizes that fit them (front/back pair, wrap, lid, matching Avery sheets). The size form's "What container?" picker uses it. Only add measurements from a supplier page or a maker's ruler.
- `lib/labelTemplates.ts`: Avery label sheets (layouts measured from Avery's own template PDFs only). A size remembers its sheet in `sizes.label_template`.
- `lib/supplies.ts` + `app/app/supplies/`: supplier lots. `batch_supplies` links a batch's recipe line (by line key) to the lots it used; used lots can't be deleted (keeps the recall trace).
- `lib/batches.ts`: batches are OPTIONAL. The label defaults to the usual recipe with no lot; a batch adds its own recipe copy and lot.
- `app/app/products/RecipeLines.tsx`: shared recipe list; saved lines are locked behind a per-line Edit.
- `lib/variations.ts`: recipe variations. A variation (products.parent_id) stores only `changes` (remove/replace/add by line key) and follows its parent otherwise. Always get a product's real recipe with `effectiveRecipe()` in `lib/productData.ts`. Saving a changed recipe asks: update master, save as variation, or save as a new standalone product.
- `lib/products.ts`: product shape and `cleanRecipe()` (server-side check of what the browser sends).
- `lib/brand`: product name/words (`brand.ts`) and themes (`themes/`). `/styleguide` shows every token.
- `supabase/migrations`: SQL migrations, applied in order. `supabase/email-templates`: auth emails.
- `tests/`: `spec.test.ts` mirrors the spec's test table; change the test before changing a rule.

## Rules

- Verabatch is a product for any small-batch maker. Liminalia (Leslie's brand) is only a test case: its recipes live in `docs/test-cases/` and tests, never in app code or product decisions.

- v1 is US-only: FDA cosmetic labeling rules, "USA" on the made-by line. Country choice in setup comes later.

- Run `npm test` and `npm run build` before every push. Pushes to `main` deploy to Vercel.
- Never commit secrets. `.env.local` holds local settings and is ignored.
- Every business-owned table needs row level security through `public.is_member(business_id)`.
- Design is themed: no raw colors, fonts or the product name in `app/`. Use `lib/brand` (see `docs/BRANDING.md`).
- Delete safety follows the hierarchy (Leslie): products/recipes and batches are the top branch, so deleting them lives on the Manage page and needs typed DELETE. Lower-level things (sizes, recipe lines) use a simple inline confirm.
- Leslie isn't a developer: explain steps in plain words, one click at a time.

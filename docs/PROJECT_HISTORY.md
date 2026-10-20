# Verabatch: project history and handoff

A record of the first planning and build sessions (Oct 16–20, 2026), so a new
conversation can pick up without losing anything. The v1 Spec doc is the source of
truth for product decisions; this file explains how we got there and where things stand.

## The idea

Software for small-batch makers of balms, butters, oils, soap, candles and home fragrance.
A maker types a recipe the way they make it ("12 oz shea, 1/2 cup almond oil, 10 drops
lavender, makes 4"), and Verabatch handles unit conversions, official ingredient names
(INCI), ingredient order, net contents, lettering size, claims checks and lot numbers,
and keeps a record of every batch.

It started as a "$10M company idea" exercise. Leslie (founder, also runs the Liminalia
botanical brand) is customer zero: v1 is done when it produces correct labels for every
Liminalia product.

## How the idea evolved

1. First pitch: compliance-and-labeling SaaS for indie makers ("TurboTax for makers").
2. Tested Polsia (an AI company builder). It produced "Labelmoss", a $49 human-audit landing
   page. Rejected: it was a service, not software, and claimed "regulatory review" with nothing
   behind it.
3. Pivoted to a self-serve app: enter recipe, get label copy to paste into Canva, then a design
   tool and print ordering later.
4. Added batch math in everyday units, editable batches (white vs natural beeswax, fewer drops),
   guided first-run flow, "Something else" product types, supplier documents and IFRA
   max-use-rate checks, ingredient varieties (German vs Roman chamomile), multiple sizes per
   product with label dimensions and lettering-size rules.
5. Leslie pulled back: "we need a working product." Wrote the v1 Spec and started building.

## Naming

Went through Batchwise (taken), LabelMoss (disliked), Lotkeeper, SourceMark (interim),
Touchmark, Batchmark, Hearthmark-style names (too homey), TruBatch, Artiledger.
**Chosen: Verabatch** (vera = true: true to recipe, true to label). Considered Veribatch;
kept Verabatch because a coined word is a stronger trademark and "Veri-" is crowded.
To do: USPTO search, buy verabatch.com and veribatch.com (redirect).

## Product decisions (see the v1 Spec for the full list)

- **Plans:** Free and Pro (working name). Enterprise later.
  - Free: 1 product, 1 size, every feature working, saved. No Verabatch branding on labels.
  - Pro: unlimited. Price to be tested; Leslie thinks $12/mo is too low. Reference: Stocksmith
    (formerly Craftybase) has no free plan, $20/mo entry, $49 Studio.
  - New accounts start on Free with no card. A 14-day Pro trial is offered inside the app
    (never automatic); starting it requires a card, and it charges unless canceled.
  - After a canceled trial: everything stays visible but locked, except the first product.
  - Enterprise (later): integrations, teams, recall lookups, priced per business.
- **Principles:** Free is genuinely useful. Pro grows into a holistic system for running a
  small-batch business. Every feature ties back to recipe, batch and lot.
- **Open framework:** a shared core plus swappable market packs. Cosmetics is the first pack.
  Other markets on the list: baked goods / cottage food (recipe cards, allergens), jams and
  spice blends, pet treats, garden products, herbal teas (careful), craft beverages (later),
  cafe allergen cards and wholesale spec sheets (Enterprise).
- **Integrations (Enterprise, later):** Squarespace (Extensions route works on any plan; API
  keys need Commerce Advanced), Etsy (app approval ~30 days), Shopify, Square, Canva Apps SDK
  sidebar, Faire, WooCommerce, Wix, Zapier, Clover, QuickBooks, label printers.
- **Canva:** build a Verabatch app inside Canva (Apps SDK) rather than the Autofill API, which
  needs Canva Pro. Print through Canva or a printer partner later.
  **Goal (Leslie, Oct 20):** an "Open this label in Canva" button on the label page, so the
  label text (and later the design) lands in Canva without copy-paste. How it gets there
  (Canva app/plugin, Connect API, or the sidebar app pulling from Verabatch) is still to be
  worked out; check what Canva currently allows before building. Until then, keep label
  output structured (`buildLabel()` in `lib/label.ts` returns front, back, net, lot as
  separate fields) so any Canva route can fill named text boxes.
- **Ingredient data:** EU CosIng (free) as the base, US name corrections, a curated maker layer;
  license PCPC's wINCI later. Supplier documents: extract facts, link to sources, don't host
  their PDFs; pitch suppliers on a "document drop" portal.

## Market sizing note

$10M a year could come from ~25,000 Pro makers at ~$20/mo ($6M) + 400 Enterprise at $500/mo
($2.4M) + print and supplier partnerships ($1.6M). Illustrative only. Market size is unverified.

## Documents and prototypes (claude.ai artifacts, private to Leslie)

| What | Link |
| --- | --- |
| Verabatch v1 Spec (source of truth) | https://claude.ai/code/artifact/93909ffe-e531-4a28-b074-adbc7ce57611 |
| Five-Maker Test Plan | https://claude.ai/code/artifact/4e1e1656-4506-4047-9e29-d13646a88581 |
| Full prototype (workbench, guided flow, supplier docs) | https://claude.ai/artifact/FXhLhwVPEWDgKbH162cs5t |
| Starter prototype (simple version, varieties, sizes) | https://claude.ai/artifact/35KkBi6xWmsYtc3JvRRz2Y |
| Canva sidebar mockup | https://claude.ai/artifact/Xqhk5ZY6SAvhnDwTfudpX6 |

## Build status (as of Oct 20, 2026)

Build order from the spec: 1 skeleton and sign-in, 2 math core, 3 ingredient database,
4 products/sizes/labels, 5 batches, 6 Liminalia run then five outside makers.

- **Milestone 1 (skeleton): done.** Sign-in works (Supabase's default email link; custom
  email waits on SMTP). Leslie signed up on her phone and saved Liminalia's details.
- **Milestone 2 (math core): done.** Every spec test case passes.
- **Milestone 3 (ingredients): partly done.** Every ingredient in Leslie's materials sheet
  resolves or asks "which one?" (`tests/liminalia.test.ts`). Still drafts: CosIng import and
  hand checks not done; bottle photos pending to confirm species.
- **Milestone 4 (products, sizes, labels): working.** Leslie built the Relief Balm 2 oz
  label on her phone (Oct 20): front, back, lettering minimum, claims flag, copy buttons.
  Not done: product description field and its claims check, Free plan limits (deferred
  until payments).
- **Theming:** name and look live in `lib/brand` (`docs/BRANDING.md`).
- **Milestone 5 (batches): built Oct 20, optional by design.** Label defaults to the usual
  recipe with no lot; logging a batch gives that run its own label and lot.
- Later: "Open this label in Canva" button (see Canva note above).
- Next: milestone 5 check, then the rest of Liminalia's products
  (sprays: `docs/LIMINALIA.md`).
- Live: https://verabatch-six.vercel.app

## Why a new session (Oct 20)

This session's network allowlist was fixed at start, so it couldn't reach supabase.co even
after Leslie added the domains. A new session should be able to use the Supabase Management
API directly. Leslie generated a project-scoped Supabase access token named "Claude"
(30 days or less); it is NOT stored in the repo. Ask her for it or have her generate a new one.

## Next steps

1. Finish milestone 1 setup (docs/SETUP.md) and test sign-in end to end.
2. Collect Liminalia recipes: exact amounts, units, jar sizes, label dimensions, label photos.
   Known products: Relief Balm (2 oz cobalt jar), Air Purifying Puck, aromatherapy cleaning
   spray, Bug Off spray.
3. Milestone 3: ingredient database (CosIng import, curation starting with Liminalia).
4. Open questions in the spec: product-name claims check ("Relief Balm" flags "relief"),
   whether v1 excludes pesticide-claim products like Bug Off, domain purchase, Pro name and price.

## Working with Leslie

- Direct, casual-business tone. Keep it simple; she wants it "super super simple to deal with."
- She is a marketer and designer, not a developer. Give exact click-by-click steps, never assume
  she knows developer tools, and don't send her through settings mazes. If unsure how a site's
  UI works, ask her for a screenshot rather than guessing.
- She thinks big ("this is a $10M idea") but wants a working product before polish.

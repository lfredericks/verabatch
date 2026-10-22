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

It started as a "$10M company idea" exercise. Leslie is the founder. Her own botanical
brand, Liminalia, is used only as a test case (real recipes to run through the app); the
product is built for small-batch makers in general, not for Liminalia (Leslie, Oct 22).

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
- **Canva (decided Oct 22):** Autofill is out (every user would need Canva Enterprise).
  Route 1, building now: Verabatch makes the label as an exact-size PDF, and an "Open this
  label in Canva" button imports it into the maker's own Canva through the Connect API
  (design import, then return navigation back to Verabatch). Connect APIs are free for public
  integrations; Leslie's Canva Pro is enough; Canva reviews the integration before other
  makers can use it. Route 2, later: a Canva sidebar app (Apps SDK) that fills text into a
  design the maker already has.
  **Fonts (Leslie, Oct 22):** the label PDF uses only two font families, both standard in
  Canva, so text stays editable after import: Libre Baskerville (product name) and Lato
  (everything else, bold for the net weight). Makers restyle in Canva. Each label part is
  one paragraph in one font and size, so it should import as one text box.
  **Tested Oct 22 on Leslie's Canva:** hand-uploaded PDF imports with editable text in the right
  fonts. File names follow "Business - Product - Size.pdf" (plus " - Lot X" for a batch), which
  also becomes the design's name in Canva.
  **Logos (Leslie, Oct 22):** a business logo, and an optional logo per product (a variation uses
  its parent's). The product logo overrides the business logo on the front by default; checkboxes
  on the label page pick either or both (both: side by side at the top of the front). Logos never
  go on the back (ingredient) label.
  **Warnings (Leslie, Oct 22):** standard warning statements per product (`lib/packs/cosmetics/warnings.ts`):
  FDA-required wording when it applies (21 CFR 740.17 foaming bath products, 740.11 aerosols),
  common skin cautions, room-spray cautions, candle safety (ASTM F2058 style), plus up to five of
  the maker's own. Suggested ones are marked per product type. They print in bold after the
  ingredients (740.2: warnings must be conspicuous, at least 1/16 in). Migration 0008.
  PNG or JPG up to 4 MB, private storage bucket `logos` (migration 0007).
- **Ingredient data:** EU CosIng (free) as the base, US name corrections, a curated maker layer;
  license PCPC's wINCI later. Supplier documents: extract facts, link to sources, don't host
  their PDFs; pitch suppliers on a "document drop" portal.

## Market sizing note

$10M a year could come from ~25,000 Pro makers at ~$20/mo ($6M) + 400 Enterprise at $500/mo
($2.4M) + print and supplier partnerships ($1.6M). Illustrative only. Market size is unverified.

## Documents and prototypes (claude.ai artifacts, private to Leslie)

| What | Link |
| --- | --- |
| Punchlist (checkable, kept current) | https://claude.ai/artifact/YZdTcL2X36owXc5qAwrEQS |
| Verabatch v1 Spec (source of truth) | https://claude.ai/code/artifact/93909ffe-e531-4a28-b074-adbc7ce57611 |
| Five-Maker Test Plan | https://claude.ai/code/artifact/4e1e1656-4506-4047-9e29-d13646a88581 |
| Full prototype (workbench, guided flow, supplier docs) | https://claude.ai/artifact/FXhLhwVPEWDgKbH162cs5t |
| Starter prototype (simple version, varieties, sizes) | https://claude.ai/artifact/35KkBi6xWmsYtc3JvRRz2Y |
| Canva sidebar mockup | https://claude.ai/artifact/Xqhk5ZY6SAvhnDwTfudpX6 |

## Build status (as of Oct 22, 2026)

Verabatch is a product for any small-batch maker. Liminalia is only the first test case
(its recipes: `docs/test-cases/liminalia.md`); nothing in the app is built for it.

1. **Sign-in and business details: done.**
2. **Recipe math: done.** Every spec test case passes.
3. **Ingredient database: partly done.** Curated draft list covers common maker
   ingredients, with "which one?" questions for multi-species botanicals. CosIng names are in
   the repo and every label name is checked against them in tests (`docs/INGREDIENTS.md`);
   the copy is from 2016 and must be refreshed before launch. Not done: using CosIng to
   suggest names for ingredients we don't know, the ~300-name curated layer, hand checks.
4. **Products, sizes, labels: almost done.** Built: products and recipes, locked info and
   recipe lines, variations (linked or standalone), sizes, label page (front/back, net
   contents, lettering minimum, claims flag on name, copy buttons), Manage page with typed
   DELETE. Description check built (Oct 22): descriptions per channel (Etsy, website, Amazon, other)
   with risky words highlighted live. Label PDF built (Oct 22): front and back at the label's
   exact size, FDA letter minimums measured on the lowercase "o", two Canva fonts
   (`lib/labelPdf.ts`). Not done: label sign-off
   against a real printed label. Free plan limits deferred until payments.
5. **Batches: built, optional by design.** Not done: sign-off with a real logged batch.
6. **Real-world run, then five outside makers: not started.** Run a full product line through
   the app (test case: Liminalia's balm and sprays), fix what trips it up, then the
   Five-Maker Test Plan.

Product questions open: should the claims check cover product names (yes so far), how to
handle pesticide claims (bug repellents are EPA, not FDA), whether "air purifying" needs a
claims rule, domain purchase, pricing after the five-maker round.

Parked for later:
- **Printer profiles (Leslie, Oct 22).** Goal: "hit a button and print it right every time."
  Off-center prints are the main pain, worst on round and square labels. Verabatch makes the
  print-ready sheet (exact-size PDF on a chosen label sheet), each printer gets a profile from
  a one-time calibration page (shift, scale, drift, measured at two corners), every sheet is
  pre-corrected; bleed on round/square designs. First version could correct existing Canva
  PDFs. Color matching on home inkjets is limited.
- **"Open this label in Canva" button** (see Canva note above). Done: the label PDF (Oct 22).
  To do: Canva developer account (Leslie signs in), Connect integration keys in Vercel,
  "Connect your Canva" sign-in, the import button, return navigation, Canva review.
- **"Write this for me" descriptions (Leslie, Oct 22).** AI drafts per channel from the product's
  info, following each platform's format and current length limits (look them up when building),
  told to avoid drug/advertising/brand claims, then run through the claims check; lands in the
  edit box, never auto-saved. Needs an Anthropic API key (Console account, pay-as-you-go) in
  Vercel. Likely a Pro feature.
- **Standard label size templates (Leslie, Oct 22).** Pick a common label (for example a 2 in
  round or 3 x 2 in rectangle, by label-sheet brand and number) instead of typing dimensions.
  Ties into printer profiles: the sheet number also gives the print layout.
- **Makers' own flag list:** let a maker add brand names or words to flag (the built-in brand
  list in `lib/packs/cosmetics/brands.ts` is a starting point, not every trademark).
- **Ingredient list upkeep (Leslie, Oct 22).** Update the official list automatically, and flag
  makers' saved recipes when a name they use changes or is removed (`docs/INGREDIENTS.md`).
- **Country choice in setup.** v1 is US/FDA only; `BusinessInfo.country` exists for later.
- **Custom email sender (SMTP)** before real users; then switch sign-in back to a typed code.

Lessons: React 19 resets forms after an action (it snapped a dropdown back after "Saved.");
product forms submit by hand. Test real phone flows, not only Chromium.

- Theming: `docs/BRANDING.md`. Live: https://verabatch-six.vercel.app

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

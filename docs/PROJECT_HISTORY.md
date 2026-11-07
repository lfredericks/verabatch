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
  Canva, so text stays editable after import: Libre Baskerville (product name) and Lato (replaced by Arimo, Nov 6)
  (everything else, bold for the net weight). Makers restyle in Canva. Each label part is
  one paragraph in one font and size, so it should import as one text box.
  **Tested Oct 22 on Leslie's Canva:** hand-uploaded PDF imports with editable text in the right
  fonts. File names (Leslie): sections joined by underscores, words by dashes:
  "Liminalia_Relief-Balm_Lot-2026-014_2-oz-jar_3x2.pdf" (no lot part for the usual recipe), which
  also becomes the design's name in Canva.
  **Logos (Leslie, Oct 22):** a business logo, and an optional logo per product (a variation uses
  its parent's). The product logo overrides the business logo on the front by default; checkboxes
  on the label page pick either or both (both: side by side at the top of the front). Logos never
  go on the back (ingredient) label.
  **Net weight on the PDF (Oct 22):** printed in capitals (701.13(h): all caps are measured on
  the capitals, so it stays legal smaller), in the bottom 30% of the front by AREA (701.13(f):
  34% of the height on round and oval labels); fronts of 5 sq in or less are exempt from the
  30% rule. Oval labels added (migration 0009).
  **Supplier lots (Leslie, Oct 22):** "Supplies" logs each delivery (ingredient, supplier, their
  lot number, amount, received, best-by, note). Logging a batch asks which lot(s) each recipe
  line used (an infused oil line can use the herb lot and the oil lot), pre-filled with the
  newest matching lots on hand. A supply page lists every batch that used it (recall trace);
  used lots can't be deleted, only marked used up. Subtracting amounts on hand is a later
  option (Leslie). Migration 0010.
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

## Build status (as of Oct 22, 2026; Oct 23 changes in the next section)

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
- **Label sheet templates: started Oct 22.** Sizes can be picked from 15 Avery sheets (round,
  square, oval, rectangle) or by typing the number on the box (`lib/labelTemplates.ts`). Every
  layout was measured from Avery's own template PDF; third-party template sites were off by up
  to 3 mm, so never add one from them. Still to do: OnlineLabels, SheetLabels and other brands;
  printing whole sheets (pairs with printer profiles).
- **Product inventory with store sync (Leslie, Oct 23):** count finished products on hand (from
  batches made minus sold) and keep it in sync with Shopify, Squarespace and other popular
  platforms (Etsy, Square, Wix, WooCommerce). Likely Pro or a higher tier, with supplier management.
- **Supply amounts on hand (Leslie, Oct 22):** optionally subtract what each batch used from a
  supply lot's amount, with low-stock hints. Needs unit conversion between recipe and supply units.
- **Makers' own flag list:** let a maker add brand names or words to flag (the built-in brand
  list in `lib/packs/cosmetics/brands.ts` is a starting point, not every trademark).
- **Ingredient list upkeep (Leslie, Oct 22).** Update the official list automatically, and flag
  makers' saved recipes when a name they use changes or is removed (`docs/INGREDIENTS.md`).
- **Country choice in setup.** v1 is US/FDA only; `BusinessInfo.country` exists for later.
- **Custom email sender (SMTP)** before real users; then switch sign-in back to a typed code.

Lessons: React 19 resets forms after an action (it snapped a dropdown back after "Saved.");
product forms submit by hand. Test real phone flows, not only Chromium.

- Theming: `docs/BRANDING.md`. Live: https://app.verabatch.com (was https://verabatch-six.vercel.app)

### Oct 23: new look, label fit, containers, disclaimer

Decisions (Leslie) and what's live, in the order they matter:

- **Redesign, step 1 of 4: live.** Product page: status bar ("Label ready to review" or "N
  things to fix"), big buttons (Get my label, I made a batch, Shop description), section list.
  Label page: "Your label is ready" header, true-shape preview, big Download PDF. Plan: 2. recipe
  screen (Paprika-style paste, "Which lavender?" on the line), 3. onboarding (Duolingo-style),
  4. container picker (done early, below). Approved screens: Screen Concepts artifact.
- **Style rules learned today.** Follow the approved Screen Concepts and `/styleguide`. Big plum
  buttons only for a screen's one main action; secondary actions (copy, edit, paste) stay small
  and quiet. No walls of chips, no emoji in the UI. Links use the brand color. Hover styles only
  with a real mouse (phones left buttons stuck in hover).
- **Back label rules.** All back text one size; combine lines before shrinking (made-by,
  questions and lot on one line, then all warnings in one bold paragraph); shrink to the FDA
  minimum and no further; past that, show the cut-off text and suggest labels that fit (Avery
  sheets and container wraparounds).
- **Wraparound labels** (`sizes.label_wrap`): one strip, front the left 40%, back the right 60%.
  Net weight lettering uses the front panel's area. Better for long recipes on small jars.
- **Small container setting** (`sizes.label_small`): under 12 sq in of label room, so
  ingredient letters may be 1/32 in (21 CFR 701.3(b)). Set from the container's side band (lids
  not counted, the cautious reading; whether lids count is a question for a reviewer). Relief
  Balm fits a 2 oz thin-wall jar wraparound with it on.
- **Container picker** (`lib/containers.ts`): 32 supplier-measured containers behind 18
  picture tiles (Jars, Tins, Bottles, Tubes, Candles), matching the approved Container screen:
  pick a container, pick a label (front + back, wraparound, lid), enter how much goes in. "My
  container isn't here" types a size or Avery box number. Finding: most 2 oz jars have a side
  band only 1 to 1.6 in tall, so a 3x2 label can't go on the side. Later: more containers; labels
  from other makers (OnlineLabels, roll printers) and marking sizes that aren't a stock product.
- **Label preview = the PDF's own layout** (`LabelPdf.preview`, SVG): true shape, line breaks
  and letter sizes, logos in place; "Zoom in to read it" on wraparounds.
- **Disclaimer:** the maker is responsible for everything; the app is a drafting tool, not
  legal or regulatory advice, not FDA-affiliated, promises no compliance. Text in
  `lib/brand/brand.ts`; full page at /disclaimer, a line on every page, a notice above the label
  download. Guarantee-sounding wording softened. Launch still needs lawyer-reviewed terms with an
  "I agree" at sign-up.
- **Warnings:** "Keep out of reach of children and pets." When required FDA wording already says
  children, it prints "Keep away from pets." instead.
- **Descriptions:** a small Copy button in the corner of each saved description; "Paste from
  Etsy" brings an existing description in to be checked. Pulling listings from Etsy
  automatically needs the Etsy API (store sync, Supply & Inventory phase).
- **Plans (Master Plan):** Free = one product, fully functional, up to 3 batches, Open in Canva
  included; three-strikes rule for workarounds. Pro at launch. AI is never a separate cost: it
  comes with Pro and up. Supply & Inventory is a bolt-on to Pro. Business = Pro + Supply &
  Inventory for bigger teams, possibly CRM integrations (HubSpot).
- **Database:** migration 0011_label_wrap.sql (label_wrap, label_small) was run Oct 23. The
  WIP branch `supplies-cost-invoices` has its own 0011; renumber it to 0012 before merging.
- **Links page** pinned in Leslie's Claude sidebar: "Verabatch Links" artifact
  (https://claude.ai/artifact/6wsUHpKaacBpPnTW6EDKbj).

## Why a new session (Oct 20)

This session's network allowlist was fixed at start, so it couldn't reach supabase.co even
after Leslie added the domains. A new session should be able to use the Supabase Management
API directly. Leslie generated a project-scoped Supabase access token named "Claude"
(30 days or less); it is NOT stored in the repo. Ask her for it or have her generate a new one.

### Oct 24: Open in Canva

- Leslie created the Canva app (public, Connect REST APIs; scopes design:content read/write,
  design:meta read, asset read/write; redirect https://verabatch-six.vercel.app/api/canva/callback;
  return navigation https://verabatch-six.vercel.app/api/canva/return) and put CANVA_CLIENT_ID /
  CANVA_CLIENT_SECRET in Vercel. Canva requires MFA for developer accounts.
- Built: connect once, "Open in Canva" as the label page's main button (Download PDF beside it),
  PDF sent as a design import, edit link tagged so Canva's Return button comes back. Migration
  0012_canva.sql (canva_connections). The WIP branch's 0011 must become 0013.
- When the domain moves: add the new callback/return URLs in Canva (keep the old ones until the
  switch). Submit Canva's review once the domain, privacy policy and terms are live; until then
  only Leslie's own Canva account can use it.

### Nov 5: sign-in fixed

- Supabase had paused the project (free plan, a week unused); Leslie restored it.
- Custom email sender set up: Resend (signed up with GitHub). Sends only to Leslie's address
  until a domain is verified; Leslie is holding the domain until the name is final. Limit 30/hour.
- Sign-in email now carries an 8-digit code plus a link that works on any device. The login
  screen takes the code again (bug fixed: it checked the code against an empty email).
- **Redesign step 2 (recipe screen): live.** Paste button (a new recipe opens on the paste box),
  one card of lines with the official name underneath, tap a line to edit, which-one answers as
  big buttons on the line (a select past 4 choices), + Add an ingredient, makes stepper, one big
  Save recipe button that shows only after a change (Leslie). Next: step 3, onboarding.
- **Redesign step 3 (onboarding): live.** One question per screen: shop name, place, contact (first run
  only), what you make (8 tiles, Which kind? when a tile has several), name, recipe.
- **Container picker** starts on the likeliest containers for the product kind (Leslie).
- **Keep-alive:** the Vercel cron didn't stop the pause; GitHub Actions now pings twice a day
  (`.github/workflows/keepalive.yml`).
- **Label claims (Leslie): live.** Front checkboxes: Handmade, Small batch, Vegan, Fragrance-free,
  Cruelty-free, Pet safe, each checked against the recipe. Organic follows USDA tiers: lines marked
  certified organic print as "Organic ..."; "Made with organic" (70%+) and "Organic" (95%+) only for
  certified or $5,000-exempt makers; certifier line on the back; never the seal. Migration
  0013_claims.sql (run Nov 5). The WIP branch's migration is now 0014.
- **Allergens (Leslie): live.** Optional "Contains: ..." back line from common allergens found in the
  recipe. FDA plans to propose a MoCRA fragrance-allergen rule in Nov 2026; add its list when out.
- **Ingredient names refreshed:** the 2025 EU glossary (Decision 2025/1175, 30,418 names) replaces
  the 2016 copy (`docs/INGREDIENTS.md`). Launch item "CosIng refresh" is done.
- **Free plan limits: live** (`lib/plans.ts`, `lib/planServer.ts`, migration 0014, run Nov 5).
  Free = 1 product (variations count) + 3 logged batches, enforced by database triggers too.
  Three strikes: new name + new scent, or 80% of the recipe replaced, is a strike; after 3 the next
  swap saves with a nudge, the one after is refused. Upgrade text says Pro opens at launch; Stripe
  and the 7-day trial plug in next. Leslie's business is on Pro. To give a tester Pro:
  `update businesses set plan = 'pro' where name = '<their shop>';` in the SQL editor.
- **Password sign-in (optional): live.** Set one under "Signing in" on the shop page; the sign-in
  screen has "Use my password". Codes still work and still create accounts. People stay signed in
  per device. To do: Continue with Google, once Leslie is back in her Google account (all plans,
  not just Pro: Leslie agreed sign-in friction shouldn't be a plan perk). Shopify/Squarespace
  sign-in comes with the store-sync apps, not launch.
- **Domain bought (Leslie, Nov 5): verabatch.com** (plus verabatch.online free for a year, auto-renew
  off). Resend: verabatch.com verified (DNS at Bluehost), sign-in emails now from hello@verabatch.com
  and reach anyone. The domain itself stays on Bluehost's placeholder until launch (Leslie).
- **Timeline (Leslie, Nov 5, internal only):** waitlist page with signup form on verabatch.com in the
  next week or two (no date on it); Nov–Dec testing and the five-maker round; January private beta
  (~25 from the waitlist); **February 2027 public launch**. Master Plan updated.
- **Logo (Leslie, Nov 5):** lowercase Gloock wordmark, "vera" in plum + "batch" in ink
  (`brand.wordmark`), reversed version on plum (pink "vera", white "batch"), and a "vb" icon on plum
  for the browser tab and phone home screen (`lib/brand/icon.ts`, Gloock outlines). Explored on the
  "Verabatch Logo Concepts" canvas (https://claude.ai/artifact/HgPLaFpnnqxGiMHjATmwKF); Leslie passed
  on marks (check, label, stamp, hallmark, plumb bob, equals, wax seal) and other fonts.
- **Product library and product sheets (Leslie, Nov 5): live, every plan.** `/app/library` shows every
  product as a spreadsheet row with a CSV download (`lib/productSheet.ts`). Each product has a
  Product sheet PDF (`lib/productSheetPdf.ts`) in two versions: for buyers (no recipe amounts) and
  internal (recipe with amounts and %, batch history). Later ideas: Excel (.xlsx) download, supplier
  lots on the internal sheet, a product photo on the buyer sheet.

### Nov 6: app address, landing page, competitors

- **Addresses (Leslie, Nov 6):** the app lives at **https://app.verabatch.com** (Vercel; CNAME `app`
  at Bluehost). **verabatch.com** stays at Bluehost and becomes a **WordPress** landing page with the
  waitlist form, built and updated by Leslie (no landing page in this repo). The sign-in email link
  now uses `{{ .SiteURL }}`. Canva: add the app.verabatch.com callback/return URLs beside the old ones.
- **Landing page mockup:** "Verabatch Landing Page" canvas (https://claude.ai/artifact/1bbdWFbiTwJpwF73nrYjyf):
  apothecary look (engraved botanical plate, Libre Baskerville italics, ruled feature list), headline
  "Every recipe. Every batch. Every label.", the five maker types (soapers, formulators, herbalists,
  body care makers, candle makers), waitlist right under the features. No launch date on it.
- **Label font (Leslie, Nov 6):** label text is now **Arimo** (free, shaped and spaced like Helvetica/Arial,
  in Canva's font list) instead of Lato; the product name stays Libre Baskerville. Real Helvetica is paid and
  can't be built into the PDF. Tinos (Times look-alike) was considered for the name but isn't confirmed in Canva.
- **Style guide (Nov 6):** /styleguide lists every font, weight, size, style and color per text style, plus the
  label PDF fonts. Figtree 800 (Extra Bold) now loads; it was used but never loaded.
- **Competitor Review (Nov 6):** https://claude.ai/artifact/6fbxWPM3aUoNJd2JFUtzib. Nobody connects
  recipe, batch and label; tracing to supplier lots is the lead selling point. Leslie agreed with the
  gap list. **Must-haves for February:** Open in Canva for everyone (needs Canva's review: final address,
  live privacy policy and terms, a reviewer login; until then only Leslie's Canva can connect, which is
  why it failed in James's test), a **recipe testing ledger** (a test = a batch marked test, with
  check-ins, ratings by product type, and keep/tweak/drop), and **workshop mode** (phone-sized batch
  screens, weigh list, supplier lot per line, works on spotty Wi-Fi). A native phone app comes after launch.
- **Waitlist email (Leslie, Nov 6): Resend, on hold until Leslie says go.** Plan: the WordPress form
  (Custom HTML block, no plugin) posts to app.verabatch.com/api/waitlist; it saves email + the
  answers (what they make, how many products, where they sell, and "What matters most to you?":
  pick 3 of 10 from the top market wants: cost per product, rules-following labels, batch records and
  lots, recall tracing, stock, recipe tests, wholesale sheets, phone/workshop, Etsy/Shopify, teas and
  spice blends; Leslie, Nov 6) to a locked `waitlist` table (insert
  only, no public read) and adds the contact to a Resend "Waitlist" audience, then sends a welcome
  email. Resend is the only place unsubscribes live and the only place email is sent from; our copy is
  for picking January beta testers and skipping known setup questions later. Free up to 1,000 contacts.
  Before the beta: two-factor sign-in on Supabase, Vercel and Resend, and Supabase Pro for backups.
- **Teams are "The Bench" (Leslie, Nov 6),** as in workbench (she passed on Stillroom: sounds like
  liquor). Pro only. Agreed: owner + 1 helper included, each extra person ~$5-8/mo
  (exact price set with Stripe). Roles: owner (billing, delete, invite) and member (batches, recipes, labels).
  `business_members` already has owner/member; invites, role limits and seat billing are to build.
- **Other brands' names (Nov 6):** `lib/packs/cosmetics/brands.ts` already flags ~50 brands + "dupe" /
  "inspired by" in name and identity (warning only). Agreed for February: an "I understand" sign-off before printing
  when the name or label uses another brand; supplier "type" fragrance oils as recipe lines stay fine.
  Later: check names against registered US trademarks (classes 3 and 4) once data terms are confirmed.
- **Food pack is a February must (Leslie, Nov 6): herbal teas and spice kits.** A second market pack
  beside cosmetics (`lib/packs/food`): common-name ingredients, required major-allergen "Contains"
  statement (9 allergens), Nutrition Facts small-business exemption check, cottage food (home kitchen)
  label wording starting with Indiana, food claim checker (no drug/supplement claims). Culinary
  infused oils are secondary (after launch, with botulism rules); skin oils and bath teas are already
  cosmetics. To make room, **The Bench moves to spring** (Leslie, Nov 6); Pro launches owner-only.
  Leslie (Nov 6): teas, spice blends **and aromatic blends** must be working and tested before launch.
  Aromatic blends (potpourri, sachets, simmer pots, incense blends) are household products, handled like
  candles: safety warnings plus a "not for eating" line. Get a tea/spice maker into the test round.
- **Beta tags (Leslie, Nov 6):** at launch and for every new feature or service, a "Beta" tag so makers
  can use it knowing it's new and being tested. Beta use is also the meter for costs: the app counts how
  often each beta feature is used (first-party counts, no tracking tools) to see demand and running costs
  before pricing it. The Privacy Policy draft now says we count feature use.
- **Google sign-in works (Nov 6).** "Continue with Google" on /login (`signInGoogle` in
  app/login/actions.ts, back through /auth/confirm). Google Cloud project "verabatch" (Leslie's personal
  Google account for now), OAuth client "Verabatch web", redirect = the Supabase callback. Google app is
  in **Testing**: only listed test users can use Google until the privacy and terms pages are live and
  the app is published. Email code and password sign-in work for everyone. The Google screen shows the
  supabase.co address; fix with the auth.verabatch.com custom domain when upgrading to Supabase Pro.
- **Pro price (Leslie, Nov 6; confirmed Nov 7): $19.99/month or $199/year** (2 months free), food pack
  included, plus Free. **No founding-member price** (Leslie, Nov 7: dropped). Makers must be able to
  switch monthly to yearly in the app (Stripe proration: yearly starts at once, unused month credited;
  yearly to monthly starts at renewal). Nets ~$19.11/mo or ~$193/yr after Stripe; ~6-8 subscribers
  cover running costs. Raise prices later for new customers only.
- **Privacy Policy and Terms drafted (Nov 6),** for lawyer review: https://claude.ai/artifact/WBfavU2SYzwuhJMPwcdLHF
  and https://claude.ai/artifact/AdV2TDSvQZqMijWvL8rVAM. To publish at verabatch.com/privacy and /terms
  (WordPress), then link them from the app and submit Canva's review.

### Nov 7: legal pages, billing rules, waitlist

- **Terms and Privacy filled in** with what's known: Madison County, Indiana for disputes; Google sign-in in
  Privacy. Still blank: legal business name (Leslie is forming an LLC first), mailing address (PO box or
  virtual mailbox, never her home), effective date (the day they go live).
- **Billing rules (Leslie, Nov 7), for the Stripe build:** cancelling is by email to hello@verabatch.com (ask
  the lawyer whether some states, e.g. California, need an online cancel button too). Monthly or yearly, Pro
  runs to the end of the paid period, then the account is Free: nothing deleted, everything viewable and
  downloadable, only the first product editable. Yearly partial refunds: open, written as no for now.
  **Yearly renewal reminder emails 30, 15 and 2 days before renewal** (in the Terms; build with Stripe).
- **hello@verabatch.com is a Bluehost mailbox** (Leslie, Nov 7), sending and receiving. Resend's DNS records
  (send.verabatch.com, resend._domainkey) must stay untouched; only one SPF record on the root.
- **Waitlist: built Nov 7.** `app/api/waitlist/route.ts` + `lib/waitlist.ts` (choices, checks) +
  `lib/waitlistEmail.ts` (welcome email) + migration `0015_waitlist.sql` (insert-only table; read it in the
  Supabase Table Editor). Resend: creates a contact (Resend replaced Audiences with global Contacts +
  Segments in Nov 2025; optional `RESEND_WAITLIST_SEGMENT_ID`), then one welcome email from
  hello@verabatch.com; a repeat signup gets no second email. Spam guards: hidden honeypot field and a
  3-second minimum fill time. WordPress form: `docs/waitlist-form.html` (Custom HTML block; a test keeps its
  choices matched to the app). No-JS fallback lands on https://verabatch.com/thank-you/.
  Same day (Leslie): **first and last name required**; **email check** = the domain must be able to receive
  mail (`lib/emailDomain.ts`, MX/address lookup; a slow lookup lets it through) plus a "Did you mean
  gmail.com?" hint for common typos (`EMAIL_TYPOS`); **"Something else" opens a required fill-in**
  (`makes_other`); "Teas, spice and herb blends" wording. Migration 0016_waitlist_names.sql. Names go to
  Resend contacts and the welcome email says "Hi <first name>". The WIP branch's migration is now 0017.

## Next steps (as of Oct 23)

1. Redesign step 3: onboarding, one question per screen (step 2, the recipe screen, is done).
2. Launch must-haves (Master Plan, Phase 2): Open in Canva (Leslie creates a Canva developer
   account), Stripe for Pro, Free limits and the three-strikes rule, terms and privacy (lawyer),
   custom sign-in email (done Nov 5), domain, paid hosting, CosIng refresh (done Nov 5).
3. Leslie's sign-offs: a printed Relief Balm label (2 oz jar wraparound), a real batch with
   supplier lots, the sprays decision (room/linen only or skin too).
4. Parked: printer specs list, invoice reading and costs (WIP branch), recall engine, store sync.

## Working with Leslie

- Direct, casual-business tone. Keep it simple; she wants it "super super simple to deal with."
- She is a marketer and designer, not a developer. Give exact click-by-click steps, never assume
  she knows developer tools, and don't send her through settings mazes. If unsure how a site's
  UI works, ask her for a screenshot rather than guessing.
- She thinks big ("this is a $10M idea") but wants a working product before polish.

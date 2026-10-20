# Verabatch

Recipe in, batch recorded, compliant label out — for small-batch makers.

## What's here

| Folder | What it holds |
| --- | --- |
| `lib/core` | The engine every market shares: unit conversions, recipe math, ingredient order, net contents, lettering size, lot numbers, claims checking, quick-entry parsing. Knows nothing about cosmetics. |
| `lib/packs/cosmetics` | The first market pack: product types, the ingredient dictionary, variety questions (which chamomile?), claim rules and the lettering table. |
| `tests` | `spec.test.ts` holds every test case from the v1 spec; `core.test.ts` covers edge cases. |

Adding a market (baked goods, pet treats...) means adding a folder under `lib/packs`, not changing `lib/core`.

## Rules

- Amounts are stored exactly as typed ("1/2", not 0.5).
- Every number on a label comes from a rule with a test. Change the test first.
- Ingredient and variety names in the cosmetics pack are **drafts** (`source: "draft"`, `checkedOn: null`) until checked against CosIng, and later wINCI.

## Commands

```
npm install
npm test           # run all tests
npm run typecheck  # TypeScript check
```

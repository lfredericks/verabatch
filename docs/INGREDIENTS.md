# Ingredient names

Label names come from `lib/packs/cosmetics` (curated, "draft" until hand-checked) and are
checked against CosIng, the EU's free official ingredient list, by `tests/cosing.test.ts`.

## The CosIng list in this repo

`data/cosing-inci-names.txt`: ~24,000 official INCI names, one per line.

- Source right now: a public copy kept by Open Beauty Facts on GitHub. **It is from Feb 2016.**
  Good enough to catch wrong names; too old to trust for newer ingredients.
- The EU sites can't be reached from Claude's workspace, so a fresh copy needs either:
  1. Leslie downloads the official CosIng export and attaches it, or
  2. the EU domain is added to the workspace's allowed sites (claude.ai settings).
- **Before real makers use the app, replace this file with a fresh official export.**
  Then run `npm test`: the CosIng test lists any name that no longer matches, and flags
  exceptions that are no longer needed.

## Later (Leslie, Oct 22)

- **Automatic updates.** Refresh the official list on a schedule instead of by hand.
- **Flag changed names in makers' recipes.** When an official name changes or is removed,
  find every saved recipe, variation and label that uses it and flag it for the maker
  ("this name changed: review before you print"). Logged batches keep the name they were
  labeled with; only future labels change.

## US vs EU names

US labels use INCI names, the same system CosIng uses, with a few differences:
Water (EU: Aqua), Fragrance (EU: Parfum), "Wax" where the EU says "Cera". US names also
add the common name in brackets, e.g. "Butyrospermum Parkii (Shea) Butter". The official
US dictionary (PCPC's wINCI) is paid; license it once there are paying users.

## Last check (Oct 22, 2026, 2016 CosIng copy)

108 possible label names: 97 match CosIng, 11 explained in the test's exception list
(3 US-only names, 2 missing from the old copy, 6 dried-herb drafts).
Fixed: patchouli (Pogostemon Cablin Leaf Oil), eucalyptus radiata (Leaf/Stem Oil),
spike lavender (Herb Oil, essential oil only).

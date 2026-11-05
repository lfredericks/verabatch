# Ingredient names

Label names come from `lib/packs/cosmetics` (curated, "draft" until hand-checked) and are
checked against CosIng, the EU's free official ingredient list, by `tests/cosing.test.ts`.

## The CosIng list in this repo

`data/cosing-inci-names.txt`: 30,418 official names, one per line.

- **Source (Nov 5, 2026): the EU glossary of common ingredient names, Commission Implementing
  Decision (EU) 2025/1175 of 16 June 2025** (eur-lex.europa.eu/eli/dec_impl/2025/1175/oj), the
  legal list behind CosIng. Copied from the EUR-Lex page's annex table in Leslie's browser.
  Replaced the Feb 2016 Open Beauty Facts copy.
- The CosIng site has no bulk download anymore; to refresh, use the newest glossary decision
  (the EU page "CosIng – Glossary of ingredients" links it), or the CosIng helpdesk.
- It's the EU list. US labels use PCPC's wINCI names (paid): mostly the same, with the
  differences below. License wINCI once there are paying users.

## How names print on US labels (Oct 22)

FDA: cosmetic ingredients are listed by their **common or usual English name**; Latin names
are not accepted as a substitute, but may follow in brackets. FDA's own example:
"Sweet Almond (Prunus Amygdalus Dulcis) Oil" (fda.gov, "Cosmetic Ingredient Names").
FDA has also said the industry dictionary's Latin-first style ("Prunus Amygdalus Dulcis
(Sweet Almond) Oil") doesn't meet that requirement.

So the app stores official (INCI) names and prints them common-first:
"Simmondsia Chinensis (Jojoba) Seed Oil" -> "Jojoba (Simmondsia Chinensis) Seed Oil".
Common names come from the brackets, or from `lib/packs/cosmetics/commonNames.ts` (draft).
A plant with no known common name blocks the label until the maker types an everyday name
on that recipe line. Non-plant names (Water, Tocopherol, Glycerin) print as they are.

## Unknown ingredients and makers' own names (Oct 22)

- An ingredient we don't know shows "Did you mean...?" with official names from the list
  (common plant names like "mugwort" are translated to Latin first: `aliases.ts`).
- A "which one?" question (lavender) also offers "Mine isn't listed".
- Either way the maker can use their own name instead. It prints exactly as typed and is
  flagged on the line and on the label page as not an official ingredient name.

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

## Last check (Nov 5, 2026, 2025 EU glossary)

All label names match the 2025 glossary except the exceptions in `tests/cosing.test.ts`:
Fragrance (EU: Parfum), spike lavender oil (the 2025 glossary lists it as Lavandula Spica
Flower Oil; US name kept), and 5 dried-herb drafts. Fixed: frankincense sacra is
Boswellia Sacra Resin Oil. Water, candelilla wax, Santalum Spicatum Wood Oil and dried
lavandin flowers are now in the list.

## Earlier check (Oct 22, 2026, 2016 CosIng copy)

108 possible label names: 97 match CosIng, 11 explained in the test's exception list
(3 US-only names, 2 missing from the old copy, 6 dried-herb drafts).
Fixed: patchouli (Pogostemon Cablin Leaf Oil), eucalyptus radiata (Leaf/Stem Oil),
spike lavender (Herb Oil, essential oil only).

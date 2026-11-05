import { describe, expect, it } from "vitest";
import { computeRecipe, type RecipeLine } from "../lib/core";
import { claimsFor, cleanClaims, NO_CLAIMS, organicFacts, type ProductClaims } from "../lib/frontClaims";
import { buildLabel } from "../lib/label";
import { activePack } from "../lib/packs";

const pack = activePack();
const L = (amount: string, unit: RecipeLine["unit"], text: string, extra: Partial<RecipeLine> = {}): RecipeLine => ({ amount, unit, text, ...extra });
const ctx = { productName: "Garden Balm", identity: "Botanical Skin Balm" };
const withOrganic = (o: Partial<ProductClaims["organic"]>, keys: string[] = []): ProductClaims => ({ keys, organic: { ...NO_CLAIMS.organic, ...o } });

describe("organic share", () => {
  it("counts by weight and leaves water and salt out", () => {
    const r = computeRecipe(
      [L("70", "g", "shea butter", { organic: true, key: "a" }), L("30", "g", "jojoba oil", { key: "b" }), L("100", "g", "distilled water", { key: "c" })],
      pack,
    );
    const f = organicFacts(r);
    expect(f.pct).toBe(70);
    expect(f.tier).toBe("madeWith");
  });
  it("rounds down so 94.9% is not organic", () => {
    const r = computeRecipe([L("94.9", "g", "shea butter", { organic: true }), L("5.1", "g", "jojoba oil")], pack);
    expect(organicFacts(r).tier).toBe("madeWith");
  });
});

describe("front claims", () => {
  const recipe95 = computeRecipe([L("96", "g", "shea butter", { organic: true, key: "a" }), L("4", "g", "jojoba oil", { key: "b" })], pack);
  const recipe70 = computeRecipe([L("75", "g", "shea butter", { organic: true, key: "a" }), L("25", "g", "jojoba oil", { key: "b" })], pack);

  it("needs certification or the $5,000 exemption", () => {
    const r = claimsFor(withOrganic({ status: "no", front: true }), recipe95, pack, ctx);
    expect(r.front).toEqual([]);
    expect(r.notes.some((n) => n.level === "stop")).toBe(true);
  });
  it("95% and certified: Organic, with the certifier on the back", () => {
    const r = claimsFor(withOrganic({ status: "certified", certifier: "Indiana Certified Organic", front: true }), recipe95, pack, ctx);
    expect(r.front).toEqual(["Organic"]);
    expect(r.back).toEqual(["Certified organic by Indiana Certified Organic."]);
  });
  it("70%: Made with organic, naming the picked ingredients", () => {
    const r = claimsFor(withOrganic({ status: "exempt", front: true, madeWith: ["a"] }), recipe70, pack, ctx);
    expect(r.front).toEqual(["Made with organic shea butter"]);
  });
  it("organic in the name without qualifying blocks printing", () => {
    const label = buildLabel({
      product: { name: "Organic Garden Balm", type_key: "salve", identity: "Botanical Skin Balm", makes: 5, recipe: [L("1", "oz", "shea butter")] },
      business: { name: "Shop", cityStateZip: "Anderson, IN 46011", contact: "shop.com" },
      size: null,
      pack,
    });
    expect(label.blockers.some((b) => b.includes("Organic\" is in the product name"))).toBe(true);
  });
  it("vegan stops on beeswax; fragrance-free and pet safe stop on essential oils", () => {
    const r = computeRecipe([L("1", "oz", "beeswax"), L("10", "drop", "lavender essential oil")], pack);
    const out = claimsFor({ keys: ["vegan", "fragrance-free", "pet-safe", "handmade"], organic: NO_CLAIMS.organic }, r, pack, ctx);
    expect(out.front).toEqual(["Handmade"]);
    expect(out.notes.filter((n) => n.level === "stop").map((n) => n.key).sort()).toEqual(["fragrance-free", "pet-safe", "vegan"]);
  });
  it("organic ingredients print as Organic ... in the ingredient list", () => {
    const label = buildLabel({
      product: { name: "Garden Balm", type_key: "salve", identity: "Botanical Skin Balm", makes: 5, recipe: [L("1", "oz", "shea butter", { organic: true }), L("1", "oz", "jojoba oil")] },
      business: { name: "Shop", cityStateZip: "Anderson, IN 46011", contact: "shop.com" },
      size: null,
      pack,
    });
    expect(label.ingredients).toMatch(/Organic Shea/);
    expect(label.ingredients).not.toMatch(/Organic Jojoba/);
  });
  it("cleaning drops unknown keys and caps made-with at three", () => {
    const c = cleanClaims({ keys: ["vegan", "nope"], organic: { status: "weird", madeWith: ["a", "b", "c", "d"], front: "yes" } }, pack);
    expect(c.keys).toEqual(["vegan"]);
    expect(c.organic.status).toBe("no");
    expect(c.organic.madeWith).toHaveLength(3);
    expect(c.organic.front).toBe(false);
  });
});

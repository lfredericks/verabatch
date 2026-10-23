import { describe, expect, it } from "vitest";
import { parseQuickEntry } from "../lib/core";
import { buildLabel } from "../lib/label";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { cleanWarnings, suggestedWarnings, warningLines } from "../lib/warnings";

describe("warnings", () => {
  it("joins common cautions after Caution:", () => {
    expect(warningLines({ keys: ["eyes", "external"], custom: ["Store below 80°F"] }, cosmeticsPack)).toEqual([
      "Caution: For external use only. Avoid contact with eyes. Store below 80°F.",
    ]);
  });
  it("prints required FDA wording on its own, and doesn't repeat 'keep out of reach'", () => {
    const lines = warningLines({ keys: ["children", "bubble-bath", "slippery"], custom: [] }, cosmeticsPack);
    expect(lines[0]).toMatch(/^Caution: Use only as directed\. Excessive use/);
    expect(lines[1]).toBe("Caution: Keep away from pets. Tub and floor may be slippery after use.");
  });
  it("keeps children and pets together", () => {
    expect(warningLines({ keys: ["external", "children"], custom: [] }, cosmeticsPack)).toEqual([
      "Caution: For external use only. Keep out of reach of children and pets.",
    ]);
  });
  it("drops unknown keys and trims the maker's own", () => {
    expect(cleanWarnings({ keys: ["eyes", "nope", "eyes"], custom: ["  Keep   dry ", "", 4] }, cosmeticsPack)).toEqual({
      keys: ["eyes"],
      custom: ["Keep dry"],
    });
    expect(cleanWarnings(null, cosmeticsPack)).toEqual({ keys: [], custom: [] });
  });
  it("suggests candle safety for candles", () => {
    expect(suggestedWarnings("candle", cosmeticsPack)).toEqual(expect.arrayContaining(["candle-sight", "candle-away", "candle-wick"]));
  });
  it("go on the back between ingredients and the made-by line", () => {
    const label = buildLabel({
      product: {
        name: "Garden Balm", type_key: "salve", identity: "Botanical Skin Balm", makes: 5,
        recipe: parseQuickEntry("1/2 cup jojoba oil, 1/4 cup white beeswax pearls").lines,
        warnings: { keys: ["external"], custom: [] },
      },
      business: { name: "Hollow Pine", cityStateZip: "Bend, OR 97701", contact: "hollowpine.example" },
      size: null, pack: cosmeticsPack,
    });
    expect(label.back[1]).toBe("Caution: For external use only.");
    expect(label.back[2]).toMatch(/^Made by Hollow Pine/);
    expect(label.warnings).toEqual(["Caution: For external use only."]);
  });
});

/**
 * Common containers small-batch makers use, with the label sizes that fit them.
 *
 * Every measurement here comes from a supplier's own product page (listed in `source`),
 * collected Oct 23, 2026. The same name ("2 oz jar") covers very different shapes between
 * suppliers, so these are starting points: makers should still measure their own.
 *
 * What a supplier gives:
 *  - side: the flat-sided band a label can go on (label panel height, and how far it goes
 *    around). Some suppliers list the panel; others list a "max labeling area".
 *  - lid: the widest round label that sits flat on the lid or top.
 *  - label: a supplier's own recommended label, for odd shapes like lip balm tubes.
 * The label sizes makers pick from are worked out from those in `labelOptions()`.
 */
import { LABEL_TEMPLATES, type LabelTemplate } from "./labelTemplates";

export type ContainerGroup = "Jars" | "Tins" | "Bottles" | "Droppers" | "Tubes" | "Candles";

export interface Container {
  key: string;
  group: ContainerGroup;
  /** As makers say it: "4 oz straight-sided glass jar". */
  name: string;
  /** What it holds, as the supplier lists it ("4 fl oz"). Not the net weight on the label. */
  holds: string;
  diameterIn?: number;
  heightIn: number;
  /** Flat band for side labels: its height, and how far a label can go around. */
  side?: { heightIn: number; aroundIn: number; isMax?: boolean };
  /** Widest round label for the lid or top, when the supplier gives one or the lid is flat. */
  lidIn?: number;
  /** A supplier's recommended label, for shapes where front/back math doesn't apply. */
  label?: { widthIn: number; heightIn: number };
  note?: string;
  source: { name: string; url: string };
}

const C = (d: number) => Math.round(Math.PI * d * 100) / 100;

export const CONTAINERS: Container[] = [
  // ---- Jars ----
  {
    key: "jar-2oz-thick", group: "Jars", name: "2 oz straight-sided glass jar (thick wall, 53 mm lid)", holds: "2 fl oz",
    diameterIn: 2.13, heightIn: 2, side: { heightIn: 1, aroundIn: 6.75 },
    note: "Very short label band. A lid label is usually the front.",
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/amber-2-ounce-straight-sided-glass-jar-case-24.html" },
  },
  {
    key: "jar-2oz-thin", group: "Jars", name: "2 oz straight-sided glass jar (thin wall)", holds: "2 fl oz",
    diameterIn: 1.97, heightIn: 1.77, side: { heightIn: 1.57, aroundIn: 6.5 },
    source: { name: "Windy Point Soap", url: "https://windypointsoap.com/collections/packaging/products/clear-glass-jar-2oz" },
  },
  {
    key: "jar-2oz-double", group: "Jars", name: "2 oz double-wall cosmetic jar", holds: "2 fl oz",
    diameterIn: 2.32, heightIn: 1.93, side: { heightIn: 1.18, aroundIn: 6.81 },
    source: { name: "Windy Point Soap", url: "https://www.windypointsoap.com/products/double-wall-white-straight-sided-jar-2oz" },
  },
  {
    key: "jar-4oz", group: "Jars", name: "4 oz straight-sided glass jar", holds: "4 fl oz",
    diameterIn: 2.44, heightIn: 2.69, side: { heightIn: 1.94, aroundIn: 7.5 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/r04-30c-case24ct-1-12oz.html" },
  },
  {
    key: "jar-6oz", group: "Jars", name: "6 oz straight-sided glass jar", holds: "6 fl oz",
    diameterIn: 2.56, heightIn: 3.19, side: { heightIn: 2.25, aroundIn: 8.25 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/6-oz-amber-straight-sided-jar-case-of-12.html" },
  },
  {
    key: "jar-9oz", group: "Jars", name: "9 oz straight-sided glass jar", holds: "9 fl oz",
    diameterIn: 2.86, heightIn: 3.5, side: { heightIn: 2.25, aroundIn: 9 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/9-oz-amber-straight-sided-jar.html" },
  },
  {
    key: "jar-16oz", group: "Jars", name: "16 oz straight-sided glass jar", holds: "16 fl oz",
    diameterIn: 3.56, heightIn: 3.81, side: { heightIn: 2.5, aroundIn: 11.31 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/16-oz-amber-straight-sided-glass-jar.html" },
  },
  {
    key: "pet-jar-4oz", group: "Jars", name: "4 oz low plastic (PET) jar", holds: "4 fl oz",
    diameterIn: 2.75, heightIn: 1.75, side: { heightIn: 0.88, aroundIn: 9.13, isMax: true }, lidIn: 2.63,
    note: "Side band is under an inch. Use a lid label for the front.",
    source: { name: "CandleScience", url: "https://www.candlescience.com/cosmetic-packaging/4-oz-clear-pet-jar-with-matte-black-lid/" },
  },
  {
    key: "pet-jar-8oz", group: "Jars", name: "8 oz plastic (PET) jar", holds: "8 fl oz",
    diameterIn: 2.75, heightIn: 2.88, side: { heightIn: 2, aroundIn: 9.13, isMax: true }, lidIn: 2.63,
    source: { name: "CandleScience", url: "https://www.candlescience.com/cosmetic-packaging/8-oz-clear-pet-jar-with-matte-black-lid/" },
  },
  {
    key: "mason-8oz", group: "Jars", name: "8 oz (half pint) mason or jelly jar", holds: "8 fl oz",
    diameterIn: 2.64, heightIn: 3.88, side: { heightIn: 2.5, aroundIn: 8.63 },
    note: "Embossed jars only have a small smooth patch; measure it.",
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/r08-12c-case12ct-1-12oz.html" },
  },

  // ---- Tins ----
  {
    key: "tin-0.5oz", group: "Tins", name: "1/2 oz shallow screw-top tin", holds: "1/2 oz",
    diameterIn: 1.5, heightIn: 0.63, lidIn: 1.38,
    source: { name: "CandleScience", url: "https://www.candlescience.com/cosmetic-packaging/05-oz-flat-tin-with-screw-top-lid/" },
  },
  {
    key: "tin-1oz", group: "Tins", name: "1 oz shallow screw-top tin", holds: "1 oz",
    diameterIn: 1.94, heightIn: 0.69, lidIn: 1.63,
    source: { name: "CandleScience", url: "https://candlescience.com/cosmetic-packaging/1-oz-flat-tin-with-screw-top-lid" },
  },
  {
    key: "tin-2oz", group: "Tins", name: "2 oz shallow screw-top tin", holds: "2 oz",
    diameterIn: 2.5, heightIn: 0.875,
    source: { name: "Uline", url: "https://www.uline.com/BL_2896/Screw-Top-Metal-Tins" },
  },
  {
    key: "tin-4oz", group: "Tins", name: "4 oz shallow screw-top tin", holds: "4 oz",
    diameterIn: 3.125, heightIn: 1.125,
    source: { name: "Uline", url: "https://www.uline.com/BL_2896/Screw-Top-Metal-Tins" },
  },
  {
    key: "tin-2oz-deep", group: "Tins", name: "2 oz deep screw-top tin", holds: "2 oz",
    diameterIn: 2, heightIn: 1.5,
    source: { name: "Uline", url: "https://www.uline.com/BL_2896/Screw-Top-Metal-Tins" },
  },
  {
    key: "tin-4oz-deep", group: "Tins", name: "4 oz deep screw-top tin", holds: "4 oz",
    diameterIn: 2.5, heightIn: 1.75,
    source: { name: "Uline", url: "https://www.uline.com/BL_2896/Screw-Top-Metal-Tins" },
  },
  {
    key: "tin-8oz-deep", group: "Tins", name: "8 oz deep screw-top tin", holds: "8 oz",
    diameterIn: 3.125, heightIn: 2,
    source: { name: "Uline", url: "https://www.uline.com/BL_2896/Screw-Top-Metal-Tins" },
  },

  // ---- Bottles ----
  {
    key: "boston-1oz", group: "Bottles", name: "1 oz Boston round bottle", holds: "1 fl oz",
    diameterIn: 1.19, heightIn: 3.19, side: { heightIn: 1.75, aroundIn: 3.75 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/1-oz-amber-boston-round-20mm.html" },
  },
  {
    key: "boston-2oz", group: "Bottles", name: "2 oz Boston round bottle", holds: "2 fl oz",
    diameterIn: 1.54, heightIn: 3.69, side: { heightIn: 1.89, aroundIn: 4.85 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/2-oz-amber-boston-round-20400.html" },
  },
  {
    key: "boston-4oz", group: "Bottles", name: "4 oz Boston round bottle (spray or dropper)", holds: "4 fl oz",
    diameterIn: 1.75, heightIn: 4.56, side: { heightIn: 2.75, aroundIn: 6 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/amber-glass-dropper-bottles-wholesale-4-oz-boston-round.html" },
  },
  {
    key: "boston-8oz", group: "Bottles", name: "8 oz Boston round bottle", holds: "8 fl oz",
    diameterIn: 2.25, heightIn: 5.69, side: { heightIn: 3.44, aroundIn: 7.5 },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/c08-24c-case12ct-1-12oz.html" },
  },
  {
    key: "boston-16oz", group: "Bottles", name: "16 oz Boston round bottle", holds: "16 fl oz",
    diameterIn: 3, heightIn: 6.7, side: { heightIn: 3.92, aroundIn: C(3) },
    source: { name: "Fillmore Container", url: "https://www.fillmorecontainer.com/16-oz-amber-boston-round-28-400-finish.html" },
  },
  {
    key: "pet-boston-8oz", group: "Bottles", name: "8 oz plastic (PET) Boston round bottle", holds: "8 fl oz",
    diameterIn: 2.36, heightIn: 4.92, side: { heightIn: 2.73, aroundIn: 7.06 },
    source: { name: "Windy Point Soap", url: "https://www.windypointsoap.com/collections/packaging/products/boston-round-black-pet-bottle-8oz" },
  },
  {
    key: "cosmo-8oz", group: "Bottles", name: "8 oz plastic cosmo round (lotion or pump) bottle", holds: "8 fl oz",
    diameterIn: 1.85, heightIn: 6.85, side: { heightIn: 4.66, aroundIn: 5.59 },
    source: { name: "Windy Point Soap", url: "https://www.windypointsoap.com/products/cosmo-round-black-pet-bottle-8oz" },
  },

  // ---- Droppers ----
  {
    key: "euro-5ml", group: "Droppers", name: "5 mL euro dropper bottle", holds: "5 mL",
    diameterIn: 0.87, heightIn: 2.17, side: { heightIn: 0.95, aroundIn: 2.51 },
    source: { name: "SKS Bottle & Packaging", url: "https://www.sks-bottle.com/product/295.html" },
  },
  {
    key: "euro-10ml", group: "Droppers", name: "10 mL euro dropper bottle", holds: "10 mL",
    diameterIn: 0.94, heightIn: 2.64, side: { heightIn: 1.48, aroundIn: 2.73 },
    source: { name: "SKS Bottle & Packaging", url: "https://www.sks-bottle.com/product/296.html" },
  },
  {
    key: "euro-15ml", group: "Droppers", name: "15 mL euro dropper bottle", holds: "15 mL",
    diameterIn: 1.1, heightIn: 2.6, side: { heightIn: 1.4, aroundIn: 3.2 },
    source: { name: "SKS Bottle & Packaging", url: "https://www.sks-bottle.com/product/297.html" },
  },
  {
    key: "euro-30ml", group: "Droppers", name: "30 mL (1 oz) euro dropper bottle", holds: "30 mL",
    diameterIn: 1.22, heightIn: 3.54, side: { heightIn: 1.93, aroundIn: C(1.22) },
    source: { name: "SKS Bottle & Packaging", url: "https://www.sks-bottle.com/product/298.html" },
  },

  // ---- Tubes ----
  {
    key: "lip-tube", group: "Tubes", name: "Lip balm tube (0.15 oz)", holds: "0.15 oz",
    heightIn: 2.625, label: { widthIn: 1.75, heightIn: 1.5 },
    note: "Wraps around the tube. Supplier suggests 1.6 × 1.8 in; 1.75 × 1.5 in leaves room for the cap.",
    source: { name: "Wholesale Supplies Plus", url: "https://www.wholesalesuppliesplus.com/products/0.15-oz-lip-tube-cap-natural-oval.aspx" },
  },

  // ---- Candles ----
  {
    key: "candle-tin-4oz", group: "Candles", name: "4 oz candle tin", holds: "4 oz",
    diameterIn: 2.56, heightIn: 1.75, side: { heightIn: 1, aroundIn: 8.13, isMax: true },
    source: { name: "CandleScience", url: "https://candlescience.com/containers/4oz-candle-tin" },
  },
  {
    key: "candle-tin-8oz", group: "Candles", name: "8 oz candle tin", holds: "8 oz",
    diameterIn: 3.07, heightIn: 2, side: { heightIn: 1.25, aroundIn: 10, isMax: true },
    source: { name: "CandleScience", url: "https://candlescience.com/containers/8oz-candle-tin" },
  },
  {
    key: "candle-jelly-8oz", group: "Candles", name: "8 oz straight-sided jelly jar (candle)", holds: "8 fl oz",
    diameterIn: 2.6, heightIn: 3.56, side: { heightIn: 2, aroundIn: 8.25, isMax: true },
    source: { name: "CandleScience", url: "https://candlescience.com/containers/8oz-straight-sided-jelly-jar" },
  },
];

export function findContainer(key: string): Container | undefined {
  return CONTAINERS.find((c) => c.key === key);
}

export type Placement = "front-back" | "wrap" | "lid" | "label";

export interface LabelOption {
  placement: Placement;
  shape: "rect" | "round";
  widthIn: number;
  heightIn: number;
  /** "Front and back: 3 × 1.75 in" */
  text: string;
  /** Avery sheets from our list that fit this spot (largest first), turned sideways if needed. */
  avery: LabelTemplate[];
}

/** Round down to the nearest 1/8 in. */
const eighth = (n: number) => Math.floor(n * 8 + 1e-6) / 8;
/** Clearance so a label doesn't run into the shoulder or base. */
const EDGE = 0.125;
/** A flat label reads well across about 40% of the way around a round container. */
const FACE_SHARE = 0.4;
/** Gap left where a wrap label's ends meet. */
const WRAP_GAP = 0.25;

const inch = (n: number) => String(Number(n.toFixed(3)));
const size = (w: number, h: number) => `${inch(w)} × ${inch(h)} in`;

/**
 * Avery sheets that fit a spot w × h and fill at least half of it, biggest first (a tiny
 * label technically fits anywhere but looks lost). A rectangle or oval may turn sideways;
 * a round label must fit the short side.
 */
export function averyThatFit(shape: "rect" | "round", w: number, h: number): LabelTemplate[] {
  const area = (t: LabelTemplate) => (t.shape === "rect" ? t.widthIn * t.heightIn : (Math.PI / 4) * t.widthIn * t.heightIn);
  const spot = shape === "round" ? (Math.PI / 4) * w * h : w * h;
  const fits = LABEL_TEMPLATES.filter((t) => {
    if (area(t) < spot * 0.5) return false;
    if (shape === "round") return t.shape === "round" && t.widthIn <= Math.min(w, h) + 0.01;
    if (t.shape === "round") return false;
    const ok = (a: number, b: number) => a <= w + 0.01 && b <= h + 0.01;
    return ok(t.widthIn, t.heightIn) || ok(t.heightIn, t.widthIn);
  });
  return fits.sort((a, b) => area(b) - area(a)).slice(0, 3);
}

/**
 * The label sizes that fit a container: a matching front and back pair, one label wrapped
 * all the way around, and a round lid label. Each is the largest size, rounded down to 1/8 in.
 */
export function labelOptions(c: Container): LabelOption[] {
  const out: LabelOption[] = [];
  if (c.label) {
    const { widthIn: w, heightIn: h } = c.label;
    out.push({ placement: "label", shape: "rect", widthIn: w, heightIn: h, text: `Wrap-around label: ${size(w, h)}`, avery: averyThatFit("rect", w, h) });
  }
  if (c.side) {
    // A "max labeling area" is already the label; a label panel needs a little clearance.
    const h = eighth(c.side.isMax ? c.side.heightIn : c.side.heightIn - EDGE);
    const face = eighth(c.side.aroundIn * FACE_SHARE);
    const wrap = eighth(c.side.aroundIn - WRAP_GAP);
    if (h >= 0.5 && face >= 0.75) {
      out.push({ placement: "front-back", shape: "rect", widthIn: face, heightIn: h, text: `Front and back: ${size(face, h)} each`, avery: averyThatFit("rect", face, h) });
    }
    if (h >= 0.5) {
      out.push({ placement: "wrap", shape: "rect", widthIn: wrap, heightIn: h, text: `One wrap-around label: ${size(wrap, h)}`, avery: averyThatFit("rect", wrap, h) });
    }
  }
  const lid = c.lidIn ?? (c.group === "Tins" && c.diameterIn ? c.diameterIn - 0.25 : undefined);
  if (lid) {
    const d = eighth(lid);
    out.push({ placement: "lid", shape: "round", widthIn: d, heightIn: d, text: `Lid: ${inch(d)} in round`, avery: averyThatFit("round", d, d) });
  }
  return out;
}

/**
 * Room for labels around the sides, in sq in (lids and bottoms not counted, the cautious
 * reading). Under 12 sq in, FDA allows ingredient letters of 1/32 in instead of 1/16 in
 * (21 CFR 701.3(b)). For tins with no side band listed, the whole side wall.
 */
export function labelRoomSqIn(c: Container): number {
  const side = c.side
    ? c.side.heightIn * c.side.aroundIn
    : c.label
      ? c.label.widthIn * c.label.heightIn
      : c.diameterIn
        ? Math.PI * c.diameterIn * c.heightIn
        : 0;
  return Math.round(side * 10) / 10;
}

export const CONTAINER_GROUPS: ContainerGroup[] = ["Jars", "Tins", "Bottles", "Droppers", "Tubes", "Candles"];

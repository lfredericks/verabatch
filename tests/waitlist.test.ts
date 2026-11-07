import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cleanWaitlist,
  safeReturnUrl,
  WAITLIST_COUNTS,
  WAITLIST_MAKES,
  WAITLIST_SELLS,
  WAITLIST_WANTS,
} from "../lib/waitlist";
import { waitlistWelcomeEmail } from "../lib/waitlistEmail";

const now = 1_800_000_000_000;

describe("waitlist form", () => {
  it("cleans a normal signup", () => {
    const r = cleanWaitlist(
      {
        email: "  Maker@Example.COM ",
        makes: ["Soap", "Not a real choice", "Soap"],
        product_count: "6-15",
        sells: "Etsy",
        wants: [...WAITLIST_WANTS.slice(0, 5)],
        source: "landing",
        started: String(now - 30_000),
      },
      now,
    );
    expect(r).toEqual({
      ok: true,
      entry: {
        email: "maker@example.com",
        makes: ["Soap"],
        product_count: "6-15",
        sells: ["Etsy"],
        wants: WAITLIST_WANTS.slice(0, 3),
        source: "landing",
      },
    });
  });

  it("asks for a real email", () => {
    expect(cleanWaitlist({ email: "nope" }, now)).toMatchObject({ ok: false, bot: false });
    expect(cleanWaitlist({}, now)).toMatchObject({ ok: false, bot: false });
  });

  it("quietly drops bots: honeypot filled or submitted too fast", () => {
    expect(cleanWaitlist({ email: "a@b.co", website: "spam.biz" }, now)).toEqual({ ok: false, bot: true });
    expect(cleanWaitlist({ email: "a@b.co", started: String(now - 500) }, now)).toEqual({ ok: false, bot: true });
  });

  it("ignores an unknown product count", () => {
    const r = cleanWaitlist({ email: "a@b.co", product_count: "a million" }, now);
    expect(r.ok && r.entry.product_count).toBe(null);
  });

  it("only sends people back to the website", () => {
    expect(safeReturnUrl("https://verabatch.com/thank-you/", "x")).toBe("https://verabatch.com/thank-you/");
    expect(safeReturnUrl("https://evil.example/", "x")).toBe("x");
    expect(safeReturnUrl("http://verabatch.com/", "x")).toBe("x");
  });

  it("the WordPress form offers exactly the app's choices", () => {
    const html = readFileSync("docs/waitlist-form.html", "utf8");
    const values = (name: string) =>
      [...html.matchAll(new RegExp(`name="${name}" value="([^"]+)"`, "g"))].map((m) => m[1].replaceAll("&#39;", "'"));
    const options = [...html.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);
    expect(values("makes")).toEqual([...WAITLIST_MAKES]);
    expect(values("sells")).toEqual([...WAITLIST_SELLS]);
    expect(values("wants")).toEqual([...WAITLIST_WANTS]);
    expect(options).toEqual([...WAITLIST_COUNTS]);
  });

  it("welcome email makes no compliance promise and has no date", () => {
    const m = waitlistWelcomeEmail();
    expect(m.text).not.toMatch(/compliant|guarantee|FDA|2027|February|January/i);
    expect(m.html).toContain("Not you?");
  });
});

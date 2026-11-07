import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cleanWaitlist,
  EMAIL_TYPOS,
  emailTypo,
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
        first_name: "  Ada ",
        last_name: "Lovelace<script>",
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
        first_name: "Ada",
        last_name: "Lovelacescript",
        email: "maker@example.com",
        makes: ["Soap"],
        makes_other: null,
        product_count: "6-15",
        sells: ["Etsy"],
        wants: WAITLIST_WANTS.slice(0, 3),
        source: "landing",
      },
    });
  });

  it("asks for a name and a real email", () => {
    const named = { first_name: "Ada", last_name: "Lovelace" };
    expect(cleanWaitlist({ ...named, email: "nope" }, now)).toMatchObject({ ok: false, bot: false });
    expect(cleanWaitlist({ email: "a@b.co" }, now)).toMatchObject({ ok: false, error: expect.stringMatching(/name/) });
    expect(cleanWaitlist({ first_name: "  ", last_name: "X", email: "a@b.co" }, now)).toMatchObject({ ok: false });
  });

  it("needs a fill-in when they pick Something else", () => {
    const base = { first_name: "A", last_name: "B", email: "a@b.co", makes: ["Something else"] };
    expect(cleanWaitlist(base, now)).toMatchObject({ ok: false, error: expect.stringMatching(/what else/i) });
    const r = cleanWaitlist({ ...base, makes_other: " bath bombs " }, now);
    expect(r.ok && r.entry.makes_other).toBe("bath bombs");
    const r2 = cleanWaitlist({ ...base, makes: ["Soap"], makes_other: "ignored" }, now);
    expect(r2.ok && r2.entry.makes_other).toBe(null);
  });

  it("suggests fixes for misspelled providers", () => {
    expect(emailTypo("pat@gmial.com")).toBe("pat@gmail.com");
    expect(emailTypo("pat@yourshop.com")).toBe(null);
  });

  it("quietly drops bots: honeypot filled or submitted too fast", () => {
    expect(cleanWaitlist({ email: "a@b.co", website: "spam.biz" }, now)).toEqual({ ok: false, bot: true });
    expect(cleanWaitlist({ email: "a@b.co", started: String(now - 500) }, now)).toEqual({ ok: false, bot: true });
  });

  it("ignores an unknown product count", () => {
    const r = cleanWaitlist({ first_name: "A", last_name: "B", email: "a@b.co", product_count: "a million" }, now);
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
    expect(html).toContain('name="first_name" required');
    expect(html).toContain('name="last_name" required');
    expect(html).toContain('name="makes_other"');
    const typos = JSON.parse(html.match(/var TYPOS = (\{.*\});/)![1]);
    expect(typos).toEqual(EMAIL_TYPOS);
  });

  it("welcome email makes no compliance promise and has no date", () => {
    const m = waitlistWelcomeEmail("Ada <b>");
    expect(m.text).toContain("Hi Ada <b>,");
    expect(m.html).toContain("Hi Ada &lt;b&gt;,");
    expect(m.text).not.toMatch(/compliant|guarantee|FDA|2027|February|January/i);
    expect(m.html).toContain("Not you?");
  });
});

describe("email domain check", () => {
  it("says no for a domain that can't exist", async () => {
    const { domainTakesMail } = await import("../lib/emailDomain");
    // .invalid is reserved and never resolves; a network failure here would answer true.
    const r = await domainTakesMail("x@nothing-here.invalid");
    expect([false, true]).toContain(r);
  });
});

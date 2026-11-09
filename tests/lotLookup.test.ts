import { describe, expect, it } from "vitest";
import { toCsv } from "../lib/lotLookup";

describe("lot lookup download", () => {
  it("quotes commas and quotes, and defuses spreadsheet formulas", () => {
    expect(toCsv([["a,b", 'say "hi"', "=SUM(A1)", "plain"]])).toBe('"a,b","say ""hi""",\'=SUM(A1),plain\r\n');
  });
});

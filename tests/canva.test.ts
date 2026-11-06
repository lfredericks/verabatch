import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { authorizeUrl, CANVA_SCOPES, importPdfWithRetry, newSignIn, withReturn } from "../lib/canva";

describe("Open in Canva", () => {
  it("builds Canva's sign-in link with PKCE (S256) and every scope", () => {
    process.env.CANVA_CLIENT_ID = "OC-test";
    const { verifier, challenge, state } = newSignIn();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(challenge).toBe(createHash("sha256").update(verifier).digest("base64url"));
    const u = new URL(authorizeUrl(challenge, state, "https://example.test/api/canva/callback"));
    expect(u.origin + u.pathname).toBe("https://www.canva.com/api/oauth/authorize");
    expect(u.searchParams.get("code_challenge_method")).toBe("s256");
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("client_id")).toBe("OC-test");
    expect(u.searchParams.get("scope")).toBe(CANVA_SCOPES.join(" "));
    expect(u.toString()).not.toContain("+");
    expect(CANVA_SCOPES).toContain("design:content:write");
  });

  it("tags the edit link so Canva's Return button comes back to the product", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const out = new URL(withReturn("https://www.canva.com/api/design/abc/edit", id));
    expect(out.searchParams.get("correlation_state")).toBe(id);
  });

  it("waits out a 'not found yet' on the new import and still opens the design", async () => {
    const answers = [
      new Response(JSON.stringify({ job: { id: "j1", status: "in_progress" } }), { status: 200 }),
      new Response("", { status: 404 }),
      new Response(JSON.stringify({ job: { id: "j1", status: "success", result: { designs: [{ urls: { edit_url: "https://www.canva.com/design/x/edit" } }] } } }), { status: 200 }),
    ];
    const fake = (async () => answers.shift()!) as unknown as typeof fetch;
    expect(await importPdfWithRetry("t", new Uint8Array([1]), "Label", fake)).toBe("https://www.canva.com/design/x/edit");
  });

  it("tries a failed import a second time on its own", async () => {
    const answers = [
      new Response("", { status: 500 }),
      new Response(JSON.stringify({ job: { id: "j2", status: "success", result: { designs: [{ urls: { edit_url: "https://www.canva.com/design/y/edit" } }] } } }), { status: 200 }),
    ];
    const fake = (async () => answers.shift()!) as unknown as typeof fetch;
    expect(await importPdfWithRetry("t", new Uint8Array([1]), "Label", fake)).toBe("https://www.canva.com/design/y/edit");
  });
});

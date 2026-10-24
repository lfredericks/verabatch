import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "Open in Canva" through Canva's Connect API (https://www.canva.dev/docs/connect/).
 * Server only: uses the client secret. Keys come from Vercel: CANVA_CLIENT_ID, CANVA_CLIENT_SECRET.
 *
 * Flow: the maker connects their Canva once (OAuth with PKCE). "Open in Canva" uploads the
 * label PDF as a design import, waits for it, then sends the maker to the design's edit link,
 * tagged with the product so Canva's Return button comes back to the label page.
 */

export const CANVA_SCOPES = ["design:content:read", "design:content:write", "design:meta:read", "asset:read", "asset:write"];
const API = "https://api.canva.com/rest/v1";

export function canvaConfigured(): boolean {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

function basicAuth(): string {
  return `Basic ${Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64")}`;
}

/** A PKCE pair and a state value for one sign-in. */
export function newSignIn() {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(24).toString("base64url");
  return { verifier, challenge, state };
}

export function authorizeUrl(challenge: string, state: string, redirectUri: string): string {
  const q = new URLSearchParams({
    code_challenge: challenge,
    code_challenge_method: "s256",
    scope: CANVA_SCOPES.join(" "),
    response_type: "code",
    client_id: process.env.CANVA_CLIENT_ID ?? "",
    state,
    redirect_uri: redirectUri,
  });
  return `https://www.canva.com/api/oauth/authorize?${q.toString().replace(/\+/g, "%20")}`;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function tokenRequest(body: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`Canva sign-in failed (${res.status})`);
  return (await res.json()) as Tokens;
}

export async function exchangeCode(code: string, verifier: string, redirectUri: string) {
  return tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri });
}

async function save(supabase: SupabaseClient, userId: string, t: Tokens) {
  const { error } = await supabase.from("canva_connections").upsert({
    user_id: userId,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Couldn't save the Canva connection.");
}

export async function saveTokens(supabase: SupabaseClient, userId: string, t: Tokens) {
  await save(supabase, userId, t);
}

/**
 * A working access token for this person, refreshing it if it's about to run out.
 * null = not connected (or the connection was revoked): send them to connect.
 */
export async function accessToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("canva_connections").select("access_token, refresh_token, expires_at").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() - Date.now() > 120_000) return data.access_token as string;
  try {
    // Each refresh token works once; Canva hands back a new one every time.
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: data.refresh_token as string });
    await save(supabase, userId, t);
    return t.access_token;
  } catch {
    await supabase.from("canva_connections").delete().eq("user_id", userId);
    return null;
  }
}

export class CanvaAuthError extends Error {}

/**
 * Upload a PDF as a new Canva design and wait for it. Returns the design's edit link
 * (only works for this person, valid 30 days).
 */
export async function importPdf(token: string, bytes: Uint8Array, title: string): Promise<string> {
  const meta = { title_base64: Buffer.from(title.slice(0, 50)).toString("base64"), mime_type: "application/pdf" };
  const res = await fetch(`${API}/imports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream", "Import-Metadata": JSON.stringify(meta) },
    body: Buffer.from(bytes),
  });
  if (res.status === 401 || res.status === 403) throw new CanvaAuthError("Canva needs you to connect again.");
  if (!res.ok) throw new Error(`Canva didn't accept the label (${res.status}).`);
  let job = ((await res.json()) as { job: ImportJob }).job;
  for (let i = 0; i < 40 && job.status === "in_progress"; i++) {
    await new Promise((r) => setTimeout(r, i < 5 ? 500 : 1000));
    const poll = await fetch(`${API}/imports/${encodeURIComponent(job.id)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!poll.ok) throw new Error(`Canva didn't finish the import (${poll.status}).`);
    job = ((await poll.json()) as { job: ImportJob }).job;
  }
  const url = job.status === "success" ? job.result?.designs?.[0]?.urls?.edit_url : undefined;
  if (!url) throw new Error(job.error?.message ? `Canva: ${job.error.message}` : "Canva took too long. Try again in a minute.");
  return url;
}

interface ImportJob {
  id: string;
  status: "in_progress" | "success" | "failed";
  result?: { designs?: { urls?: { edit_url?: string } }[] };
  error?: { code: string; message: string };
}

/** Add our return tag to a Canva edit link (Canva's Return button sends it back; 50 characters max). */
export function withReturn(editUrl: string, state: string): string {
  const u = new URL(editUrl);
  u.searchParams.set("correlation_state", state.slice(0, 50));
  return u.toString();
}

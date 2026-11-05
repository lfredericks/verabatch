import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_LIMITS, isBigSwap, STRIKES_BEFORE_NUDGE, UPGRADE_NOTE, type Plan, type ProductPrint } from "./plans";

export interface PlanInfo {
  businessId: string;
  plan: Plan;
  strikes: number;
  base: ProductPrint | null;
  products: number;
  batches: number;
}

/** The signed-in person's business, its plan and what it has used. */
export async function planInfo(supabase: SupabaseClient): Promise<PlanInfo | null> {
  const { data: b } = await supabase.from("businesses").select("id, plan, free_strikes, free_base").limit(1).maybeSingle();
  if (!b) return null;
  const [{ count: products }, { count: batches }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", b.id),
    supabase.from("batches").select("id", { count: "exact", head: true }).eq("business_id", b.id),
  ]);
  return {
    businessId: b.id as string,
    plan: ((b.plan as Plan) ?? "free") as Plan,
    strikes: (b.free_strikes as number | null) ?? 0,
    base: (b.free_base as ProductPrint | null) ?? null,
    products: products ?? 0,
    batches: batches ?? 0,
  };
}

export const PRODUCT_LIMIT_TEXT = `The Free plan covers one product. ${UPGRADE_NOTE}`;
export const BATCH_LIMIT_TEXT = `The Free plan includes ${FREE_LIMITS.batches} logged batches. ${UPGRADE_NOTE} Your labels keep working without logging batches.`;
export const LOCKED_TEXT = `This looks like a different product, and the Free plan covers one. ${UPGRADE_NOTE}`;
export const NUDGE_TEXT = "Saved. Looks like you're making several products: the Free plan covers one, so Pro will suit you once it opens.";

export function atProductLimit(p: PlanInfo | null): boolean {
  return Boolean(p && p.plan === "free" && p.products >= FREE_LIMITS.products);
}
export function atBatchLimit(p: PlanInfo | null): boolean {
  return Boolean(p && p.plan === "free" && p.batches >= FREE_LIMITS.batches);
}

/** A database error from the Free limits trigger (migration 0014). */
export function limitError(e: { message?: string } | null): string | null {
  if (!e?.message) return null;
  if (e.message.includes("free_limit_products")) return PRODUCT_LIMIT_TEXT;
  if (e.message.includes("free_limit_batches")) return BATCH_LIMIT_TEXT;
  return null;
}

/**
 * Three-strikes check for a save of the Free product. Returns "locked" to refuse the save,
 * or a function to call after it saved, which records it and says whether to nudge.
 */
export function strikeCheck(p: PlanInfo | null, before: ProductPrint, after: ProductPrint) {
  if (!p || p.plan !== "free") return { locked: false as const, after: async () => null as string | null };
  const base = p.base ?? before;
  const swap = isBigSwap(base, after);
  if (swap && p.strikes > STRIKES_BEFORE_NUDGE) return { locked: true as const };
  return {
    locked: false as const,
    after: async (supabase: SupabaseClient): Promise<string | null> => {
      if (!swap && p.base) return null;
      const { data: n } = await supabase.rpc("record_free_save", { p_business: p.businessId, p_base: swap ? after : base, p_strike: swap });
      return swap && (n as number) === STRIKES_BEFORE_NUDGE + 1 ? NUDGE_TEXT : null;
    },
  };
}

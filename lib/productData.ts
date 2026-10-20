import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecipeLine } from "./core/types";
import { cleanLine, cleanRecipe } from "./products";
import { cleanChanges, ensureKeys, resolveRecipe } from "./variations";

export interface ProductRow {
  id: string;
  name: string;
  recipe: unknown;
  parent_id?: string | null;
  changes?: unknown;
}

/**
 * The recipe a product is actually made with: its own for a regular product,
 * or the parent's recipe with the variation's changes applied.
 */
export async function effectiveRecipe(
  supabase: SupabaseClient,
  product: ProductRow,
): Promise<{ lines: RecipeLine[]; parent: { id: string; name: string; recipe: RecipeLine[] } | null }> {
  if (!product.parent_id) return { lines: ensureKeys(cleanRecipe(product.recipe)), parent: null };
  const { data: parent } = await supabase.from("products").select("id, name, recipe").eq("id", product.parent_id).maybeSingle();
  if (!parent) return { lines: ensureKeys(cleanRecipe(product.recipe)), parent: null };
  const parentLines = ensureKeys(cleanRecipe(parent.recipe));
  return {
    lines: resolveRecipe(parentLines, cleanChanges(product.changes, cleanLine)),
    parent: { id: parent.id as string, name: parent.name as string, recipe: parentLines },
  };
}

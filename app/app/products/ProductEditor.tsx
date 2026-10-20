"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { computeRecipe, labelIngredients, type RecipeLine } from "@/lib/core";
import { activePack } from "@/lib/packs";
import type { Product } from "@/lib/products";
import { saveProduct, type ProductFormState } from "./actions";
import { blankRow, RecipeLines, rowsToLines, toRows, type Row } from "./RecipeLines";

const pack = activePack();

function weight(g: number): string {
  if (g <= 0) return "";
  return `${(g / 28.3495).toFixed(g < 28 ? 2 : 1)} oz (${g < 10 ? g.toFixed(1) : Math.round(g)} g)`;
}

export function ProductEditor({ product, justSaved }: { product: Product | null; justSaved?: boolean }) {
  const [state, action, saving] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [name, setName] = useState(product?.name ?? "");
  const [typeKey, setTypeKey] = useState(product?.type_key ?? "");
  const [identity, setIdentity] = useState(product?.identity ?? "");
  const [identityEdited, setIdentityEdited] = useState(Boolean(product?.identity));
  const [makes, setMakes] = useState(product?.makes ? String(product.makes) : "");
  const [rows, setRows] = useState<Row[]>(() =>
    product?.recipe.length ? toRows(product.recipe) : [blankRow(), blankRow(), blankRow()],
  );
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  const lines: RecipeLine[] = useMemo(() => rowsToLines(rows), [rows]);
  const recipe = useMemo(() => computeRecipe(lines, pack), [lines]);
  const ingredients = useMemo(() => labelIngredients(recipe, pack), [recipe]);
  const ingredientText = ingredients.map((i) => i.name).join(", ");
  const perUnit = makes && Number(makes) > 0 ? recipe.totalGrams / Number(makes) : 0;
  const waiting = recipe.needsChoice.length;
  const unknown = recipe.unknown.length;

  function touch() {
    setDirty(true);
    setCopied(false);
  }
  function pickType(key: string) {
    setTypeKey(key);
    const t = pack.productTypes.find((x) => x.key === key);
    if (!identityEdited) setIdentity(t?.identity ?? "");
    touch();
  }
  async function copyIngredients() {
    try {
      await navigator.clipboard.writeText(`Ingredients: ${ingredientText}.`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <form action={action} className="card form" onSubmit={() => setDirty(false)}>
        {product && <input type="hidden" name="id" value={product.id} />}
        <input type="hidden" name="recipe" value={JSON.stringify(lines)} />

        <label className="fld">
          <span>Product name</span>
          <input
            name="name"
            value={name}
            onChange={(e) => (setName(e.target.value), touch())}
            placeholder="Relief Balm"
            required
            maxLength={120}
          />
        </label>

        <label className="fld">
          <span>What kind of product</span>
          <select name="type_key" value={typeKey} onChange={(e) => pickType(e.target.value)}>
            <option value="">Choose one</option>
            {pack.productTypes.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
            <option value="other">Something else</option>
          </select>
        </label>

        <label className="fld">
          <span>What it is, on the label</span>
          <input
            name="identity"
            value={identity}
            onChange={(e) => (setIdentity(e.target.value), setIdentityEdited(true), touch())}
            placeholder="Botanical Skin Balm"
            maxLength={120}
          />
        </label>
        <p className="hint">The plain words under the name that say what the product is. Required on cosmetic labels.</p>

        <h2>Recipe</h2>
        <p className="hint">Type it the way you make it. Use &ldquo;fl oz&rdquo; for liquid ounces and &ldquo;oz&rdquo; for weighed ounces.</p>

        <RecipeLines
          rows={rows}
          setRows={setRows}
          onChange={touch}
          startOpen={!product?.recipe.length}
          onMakes={(n) => setMakes(String(n))}
        />

        <label className="fld narrow-fld">
          <span>One batch makes</span>
          <input
            name="makes"
            inputMode="numeric"
            value={makes}
            onChange={(e) => (setMakes(e.target.value.replace(/[^\d]/g, "")), touch())}
            placeholder="5"
          />
        </label>

        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}
        {(state.saved || justSaved) && !dirty && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        <div className="row">
          <button className="btn pri" disabled={saving}>
            {saving ? "Saving..." : product ? "Save changes" : "Save product"}
          </button>
          <Link href="/app" className="btn ghost cta">
            Back
          </Link>
        </div>
      </form>

      <section className="card" aria-labelledby="preview">
        <h2 id="preview">On the label</h2>
        <div className="lbl">
          <div className="nm">{name || "Product name"}</div>
          {identity && <div>{identity}</div>}
          <div>
            <b>Ingredients:</b> {ingredientText || "add your recipe above"}
            {ingredientText && "."}
          </div>
        </div>
        {(waiting > 0 || unknown > 0) && (
          <p className="note">
            {waiting > 0 && `${waiting} ingredient${waiting > 1 ? "s" : ""} need${waiting > 1 ? "" : "s"} a quick answer above. `}
            {unknown > 0 && `${unknown} name${unknown > 1 ? "s" : ""} to check. `}
            Don&rsquo;t print until these are sorted.
          </p>
        )}
        {recipe.anyApproximate && (
          <p className="hint">
            Cups, spoons, fluid ounces and drops are turned into weight with typical values, so weights are close, not exact.
          </p>
        )}
        {recipe.totalGrams > 0 && (
          <p className="hint">
            Batch: about {weight(recipe.totalGrams)}
            {perUnit > 0 && `. Each of ${makes}: about ${weight(perUnit)}`}.
          </p>
        )}
        {ingredientText && (
          <button type="button" className="btn sm" onClick={copyIngredients}>
            {copied ? "Copied" : "Copy ingredient list"}
          </button>
        )}
      </section>

    </>
  );
}

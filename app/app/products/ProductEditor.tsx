"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { computeRecipe, labelIngredients, type RecipeLine } from "@/lib/core";
import { activePack } from "@/lib/packs";
import type { Product } from "@/lib/products";
import { recipesDiffer } from "@/lib/variations";
import { saveProduct, type ProductFormState } from "./actions";
import { blankRow, RecipeLines, rowsToLines, toRows, type Row } from "./RecipeLines";

const pack = activePack();

function weight(g: number): string {
  if (g <= 0) return "";
  return `${(g / 28.3495).toFixed(g < 28 ? 2 : 1)} oz (${g < 10 ? g.toFixed(1) : Math.round(g)} g)`;
}

export function ProductEditor({
  product,
  parent = null,
  justSaved,
}: {
  product: Product | null;
  /** Set when this product is a variation: the parent's name and recipe. */
  parent?: { id: string; name: string; recipe: RecipeLine[] } | null;
  justSaved?: boolean;
}) {
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
  const [choosing, setChoosing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const modeRef = useRef<HTMLInputElement>(null);
  const [newName, setNewName] = useState("");

  const lines: RecipeLine[] = useMemo(() => rowsToLines(rows), [rows]);
  const recipe = useMemo(() => computeRecipe(lines, pack), [lines]);
  const ingredients = useMemo(() => labelIngredients(recipe, pack), [recipe]);
  const ingredientText = ingredients.map((i) => i.name).join(", ");
  const recipeChanged = Boolean(product) && recipesDiffer(product!.recipe, lines);
  const perUnit = makes && Number(makes) > 0 ? recipe.totalGrams / Number(makes) : 0;
  const waiting = recipe.needsChoice.length;
  const unknown = recipe.unknown.length;

  /** Submit with an explicit save mode (written straight into the form, so it can't be lost). */
  function submitAs(mode: "master" | "variation" | "standalone") {
    if (modeRef.current) modeRef.current.value = mode;
    formRef.current?.requestSubmit();
  }
  function touch() {
    setDirty(true);
    setCopied(false);
    setChoosing(false);
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
      <form ref={formRef} action={action} className="card form" onSubmit={() => setDirty(false)}>
        <input ref={modeRef} type="hidden" name="mode" defaultValue="master" />
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
        {parent && (
          <p className="note">
            A variation of <Link href={`/app/products/${parent.id}`}>{parent.name}</Link>. Lines you haven&rsquo;t changed follow{" "}
            {parent.name}&rsquo;s recipe.
          </p>
        )}
        <p className="hint">Type it the way you make it. Use &ldquo;fl oz&rdquo; for liquid ounces and &ldquo;oz&rdquo; for weighed ounces.</p>

        <RecipeLines
          rows={rows}
          setRows={setRows}
          onChange={touch}
          startOpen={!product?.recipe.length}
          onMakes={(n) => setMakes(String(n))}
          parent={parent ? { name: parent.name, lines: parent.recipe } : null}
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
        {choosing && product ? (
          <div className="choose" role="group" aria-label="How to save this recipe change">
            <p>
              <b>You changed the recipe.</b> How should it be saved?
            </p>
            <div className="choice">
              <button type="button" className="btn pri sm" onClick={() => submitAs("master")} disabled={saving}>
                {parent ? "Update this variation" : `Update the ${product.name} recipe`}
              </button>
              <span className="hint">
                {parent
                  ? `Only this variation changes. ${parent.name} stays as it is.`
                  : "Future labels use the new recipe. Logged batches keep the recipe they were made with. Variations follow, except where they differ."}
              </span>
            </div>
            <label className="fld">
              <span>Or save it as a new recipe called</span>
              <input
                name="new_name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`${product.name}, coconut-free`}
                maxLength={120}
              />
            </label>
            <div className="choice">
              <button type="button" className="btn sm" onClick={() => submitAs("variation")} disabled={saving || !newName.trim()}>
                Save as a variation of {parent ? parent.name : product.name}
              </button>
              <span className="hint">
                Linked: it keeps following {parent ? parent.name : product.name}&rsquo;s recipe, except for what you changed. Good for
                &ldquo;same blend, no mugwort.&rdquo;
              </span>
            </div>
            <div className="choice">
              <button type="button" className="btn sm" onClick={() => submitAs("standalone")} disabled={saving || !newName.trim()}>
                Save as a new product
              </button>
              <span className="hint">A full copy that stands on its own from now on. Good for a new blend built on the same base.</span>
            </div>
            <p className="hint">Sizes are copied to the new recipe. {product.name} isn&rsquo;t changed by either of these.</p>
            <button type="button" className="btn ghost sm" onClick={() => setChoosing(false)}>
              Keep editing
            </button>
          </div>
        ) : (
          <div className="row">
            {recipeChanged ? (
              <button type="button" className="btn pri" onClick={() => setChoosing(true)}>
                Save changes
              </button>
            ) : (
              <button type="button" className="btn pri" disabled={saving} onClick={() => submitAs("master")}>
                {saving ? "Saving..." : product ? "Save changes" : "Save product"}
              </button>
            )}
            <Link href="/app" className="btn ghost cta">
              Back
            </Link>
          </div>
        )}
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

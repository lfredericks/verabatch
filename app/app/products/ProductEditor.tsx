"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  computeRecipe,
  labelIngredients,
  parseQuickEntry,
  UNIT_LABELS,
  type RecipeLine,
  type Resolution,
  type Unit,
} from "@/lib/core";
import { activePack } from "@/lib/packs";
import type { Product } from "@/lib/products";
import { deleteProduct, saveProduct, type ProductFormState } from "./actions";

type Row = RecipeLine & { id: number };
type Question = Extract<Resolution, { status: "needsChoice" }>;

const pack = activePack();

/** Unit menu, with weight and liquid ounces told apart. */
const UNIT_OPTIONS: { key: Unit; label: string }[] = (Object.keys(UNIT_LABELS) as Unit[]).map((u) => ({
  key: u,
  label: u === "oz" ? "oz (weight)" : u === "floz" ? "fl oz (liquid)" : UNIT_LABELS[u],
}));

let nextId = 1;
const toRows = (lines: RecipeLine[]): Row[] => lines.map((l) => ({ ...l, id: nextId++ }));
const blank = (): Row => ({ id: nextId++, amount: "", unit: "oz", text: "" });

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
    product?.recipe.length ? toRows(product.recipe) : [blank(), blank(), blank()],
  );
  const [paste, setPaste] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  const lines: RecipeLine[] = useMemo(() => rows.map(({ id: _id, ...l }) => l), [rows]);
  const recipe = useMemo(() => computeRecipe(lines, pack), [lines]);
  const ingredients = useMemo(() => labelIngredients(recipe, pack), [recipe]);
  const byLine = new Map(recipe.lines.map((c) => [c.line, c]));
  const ingredientText = ingredients.map((i) => i.name).join(", ");
  const perUnit = makes && Number(makes) > 0 ? recipe.totalGrams / Number(makes) : 0;
  const waiting = recipe.needsChoice.length;
  const unknown = recipe.unknown.length;

  function touch() {
    setDirty(true);
    setCopied(false);
  }
  function update(id: number, patch: Partial<RecipeLine>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    touch();
  }
  function answer(row: Row, q: Question, key: string) {
    const prior = row.variety?.group === q.group ? row.variety : undefined;
    update(row.id, { variety: { ...q.known, ...prior, group: q.group, [q.missing]: key } });
  }
  function pickType(key: string) {
    setTypeKey(key);
    const t = pack.productTypes.find((x) => x.key === key);
    if (!identityEdited) setIdentity(t?.identity ?? "");
    touch();
  }
  function addPasted() {
    const parsed = parseQuickEntry(paste);
    if (parsed.lines.length) {
      setRows((rs) => [...rs.filter((r) => r.text.trim() || r.amount.trim()), ...toRows(parsed.lines)]);
    }
    if (parsed.makes) setMakes(String(parsed.makes));
    setPaste("");
    setPasteOpen(false);
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

        <div className="rows">
          {rows.map((row, i) => {
            const c = byLine.get(lines[i]!);
            const r = c?.resolution;
            return (
              <div className="rline" key={row.id}>
                <div className="rinputs">
                  <input
                    aria-label="Amount"
                    className="amt"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => update(row.id, { amount: e.target.value })}
                    placeholder="1/2"
                    maxLength={20}
                  />
                  <select aria-label="Unit" value={row.unit} onChange={(e) => update(row.id, { unit: e.target.value as Unit })}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Ingredient"
                    className="ing"
                    value={row.text}
                    onChange={(e) => update(row.id, { text: e.target.value })}
                    placeholder="Ingredient"
                    maxLength={160}
                  />
                  <button
                    type="button"
                    className="btn ghost sm"
                    aria-label={`Remove ${row.text || "line"}`}
                    onClick={() => (setRows((rs) => rs.filter((x) => x.id !== row.id)), touch())}
                  >
                    ✕
                  </button>
                </div>
                {r?.status === "known" && <p className="rstatus ok-soft">{r.labelName}</p>}
                {r?.status === "unknown" && (
                  <p className="rstatus warn-text">Not in our list yet. It will show as typed; check the name before printing.</p>
                )}
                {r?.status === "needsChoice" && (
                  <div className="ask">
                    <label className="fld">
                      <span>{r.question}</span>
                      <select value="" onChange={(e) => e.target.value && answer(row, r, e.target.value)}>
                        <option value="">Choose (check your bottle)</option>
                        {(pack.choices?.(r) ?? []).map((ch) => (
                          <option key={ch.key} value={ch.key}>
                            {ch.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {r.note && <p className="hint">{r.note}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="row">
          <button type="button" className="btn sm" onClick={() => (setRows((rs) => [...rs, blank()]), touch())}>
            + Add a line
          </button>
          <button type="button" className="btn ghost sm" onClick={() => setPasteOpen((o) => !o)}>
            Paste a whole recipe
          </button>
        </div>

        {pasteOpen && (
          <div className="fld">
            <span>One ingredient per line, or separated by commas</span>
            <textarea
              rows={5}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={"1/4 cup avocado oil\n1/2 cup jojoba oil\n10 drops lavender\nmakes 5"}
            />
            <button type="button" className="btn sm" onClick={addPasted} disabled={!paste.trim()}>
              Add these lines
            </button>
          </div>
        )}

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

      {product && (
        <section className="card">
          {confirmDelete ? (
            <form action={deleteProduct} className="form">
              <input type="hidden" name="id" value={product.id} />
              <p>
                Delete <b>{product.name}</b>? This can&rsquo;t be undone.
              </p>
              <div className="row">
                <button className="btn danger">Delete</button>
                <button type="button" className="btn ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn ghost sm" onClick={() => setConfirmDelete(true)}>
              Delete this product
            </button>
          )}
        </section>
      )}
    </>
  );
}

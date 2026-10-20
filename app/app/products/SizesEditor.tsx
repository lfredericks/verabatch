"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FillUnit } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { FILL_UNITS, sizeFacts, type Size } from "@/lib/sizes";
import { deleteSize, saveSize, type SizeFormState } from "./sizeActions";

const pack = activePack();

function SizeForm({
  productId,
  size,
  defaultUnit,
  onDone,
}: {
  productId: string;
  size: Size | null;
  defaultUnit: FillUnit;
  onDone: () => void;
}) {
  const [state, action, saving] = useActionState<SizeFormState, FormData>(async (prev, form) => {
    const r = await saveSize(prev, form);
    if (r.saved) onDone();
    return r;
  }, {});
  const [shape, setShape] = useState<"rect" | "round">(size?.label_shape ?? "rect");
  const n = (v: number | null | undefined) => (v ? String(Number(v)) : "");

  return (
    <form action={action} className="form sizeform">
      {size && <input type="hidden" name="id" value={size.id} />}
      <input type="hidden" name="product_id" value={productId} />
      <label className="fld">
        <span>Size name</span>
        <input name="name" defaultValue={size?.name ?? ""} placeholder="2 oz jar" required maxLength={60} />
      </label>
      <div className="fld">
        <span>How much goes in one</span>
        <div className="pair">
          <input name="fill_amount" defaultValue={size?.fill_amount ?? ""} inputMode="decimal" placeholder="2" required maxLength={20} aria-label="Fill amount" />
          <select name="fill_unit" defaultValue={size?.fill_unit ?? defaultUnit} aria-label="Fill unit">
            {FILL_UNITS.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="hint">Balms and butters are sold by weight (oz). Sprays and oils by liquid (fl oz).</p>
      <fieldset className="fld">
        <span>Front label shape</span>
        <div className="row">
          <label className="radio">
            <input type="radio" name="label_shape" value="rect" checked={shape === "rect"} onChange={() => setShape("rect")} /> Rectangle
          </label>
          <label className="radio">
            <input type="radio" name="label_shape" value="round" checked={shape === "round"} onChange={() => setShape("round")} /> Round
          </label>
        </div>
      </fieldset>
      {shape === "round" ? (
        <label className="fld">
          <span>Width across (inches)</span>
          <input name="diameter_in" defaultValue={n(size?.diameter_in)} inputMode="decimal" placeholder="2" maxLength={10} />
        </label>
      ) : (
        <div className="fld">
          <span>Width and height (inches)</span>
          <div className="pair">
            <input name="width_in" defaultValue={n(size?.width_in)} inputMode="decimal" placeholder="3" maxLength={10} aria-label="Width in inches" />
            <input name="height_in" defaultValue={n(size?.height_in)} inputMode="decimal" placeholder="2" maxLength={10} aria-label="Height in inches" />
          </div>
        </div>
      )}
      <p className="hint">The front label only. Optional, but it sets the smallest letter size allowed for the net weight.</p>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="row">
        <button className="btn pri sm" disabled={saving}>
          {saving ? "Saving..." : size ? "Save size" : "Add size"}
        </button>
        <button type="button" className="btn ghost sm" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SizesEditor({ productId, sizes, defaultUnit }: { productId: string; sizes: Size[]; defaultUnit: FillUnit }) {
  const [editing, setEditing] = useState<string | null>(sizes.length ? null : "new");
  const [removing, setRemoving] = useState<string | null>(null);

  return (
    <section className="card" aria-labelledby="sizes">
      <h2 id="sizes">Sizes</h2>
      {sizes.length === 0 && editing !== "new" && <p>Add the containers you sell this in.</p>}
      <ul className="plist">
        {sizes.map((s) => {
          const f = sizeFacts(s, pack.lettering);
          return (
            <li key={s.id}>
              {editing === s.id ? (
                <SizeForm productId={productId} size={s} defaultUnit={defaultUnit} onDone={() => setEditing(null)} />
              ) : (
                <div className="sizerow">
                  <div>
                    <b>{s.name}</b>
                    <span>
                      {f.net ?? "Check the fill amount"}
                      {f.labelText && ` · label ${f.labelText}`}
                    </span>
                  </div>
                  <div className="row">
                    <Link href={`/app/products/${productId}/label?size=${s.id}`} className="btn pri sm cta">
                      Label
                    </Link>
                    <button type="button" className="btn ghost sm" onClick={() => setEditing(s.id)}>
                      Edit
                    </button>
                    {removing === s.id ? (
                      <form action={deleteSize} className="row">
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="product_id" value={productId} />
                        <button className="btn danger sm">Remove {s.name}</button>
                        <button type="button" className="btn ghost sm" onClick={() => setRemoving(null)}>
                          Keep
                        </button>
                      </form>
                    ) : (
                      <button type="button" className="btn ghost sm" aria-label={`Remove ${s.name}`} onClick={() => setRemoving(s.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {editing === "new" ? (
        <SizeForm productId={productId} size={null} defaultUnit={defaultUnit} onDone={() => setEditing(null)} />
      ) : (
        editing === null && (
          <button type="button" className="btn sm cta" onClick={() => setEditing("new")}>
            + Add a size
          </button>
        )
      )}
    </section>
  );
}

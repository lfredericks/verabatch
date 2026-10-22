"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { activePack } from "@/lib/packs";
import { saveProductInfo, type InfoFormState } from "./actions";

const pack = activePack();

/**
 * Name, kind of product and "what it is". Locked until Edit is tapped, like the
 * business details, so they can't change by accident.
 */
export function ProductInfo({ product }: { product: { id: string; name: string; type_key: string; identity: string } }) {
  const [editing, setEditing] = useState(false);
  const [state, action, saving] = useActionState<InfoFormState, FormData>(saveProductInfo, {});
  const [name, setName] = useState(product.name);
  const [typeKey, setTypeKey] = useState(product.type_key);
  const [identity, setIdentity] = useState(product.identity);

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state]);

  const typeLabel =
    product.type_key === "other" ? "Something else" : (pack.productTypes.find((t) => t.key === product.type_key)?.label ?? "");

  function open() {
    setName(product.name);
    setTypeKey(product.type_key);
    setIdentity(product.identity);
    setEditing(true);
  }
  function pickType(key: string) {
    setTypeKey(key);
    const t = pack.productTypes.find((x) => x.key === key);
    // Fill "what it is" from the type only if it's empty.
    if (!identity.trim() && t) setIdentity(t.identity);
  }

  if (!editing) {
    return (
      <section className="card" aria-labelledby="info">
        <h2 id="info">Product info</h2>
        <dl className="facts">
          <div>
            <dt>Product name</dt>
            <dd>{product.name}</dd>
          </div>
          <div>
            <dt>What kind of product</dt>
            <dd>{typeLabel || <i className="hint">not set</i>}</dd>
          </div>
          <div>
            <dt>What it is, on the label</dt>
            <dd>{product.identity || <i className="hint">not set</i>}</dd>
          </div>
        </dl>
        {state.saved && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        <button type="button" className="btn sm cta" onClick={open}>
          Edit product info
        </button>
      </section>
    );
  }

  return (
    <form
      className="card form"
      // Submitted by hand so the framework doesn't reset the fields after saving.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <h2>Product info</h2>
      <input type="hidden" name="id" value={product.id} />
      <label className="fld">
        <span>Product name</span>
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
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
        <input name="identity" value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Botanical Skin Balm" maxLength={120} />
      </label>
      <p className="hint">The plain words under the name that say what the product is. Required on cosmetic labels.</p>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="row">
        <button className="btn pri" disabled={saving}>
          {saving ? "Saving..." : "Save product info"}
        </button>
        <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

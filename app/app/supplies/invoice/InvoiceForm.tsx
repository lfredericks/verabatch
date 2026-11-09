"use client";

import { useActionState, useState } from "react";
import { addInvoice, type AddState } from "../materialActions";

const UNITS = [
  { key: "lb", label: "lb" },
  { key: "oz", label: "oz" },
  { key: "g", label: "g" },
  { key: "floz", label: "fl oz" },
  { key: "ml", label: "mL" },
  { key: "each", label: "each" },
];

interface Line {
  name: string;
  amount: string;
  unit: string;
  price: string;
  lot: string;
  organic: boolean;
}

const blank = (): Line => ({ name: "", amount: "", unit: "lb", price: "", lot: "", organic: false });

/** Type in a whole invoice: the shop once, then one line per thing on it. Every line becomes a delivery. */
export function InvoiceForm({ materials, shops }: { materials: string[]; shops: string[] }) {
  const [state, action, saving] = useActionState<AddState, FormData>(addInvoice, {});
  const [lines, setLines] = useState<Line[]>([blank()]);
  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const total = lines.reduce((t, l) => t + (Number(l.price.replace(/[$,\s]/g, "")) || 0), 0);

  return (
    <form action={action} className="stack">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <datalist id="mats">
        {materials.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <datalist id="shops">
        {shops.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <label className="fld">
        <span>Shop</span>
        <input name="supplier" list="shops" maxLength={120} placeholder="Mountain Rose Herbs" />
      </label>
      <div className="inv-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label className="fld">
          <span>Date</span>
          <input type="date" name="invoice_date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="fld">
          <span>Invoice number</span>
          <input name="invoice_number" maxLength={60} placeholder="Optional" />
        </label>
      </div>

      <h2>What was on it</h2>
      {lines.map((l, i) => (
        <fieldset key={i} className="inv-line">
          <legend className="sr-only">Line {i + 1}</legend>
          <label className="fld">
            <span>What</span>
            <input value={l.name} onChange={(e) => set(i, { name: e.target.value })} list="mats" maxLength={120} placeholder="Unrefined shea" />
          </label>
          <div className="inv-row">
            <label className="fld">
              <span>How much</span>
              <input value={l.amount} onChange={(e) => set(i, { amount: e.target.value.replace(/[^\d./ ]/g, "") })} inputMode="decimal" maxLength={20} />
            </label>
            <label className="fld">
              <span>Unit</span>
              <select value={l.unit} onChange={(e) => set(i, { unit: e.target.value })}>
                {UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span>Price</span>
              <input value={l.price} onChange={(e) => set(i, { price: e.target.value.replace(/[^\d.,$]/g, "") })} inputMode="decimal" maxLength={12} placeholder="$" />
            </label>
          </div>
          <div className="inv-row" style={{ gridTemplateColumns: "1fr auto" }}>
            <label className="fld">
              <span>Lot number</span>
              <input value={l.lot} onChange={(e) => set(i, { lot: e.target.value })} maxLength={60} placeholder="Optional" />
            </label>
            <label className="radio">
              <input type="checkbox" checked={l.organic} onChange={(e) => set(i, { organic: e.target.checked })} /> Organic
            </label>
          </div>
          {lines.length > 1 && (
            <button type="button" className="linkbtn" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>
              Remove this line
            </button>
          )}
        </fieldset>
      ))}
      <button type="button" className="btn" onClick={() => setLines((ls) => [...ls, blank()])}>
        + Add another line
      </button>
      {total > 0 && <p className="hint">Total: ${total.toFixed(2)}</p>}
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn pri big" disabled={saving}>
        {saving ? "Saving..." : "Save invoice"}
      </button>
    </form>
  );
}

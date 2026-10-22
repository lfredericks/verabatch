"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { NamePick } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { amountText, costPerUnit, money, recognize, SUPPLY_UNITS, type Supply } from "@/lib/supplies";
import { IngredientCheck } from "./IngredientCheck";
import { saveSupply, type SupplyFormState } from "./actions";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateText(d: string | null): string {
  return d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
}

/**
 * Add a supply lot, or show one locked behind Edit. New lots start with today's date.
 */
export function SupplyForm({ supply, onCancel, invoiceUrl }: { supply: Supply | null; onCancel?: () => void; invoiceUrl?: string | null }) {
  const [editing, setEditing] = useState(!supply);
  const [state, action, saving] = useActionState<SupplyFormState, FormData>(saveSupply, {});
  const [received, setReceived] = useState(supply?.received_on ?? "");
  const [ingredient, setIngredient] = useState(supply?.ingredient ?? "");
  const [pick, setPick] = useState<NamePick | null>(supply?.name_pick ?? null);
  const [description, setDescription] = useState(supply?.description ?? "");

  useEffect(() => {
    if (!supply && !received) setReceived(today());
  }, [supply, received]);
  useEffect(() => {
    if (state.saved && supply) setEditing(false);
  }, [state, supply]);

  if (supply && !editing) {
    const known = recognize(supply.ingredient, supply.name_pick, activePack());
    const perUnit = costPerUnit(supply);
    return (
      <section className="card" aria-label="Supply details">
        <dl className="facts">
          <div>
            <dt>Ingredient</dt>
            <dd>{supply.ingredient}</dd>
          </div>
          <div>
            <dt>Ingredient name</dt>
            <dd>
              {known.status === "unknown" ? (
                <span className="warn-text">Not recognized</span>
              ) : (
                known.name ?? "Recognized"
              )}
            </dd>
          </div>
          {supply.description && (
            <div>
              <dt>Description</dt>
              <dd>{supply.description}</dd>
            </div>
          )}
          <div>
            <dt>Supplier</dt>
            <dd>{supply.supplier || <i className="hint">not set</i>}</dd>
          </div>
          <div>
            <dt>Supplier&rsquo;s lot number</dt>
            <dd className="mono">{supply.supplier_lot || <i className="hint">not set</i>}</dd>
          </div>
          <div>
            <dt>Amount received</dt>
            <dd>{amountText(supply) || <i className="hint">not set</i>}</dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>
              {supply.cost !== null && supply.cost !== undefined && supply.cost !== "" ? (
                <>
                  {money(supply.cost)}
                  {perUnit && <span className="hint"> ({perUnit})</span>}
                </>
              ) : (
                <i className="hint">not set</i>
              )}
            </dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{dateText(supply.received_on) || <i className="hint">not set</i>}</dd>
          </div>
          {supply.best_by && (
            <div>
              <dt>Best by</dt>
              <dd>{dateText(supply.best_by)}</dd>
            </div>
          )}
          {supply.note && (
            <div>
              <dt>Note</dt>
              <dd>{supply.note}</dd>
            </div>
          )}
        </dl>
        {invoiceUrl && (
          <a href={invoiceUrl} target="_blank" rel="noopener" className="btn ghost sm cta">
            View the invoice
          </a>
        )}
        {state.saved && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        <button type="button" className="btn sm cta" onClick={() => setEditing(true)}>
          Edit supply details
        </button>
      </section>
    );
  }

  return (
    <form
      className="card form"
      onSubmit={(e) => {
        // React resets forms after an action; submit by hand so a typo doesn't wipe the form.
        e.preventDefault();
        const form = e.currentTarget;
        startTransition(() => action(new FormData(form)));
      }}
    >
      {supply && <input type="hidden" name="id" value={supply.id} />}
      <input type="hidden" name="name_pick" value={JSON.stringify(pick)} />
      <input type="hidden" name="description" value={description} />
      <label className="fld">
        <span>Ingredient</span>
        <input
          name="ingredient"
          value={ingredient}
          onChange={(e) => (setIngredient(e.target.value), setPick(null))}
          placeholder="Chamomile flower"
          required
          maxLength={120}
        />
      </label>
      <IngredientCheck ingredient={ingredient} pick={pick} description={description} onPick={setPick} onDescription={setDescription} />
      <div className="pair">
        <label className="fld">
          <span>Supplier</span>
          <input name="supplier" defaultValue={supply?.supplier ?? ""} placeholder="Mountain Rose Herbs" maxLength={120} />
        </label>
        <label className="fld">
          <span>Their lot number</span>
          <input name="supplier_lot" defaultValue={supply?.supplier_lot ?? ""} placeholder="From the bag or invoice" maxLength={60} className="mono" />
        </label>
      </div>
      <div className="fld">
        <span>Amount received</span>
        <div className="pair">
          <input name="amount" defaultValue={supply?.amount ?? ""} inputMode="decimal" placeholder="2" maxLength={20} aria-label="Amount" />
          <select name="unit" defaultValue={supply?.unit || "lb"} aria-label="Unit">
            {SUPPLY_UNITS.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="fld narrow-fld">
        <span>Cost (what you paid for this lot)</span>
        <input name="cost" defaultValue={supply?.cost != null && supply.cost !== "" ? Number(supply.cost).toFixed(2) : ""} inputMode="decimal" placeholder="$24.50" maxLength={20} />
      </label>
      <div className="pair">
        <label className="fld">
          <span>Date received</span>
          <input type="date" name="received_on" value={received} onChange={(e) => setReceived(e.target.value)} />
        </label>
        <label className="fld">
          <span>Best by (optional)</span>
          <input type="date" name="best_by" defaultValue={supply?.best_by ?? ""} />
        </label>
      </div>
      <label className="fld">
        <span>Note (optional)</span>
        <textarea name="note" defaultValue={supply?.note ?? ""} maxLength={2000} rows={2} placeholder="Certificate of analysis on file, organic, harvest year..." />
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="row">
        <button className="btn pri" disabled={saving}>
          {saving ? "Saving..." : supply ? "Save changes" : "Add this supply"}
        </button>
        {(supply || onCancel) && (
          <button type="button" className="btn ghost" onClick={() => (supply ? setEditing(false) : onCancel?.())}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

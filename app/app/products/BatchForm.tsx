"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { RecipeLine } from "@/lib/core";
import { NO_SIZE, type Batch } from "@/lib/batches";
import { amountText, defaultLots, MAX_LOTS_PER_LINE, suppliesForLine, type Supply } from "@/lib/supplies";
import { saveBatch, type BatchFormState } from "./batchActions";
import { RecipeLines, rowsToLines, toRows, type Row } from "./RecipeLines";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function supplyLabel(s: Supply): string {
  const date = s.received_on ? new Date(`${s.received_on}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  return [s.ingredient, s.supplier, s.supplier_lot ? `lot ${s.supplier_lot}` : "", date || amountText(s)].filter(Boolean).join(" · ");
}

export function BatchForm({
  productId,
  productName,
  master,
  makes,
  sizes,
  batch,
  supplies,
  picks: savedPicks,
}: {
  productId: string;
  productName: string;
  master: RecipeLine[];
  makes: number | null;
  sizes: { id: string; name: string }[];
  batch: Batch | null;
  supplies: Supply[];
  /** Saved supply lots per line key (existing batch). */
  picks: Record<string, string[]>;
}) {
  const [state, action, saving] = useActionState<BatchFormState, FormData>(saveBatch, {});
  const [madeOn, setMadeOn] = useState(batch?.made_on ?? "");
  const [changed, setChanged] = useState(batch?.changed ?? false);
  const [rows, setRows] = useState<Row[]>(() => toRows(batch?.changed ? batch.recipe : master));
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const c: Record<string, string> = {};
    if (batch) for (const [k, v] of Object.entries(batch.counts)) c[k] = String(v);
    else if (!sizes.length && makes) c[NO_SIZE] = String(makes);
    else if (sizes.length === 1 && makes) c[sizes[0]!.id] = String(makes);
    return c;
  });

  // Today's date in the maker's own time zone, set after the page loads.
  useEffect(() => {
    if (!madeOn) setMadeOn(today());
  }, [madeOn]);

  const lines = useMemo(() => rowsToLines(rows), [rows]);
  // The lines this batch is made from: its own copy if it has one, else the usual recipe.
  const usualLines = batch && !batch.changed ? batch.recipe : master;
  const shown = changed ? lines : usualLines;
  // Line identity for supply picks: its key, or the row it came from.
  const lineId = (i: number) => (changed ? (rows[i]?.key ?? `r${rows[i]?.id}`) : (usualLines[i]?.key ?? `u${i}`));
  const [picks, setPicks] = useState<Record<string, string[]>>(() => {
    if (batch) return { ...savedPicks };
    // New batch: start each line on the newest matching lot of each ingredient on hand.
    const out: Record<string, string[]> = {};
    usualLines.forEach((l, i) => {
      const lots = defaultLots(l.text, supplies);
      if (lots.length) out[l.key ?? `u${i}`] = lots;
    });
    return out;
  });
  const pickIndex = Object.fromEntries(
    shown.map((_, i) => [i, (picks[lineId(i)] ?? []).filter(Boolean)] as const).filter(([, v]) => v.length),
  );
  const setLot = (id: string, at: number, value: string) =>
    setPicks((p) => {
      const list = [...(p[id] ?? [])];
      if (value) list[at] = value;
      else list.splice(at, 1);
      return { ...p, [id]: list };
    });
  const countFields = sizes.length ? sizes : [{ id: NO_SIZE, name: "How many" }];

  return (
    <>
      <form action={action} className="card form">
        {batch && <input type="hidden" name="id" value={batch.id} />}
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="changed" value={changed ? "1" : "0"} />
        <input type="hidden" name="recipe" value={JSON.stringify(changed ? lines : [])} />
        <input type="hidden" name="counts" value={JSON.stringify(counts)} />
        <input type="hidden" name="supplies" value={JSON.stringify(pickIndex)} />

        {batch && (
          <p>
            Lot <b className="mono">{batch.lot}</b>
          </p>
        )}

        <label className="fld narrow-fld">
          <span>Date made</span>
          <input type="date" name="made_on" value={madeOn} onChange={(e) => setMadeOn(e.target.value)} required />
        </label>
        {batch && <p className="hint">Changing the date keeps the same lot number.</p>}

        <fieldset className="fld">
          <span>Recipe</span>
          <label className="radio">
            <input type="radio" checked={!changed} onChange={() => setChanged(false)} /> Made the usual way
          </label>
          <label className="radio">
            <input type="radio" checked={changed} onChange={() => setChanged(true)} /> Something changed this time
          </label>
        </fieldset>

        {changed && (
          <div className="sub">
            <p className="hint">
              Edit the lines that were different (fewer drops, a different beeswax). This only changes this batch, not your {productName} recipe.
            </p>
            <RecipeLines rows={rows} setRows={setRows} onChange={() => {}} startOpen={false} />
          </div>
        )}

        {supplies.length > 0 && shown.length > 0 && (
          <fieldset className="fld">
            <span>Supplier lots used (optional)</span>
            <p className="hint">So a supplier recall can be traced to this batch. Lots marked used up aren&rsquo;t listed.</p>
            {shown.map((l, i) => {
              const id = lineId(i);
              const chosen = picks[id] ?? [];
              const slots = chosen.length ? chosen : [""];
              return (
                <div key={id} className="fld supply-pick">
                  <span className="hint">{l.text || "Line " + (i + 1)}</span>
                  {slots.map((value, at) => {
                    const { matches, others } = suppliesForLine(l.text, supplies, value);
                    const taken = new Set(chosen.filter((x, j) => j !== at));
                    const opts = (list: Supply[]) =>
                      list
                        .filter((s) => !taken.has(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {supplyLabel(s)}
                          </option>
                        ));
                    return (
                      <div key={at} className="lot-row">
                        <select value={value} onChange={(e) => setLot(id, at, e.target.value)} aria-label={`Supplier lot for ${l.text}`}>
                          <option value="">{at === 0 ? "Not tracked" : "Remove this lot"}</option>
                          {matches.length > 0 && <optgroup label="Matching">{opts(matches)}</optgroup>}
                          {others.length > 0 && <optgroup label="Other supplies">{opts(others)}</optgroup>}
                        </select>
                      </div>
                    );
                  })}
                  {chosen.length > 0 && chosen.length < MAX_LOTS_PER_LINE && chosen.length < supplies.filter((s) => !s.used_up).length && (
                    <button type="button" className="btn ghost sm cta" onClick={() => setPicks((p) => ({ ...p, [id]: [...chosen, ""] }))}>
                      + Another lot for this line
                    </button>
                  )}
                </div>
              );
            })}
          </fieldset>
        )}
        {supplies.length === 0 && (
          <p className="hint">
            Track supplier lots? Add them under <Link href="/app/supplies">Supplies</Link>, then pick them here.
          </p>
        )}

        <div className="fld">
          <span>How many you made</span>
          <div className="counts">
            {countFields.map((s) => (
              <label key={s.id} className="count">
                <input
                  inputMode="numeric"
                  value={counts[s.id] ?? ""}
                  onChange={(e) => setCounts((c) => ({ ...c, [s.id]: e.target.value.replace(/[^\d]/g, "") }))}
                  placeholder="0"
                  aria-label={s.name}
                />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="fld">
          <span>Note (optional)</span>
          <textarea name="note" defaultValue={batch?.note ?? ""} maxLength={2000} placeholder="Weather, how it set up..." />
        </label>

        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}
        <div className="row">
          <button className="btn pri" disabled={saving || !madeOn}>
            {saving ? "Saving..." : batch ? "Save batch" : "Save batch and get lot number"}
          </button>
          <Link href={`/app/products/${productId}`} className="btn ghost cta">
            Cancel
          </Link>
        </div>
      </form>

    </>
  );
}

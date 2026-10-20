"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { RecipeLine } from "@/lib/core";
import { NO_SIZE, type Batch } from "@/lib/batches";
import { saveBatch, type BatchFormState } from "./batchActions";
import { RecipeLines, rowsToLines, toRows, type Row } from "./RecipeLines";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BatchForm({
  productId,
  productName,
  master,
  makes,
  sizes,
  batch,
}: {
  productId: string;
  productName: string;
  master: RecipeLine[];
  makes: number | null;
  sizes: { id: string; name: string }[];
  batch: Batch | null;
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
  const countFields = sizes.length ? sizes : [{ id: NO_SIZE, name: "How many" }];

  return (
    <>
      <form action={action} className="card form">
        {batch && <input type="hidden" name="id" value={batch.id} />}
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="changed" value={changed ? "1" : "0"} />
        <input type="hidden" name="recipe" value={JSON.stringify(changed ? lines : [])} />
        <input type="hidden" name="counts" value={JSON.stringify(counts)} />

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
          <textarea name="note" defaultValue={batch?.note ?? ""} maxLength={2000} placeholder="Supplier lot, weather, how it set up..." />
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

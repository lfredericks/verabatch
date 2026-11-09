"use client";

import type { LineLinks } from "@/lib/lineLinks";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { RecipeLine } from "@/lib/core";
import { NO_SIZE, type Batch } from "@/lib/batches";
import { amountText, defaultLots, MAX_LOTS_PER_LINE, suppliesForLine, type Supply } from "@/lib/supplies";
import { saveBatch, type BatchFormState } from "./batchActions";
import { amountText as lineAmount, RecipeLines, rowsToLines, toRows, type Row } from "./RecipeLines";

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
  links = {},
}: {
  productId: string;
  productName: string;
  master: RecipeLine[];
  makes: number | null;
  sizes: { id: string; name: string }[];
  batch: Batch | null;
  supplies: (Supply & { material_id?: string | null })[];
  /** Saved supply lots per line key (existing batch). */
  picks: Record<string, string[]>;
  /** Which of the maker's supplies each recipe line is, by line key. */
  links?: LineLinks;
}) {
  const linkOf = (key: string | undefined) => (key && key in links ? links[key] : undefined);
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
      const lots = defaultLots(l.text, supplies, linkOf(l.key));
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

  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState(Boolean(batch?.note));
  const dayText = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const lotName = (sp: Supply) => [dayText(sp.received_on) || sp.ingredient, sp.supplier].filter(Boolean).join(" · ");
  const byId = new Map(supplies.map((sp) => [sp.id, sp]));
  const fromText = (ids: string[]) => {
    if (ids.length === 1) {
      const sp = byId.get(ids[0]!);
      if (!sp) return "";
      const d = dayText(sp.received_on);
      return d ? `From your ${d} delivery${sp.supplier ? ` · ${sp.supplier}` : ""}` : `From your ${sp.ingredient}${sp.supplier ? ` · ${sp.supplier}` : ""}`;
    }
    return `From ${ids.length} deliveries`;
  };
  const setLine = (id: string, ids: string[]) => setPicks((p) => ({ ...p, [id]: ids.slice(0, MAX_LOTS_PER_LINE) }));

  return (
    <>
      <form action={action} className="form batch-form">
        {batch && <input type="hidden" name="id" value={batch.id} />}
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="changed" value={changed ? "1" : "0"} />
        <input type="hidden" name="recipe" value={JSON.stringify(changed ? lines : [])} />
        <input type="hidden" name="counts" value={JSON.stringify(counts)} />
        <input type="hidden" name="supplies" value={JSON.stringify(pickIndex)} />
        <input type="hidden" name="made_on" value={madeOn} />

        {changed ? (
          <div className="sub">
            <p className="hint">
              Change the lines that were different (fewer drops, a different beeswax). This only changes this batch, not your {productName} recipe.
            </p>
            <RecipeLines rows={rows} setRows={setRows} onChange={() => {}} startOpen={false} />
          </div>
        ) : null}

        {shown.length > 0 && (
          <ul className="rlist">
            {shown.map((l, i) => {
              const id = lineId(i);
              const chosen = (picks[id] ?? []).filter(Boolean);
              const { matches, others } = suppliesForLine(l.text, supplies, chosen[0], linkOf(l.key));
              const isOpen = open === id;
              const status = chosen.length
                ? fromText(chosen)
                : matches.length
                  ? "Not picked. That's fine."
                  : supplies.length
                    ? "Not in your supplies. That's fine."
                    : "";
              const amt = lineAmount(l);
              return (
                <li key={id} className={isOpen ? "rline open" : "rline"}>
                  <button type="button" className="rread" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                    <span className="amt">{amt}</span>
                    <span className="ing">
                      <span className="ing-name">{l.text}</span>
                      {status && <span className="rstatus">{status}</span>}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="answers" role="group" aria-label="Which delivery?">
                      {matches.length > 0 && <p className="rstatus warn-text">Which delivery?</p>}
                      {matches.length > 0 && (
                        <div className="pills">
                          {matches.map((sp, k) => (
                            <button
                              key={sp.id}
                              type="button"
                              className="pill"
                              aria-pressed={chosen.length === 1 && chosen[0] === sp.id}
                              onClick={() => (setLine(id, [sp.id]), setOpen(null))}
                            >
                              {lotName(sp)}
                              {k === 0 && matches.length > 1 ? " · oldest" : ""}
                            </button>
                          ))}
                          {matches.length > 1 && (
                            <button
                              type="button"
                              className="pill"
                              aria-pressed={chosen.length > 1}
                              onClick={() => (setLine(id, matches.map((m) => m.id)), setOpen(null))}
                            >
                              Both / not sure
                            </button>
                          )}
                        </div>
                      )}
                      {others.length > 0 && (
                        <label className="fld">
                          <span className="hint">{matches.length ? "Something else" : "Pick one of your supplies"}</span>
                          <select
                            value=""
                            onChange={(e) => e.target.value && (setLine(id, [e.target.value]), setOpen(null))}
                            aria-label={`Another supply for ${l.text}`}
                          >
                            <option value="">Choose...</option>
                            {others.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {supplyLabel(sp)}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {chosen.length > 0 && (
                        <button type="button" className="btn ghost sm" onClick={() => (setLine(id, []), setOpen(null))}>
                          Don&rsquo;t track this one
                        </button>
                      )}
                      {!supplies.length && (
                        <p className="hint">
                          Add what you buy under <Link href="/app/supplies">Supplies</Link> and it shows up here.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <button type="button" className="linkbtn" onClick={() => setChanged(!changed)}>
          {changed ? "Made it the usual way after all" : "Something was different this time"}
        </button>

        <div className="fld">
          <span>How many you made</span>
          <div className="counts">
            {countFields.map((sz) => (
              <label key={sz.id} className="count">
                <input
                  inputMode="numeric"
                  value={counts[sz.id] ?? ""}
                  onChange={(e) => setCounts((c) => ({ ...c, [sz.id]: e.target.value.replace(/[^\d]/g, "") }))}
                  placeholder="0"
                  aria-label={sz.name}
                />
                <span>{sz.name}</span>
              </label>
            ))}
          </div>
        </div>

        {details ? (
          <>
            <label className="fld narrow-fld">
              <span>Date made</span>
              <input type="date" value={madeOn} onChange={(e) => setMadeOn(e.target.value)} required />
            </label>
            {batch && <p className="hint">Changing the date keeps the same lot number.</p>}
            <label className="fld">
              <span>Note (optional)</span>
              <textarea name="note" defaultValue={batch?.note ?? ""} maxLength={2000} placeholder="Weather, how it set up..." />
            </label>
          </>
        ) : (
          <button type="button" className="linkbtn" onClick={() => setDetails(true)}>
            Change the date or add a note
          </button>
        )}

        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}
        <button className="btn pri big" disabled={saving || !madeOn}>
          {saving ? "Saving..." : "Save batch"}
        </button>
        <Link href={`/app/products/${productId}`} className="btn ghost cta">
          Cancel
        </Link>
      </form>
    </>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type React from "react";
import type { FillUnit } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { FILL_UNITS, sizeFacts, type Size } from "@/lib/sizes";
import { findTemplate, type TemplateShape } from "@/lib/labelTemplates";
import { EASY_PICKS, findContainer, labelOptions, labelRoomSqIn, type LabelOption } from "@/lib/containers";
import { deleteSize, saveSize, type SizeFormState } from "./sizeActions";

const pack = activePack();

const PLACE: Record<LabelOption["placement"], { title: string; count: string }> = {
  "front-back": { title: "Front + back", count: "2 labels" },
  wrap: { title: "Wraparound", count: "1 label, all the way around" },
  lid: { title: "Lid label", count: "1 round label on top" },
  label: { title: "Wraparound", count: "1 label around the tube" },
};

const inch = (n: number) => String(Number(n.toFixed(3)));
const sizeText = (o: { shape: string; widthIn: number; heightIn: number }) =>
  o.shape === "round" ? `${inch(o.widthIn)} in round` : `${inch(o.widthIn)} × ${inch(o.heightIn)} in`;

/** A tiny drawing of where the label goes. */
function PlaceIcon({ p }: { p: LabelOption["placement"] }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="22" height="6" rx="2" />
      <path d="M10 15h20v16a3 3 0 01-3 3H13a3 3 0 01-3-3z" />
      {p === "front-back" && <rect x="14" y="19" width="12" height="10" rx="1" fill="currentColor" stroke="none" />}
      {(p === "wrap" || p === "label") && <rect x="10" y="19" width="20" height="10" fill="currentColor" stroke="none" />}
      {p === "lid" && <rect x="11" y="10" width="18" height="4" rx="1" fill="currentColor" stroke="none" />}
    </svg>
  );
}

/**
 * Adding or changing a size, in three easy steps: what it's in, how much goes in, which
 * label. "Something else" and "My own size" open the typed-in version.
 */
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
  const n = (v: number | null | undefined) => (v ? String(Number(v)) : "");
  const [pickKey, setPickKey] = useState(() => EASY_PICKS.find((p) => p.label === size?.name)?.key ?? (size ? "other" : ""));
  const [name, setName] = useState(size?.name ?? "");
  const [shape, setShape] = useState<TemplateShape>(size?.label_shape ?? "rect");
  const [templateId, setTemplateId] = useState(size?.label_template ?? "");
  const [width, setWidth] = useState(n(size?.width_in));
  const [height, setHeight] = useState(n(size?.height_in));
  const [diameter, setDiameter] = useState(n(size?.diameter_in));
  const [wrap, setWrap] = useState(Boolean(size?.label_wrap));
  const [small, setSmall] = useState(Boolean(size?.label_small));
  const [own, setOwn] = useState(Boolean(size && !EASY_PICKS.some((p) => p.label === size.name)));
  const [lookup, setLookup] = useState("");
  const container = pickKey && pickKey !== "other" ? findContainer(pickKey) : undefined;
  const options = container ? labelOptions(container) : [];
  const looked = lookup.trim() ? findTemplate(lookup) : null;
  const chosen = (o: LabelOption) =>
    !own &&
    shape === o.shape &&
    (o.shape === "round" ? Number(diameter) === o.widthIn : Number(width) === o.widthIn && Number(height) === o.heightIn) &&
    wrap === (o.placement === "wrap");

  function pickContainer(key: string, label: string) {
    setPickKey(key);
    if (key === "other") {
      setOwn(true);
      setSmall(false);
      return;
    }
    setName(label);
    setOwn(false);
    const c = findContainer(key);
    setSmall(c ? labelRoomSqIn(c) < 12 : false);
    // Start with the first label option, so one tap on the container is enough.
    const first = c ? labelOptions(c)[0] : undefined;
    if (first) chooseLabel(first);
  }
  function chooseLabel(o: LabelOption) {
    const exact = o.avery.find((a) => a.shape === o.shape && a.widthIn === o.widthIn && a.heightIn === o.heightIn);
    setTemplateId(exact?.id ?? "");
    setShape(o.shape);
    setWrap(o.placement === "wrap");
    setOwn(false);
    if (o.shape === "round") setDiameter(String(o.widthIn));
    else {
      setWidth(String(o.widthIn));
      setHeight(String(o.heightIn));
    }
  }
  function pickSheet(id: string) {
    const tp = findTemplate(id);
    if (!tp) return;
    setTemplateId(tp.id);
    setShape(tp.shape);
    if (tp.shape === "round") setDiameter(String(tp.widthIn));
    else {
      setWidth(String(tp.widthIn));
      setHeight(String(tp.heightIn));
    }
  }
  const typed = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setTemplateId("");
  };

  return (
    <form action={action} className="form sizeform">
      {size && <input type="hidden" name="id" value={size.id} />}
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="label_template" value={templateId} />
      <input type="hidden" name="label_shape" value={shape} />
      {shape === "round" ? (
        <input type="hidden" name="diameter_in" value={diameter} />
      ) : (
        <>
          <input type="hidden" name="width_in" value={width} />
          <input type="hidden" name="height_in" value={height} />
        </>
      )}
      {wrap && shape === "rect" && <input type="hidden" name="label_wrap" value="1" />}
      {small && <input type="hidden" name="label_small" value="1" />}

      <div className="fld">
        <span>1. What&rsquo;s it in?</span>
        <div className="chips">
          {EASY_PICKS.map((p) => (
            <button type="button" key={p.key} className="chip" aria-pressed={pickKey === p.key} onClick={() => pickContainer(p.key, p.label)}>
              {p.label}
            </button>
          ))}
          <button type="button" className="chip" aria-pressed={pickKey === "other"} onClick={() => pickContainer("other", "")}>
            Something else
          </button>
        </div>
      </div>

      {pickKey === "other" ? (
        <label className="fld">
          <span>What do you call it?</span>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="3 oz soap bar" required maxLength={60} />
        </label>
      ) : (
        <input type="hidden" name="name" value={name} />
      )}

      {pickKey && (
        <div className="fld">
          <span>2. How much goes in one?</span>
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
          <p className="hint">Balms and butters: by weight (oz). Sprays and oils: by liquid (fl oz).</p>
        </div>
      )}

      {pickKey && (
        <div className="fld">
          <span>3. Pick a label</span>
          <div className="labelpicks">
            {options.map((o) => (
              <button type="button" key={o.placement} className="labelpick" aria-pressed={chosen(o)} onClick={() => chooseLabel(o)}>
                <PlaceIcon p={o.placement} />
                <span>
                  <b>{PLACE[o.placement].title}</b>
                  <span>
                    {sizeText(o)} · {PLACE[o.placement].count}
                  </span>
                </span>
              </button>
            ))}
            <button type="button" className="labelpick" aria-pressed={own} onClick={() => (setOwn(true), setTemplateId(""))}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 30l4-1 16-16-3-3-16 16zM23 12l3 3" />
              </svg>
              <span>
                <b>My own size</b>
                <span>Type the size, or the number on your label box</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {own && pickKey && (
        <div className="sub">
          <label className="fld narrow-fld">
            <span>Number on your label box (optional)</span>
            <input value={lookup} onChange={(e) => setLookup(e.target.value)} inputMode="numeric" placeholder="22807" maxLength={10} aria-label="Label box number" />
          </label>
          {lookup.trim() &&
            (looked ? (
              <button type="button" className="btn sm cta" onClick={() => (pickSheet(looked.id), setLookup(""))}>
                Use {looked.brand} {looked.id}: {looked.label}
              </button>
            ) : (
              <p className="hint">We don&rsquo;t know that one yet. Type the size below.</p>
            ))}
          <div className="row">
            {(["rect", "round", "oval"] as const).map((k) => (
              <label className="radio" key={k}>
                <input type="radio" checked={shape === k} onChange={() => (setShape(k), setTemplateId(""))} />{" "}
                {k === "rect" ? "Rectangle" : k === "round" ? "Round" : "Oval"}
              </label>
            ))}
          </div>
          {shape === "round" ? (
            <label className="fld">
              <span>Width across (inches)</span>
              <input value={diameter} onChange={typed(setDiameter)} inputMode="decimal" placeholder="2" maxLength={10} />
            </label>
          ) : (
            <div className="fld">
              <span>Width and height (inches)</span>
              <div className="pair">
                <input value={width} onChange={typed(setWidth)} inputMode="decimal" placeholder="3" maxLength={10} aria-label="Width in inches" />
                <input value={height} onChange={typed(setHeight)} inputMode="decimal" placeholder="2" maxLength={10} aria-label="Height in inches" />
              </div>
            </div>
          )}
          {shape === "rect" && (
            <label className="radio">
              <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> It wraps all the way around (one label, not two)
            </label>
          )}
          <label className="radio">
            <input type="checkbox" checked={small} onChange={(e) => setSmall(e.target.checked)} /> It&rsquo;s a small container (lets the
            ingredients print smaller)
          </label>
        </div>
      )}

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {pickKey && (
        <div className="row">
          <button className="btn pri sm" disabled={saving}>
            {saving ? "Saving..." : size ? "Save size" : "Add size"}
          </button>
          <button type="button" className="btn ghost sm" onClick={onDone}>
            Cancel
          </button>
        </div>
      )}
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
                      {s.label_template && ` (Avery ${s.label_template})`}
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

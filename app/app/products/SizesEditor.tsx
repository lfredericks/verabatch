"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type React from "react";
import type { FillUnit } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { FILL_UNITS, sizeFacts, type Size } from "@/lib/sizes";
import { findTemplate, LABEL_TEMPLATES, type TemplateShape } from "@/lib/labelTemplates";
import { CONTAINER_GROUPS, CONTAINERS, findContainer, labelOptions, labelRoomSqIn, type Container, type LabelOption } from "@/lib/containers";

/** "2 oz jar" from a container, for the size name. */
function shortName(c: Container): string {
  const noun =
    c.group === "Jars" ? "jar" : c.group === "Tins" ? "tin" : c.group === "Bottles" ? "bottle" : c.group === "Droppers" ? "dropper bottle" : c.group === "Tubes" ? "tube" : c.key.includes("tin") ? "candle tin" : "candle jar";
  return `${c.holds.replace(" fl oz", " oz")} ${noun}`;
}

const SHAPE_GROUPS: { shape: TemplateShape; square?: boolean; label: string }[] = [
  { shape: "round", label: "Round" },
  { shape: "rect", square: true, label: "Square" },
  { shape: "oval", label: "Oval" },
  { shape: "rect", square: false, label: "Rectangle" },
];
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
  const [shape, setShape] = useState<TemplateShape>(size?.label_shape ?? "rect");
  const n = (v: number | null | undefined) => (v ? String(Number(v)) : "");
  const [templateId, setTemplateId] = useState(size?.label_template ?? "");
  const [width, setWidth] = useState(n(size?.width_in));
  const [height, setHeight] = useState(n(size?.height_in));
  const [diameter, setDiameter] = useState(n(size?.diameter_in));
  const [lookup, setLookup] = useState("");
  const [wrap, setWrap] = useState(Boolean(size?.label_wrap));
  const [small, setSmall] = useState(Boolean(size?.label_small));
  const [name, setName] = useState(size?.name ?? "");
  const [containerKey, setContainerKey] = useState("");
  const container = findContainer(containerKey);
  const options = container ? labelOptions(container) : [];
  const template = findTemplate(templateId);
  const looked = lookup.trim() ? findTemplate(lookup) : null;

  function pick(id: string) {
    setTemplateId(id);
    const tp = findTemplate(id);
    if (!tp) return;
    setShape(tp.shape);
    if (tp.shape === "round") setDiameter(String(tp.widthIn));
    else {
      setWidth(String(tp.widthIn));
      setHeight(String(tp.heightIn));
    }
  }
  function applyOption(o: LabelOption) {
    const exact = o.avery.find((a) => a.shape === o.shape && a.widthIn === o.widthIn && a.heightIn === o.heightIn);
    setTemplateId(exact?.id ?? "");
    setShape(o.shape);
    setWrap(o.placement === "wrap");
    if (o.shape === "round") setDiameter(String(o.widthIn));
    else {
      setWidth(String(o.widthIn));
      setHeight(String(o.heightIn));
    }
  }
  // Typing dimensions by hand means it's no longer that sheet.
  const typed = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setTemplateId("");
  };

  return (
    <form action={action} className="form sizeform">
      {size && <input type="hidden" name="id" value={size.id} />}
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="label_template" value={templateId} />
      <label className="fld">
        <span>Size name</span>
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="2 oz jar" required maxLength={60} />
      </label>
      <div className="sub">
        <label className="fld">
          <span>What container? (optional)</span>
          <select
            value={containerKey}
            onChange={(e) => {
              setContainerKey(e.target.value);
              const c = findContainer(e.target.value);
              if (c && !name.trim()) setName(shortName(c));
              if (c) setSmall(labelRoomSqIn(c) < 12);
            }}
            aria-label="Container"
          >
            <option value="">Pick one to see the labels that fit</option>
            {CONTAINER_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {CONTAINERS.filter((c) => c.group === g).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {container && (
          <>
            <p className="hint">
              Tap a label size to use it.{container.note ? ` ${container.note}` : ""}
            </p>
            <div className="stack">
              {options.map((o) => (
                <button type="button" key={o.text} className="btn sm cta" onClick={() => applyOption(o)}>
                  {o.text}
                  {o.avery.length > 0 ? ` (Avery ${o.avery.map((a) => a.id).join(", ")} fits)` : ""}
                </button>
              ))}
            </div>
            <p className="hint">
              Sizes from{" "}
              <a href={container.source.url} target="_blank" rel="noopener">
                {container.source.name}
              </a>
              . Yours may differ, so measure the flat band where the label goes.
            </p>
          </>
        )}
      </div>
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
      <div className="sub">
        <label className="fld">
          <span>Label sheet you buy (optional)</span>
          <select value={templateId} onChange={(e) => pick(e.target.value)} aria-label="Label sheet">
            <option value="">None, or I&rsquo;ll type the size</option>
            {SHAPE_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {LABEL_TEMPLATES.filter((tp) => tp.shape === g.shape && (g.square === undefined || (tp.widthIn === tp.heightIn) === g.square)).map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.brand} {tp.id}: {tp.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="fld narrow-fld">
          <span>Or type the number on your box</span>
          <input value={lookup} onChange={(e) => setLookup(e.target.value)} inputMode="numeric" placeholder="22807" maxLength={10} aria-label="Avery number" />
        </label>
        {lookup.trim() &&
          (looked ? (
            looked.id !== templateId ? (
              <button type="button" className="btn sm cta" onClick={() => (pick(looked.id), setLookup(""))}>
                Use {looked.brand} {looked.id}: {looked.label}
              </button>
            ) : null
          ) : (
            <p className="hint">We don&rsquo;t have that one yet. Type the label size below instead.</p>
          ))}
        {template && (
          <p className="ok-soft rstatus">
            {template.brand} {template.id}: {template.label}
            {template.alsoFits.length > 0 && ` (same sheet as ${template.alsoFits.slice(0, 4).join(", ")}${template.alsoFits.length > 4 ? "…" : ""})`}
          </p>
        )}
      </div>
      <fieldset className="fld">
        <span>Front label shape</span>
        <div className="row">
          {(["rect", "round", "oval"] as const).map((k) => (
            <label className="radio" key={k}>
              <input
                type="radio"
                name="label_shape"
                value={k}
                checked={shape === k}
                onChange={() => (setShape(k), setTemplateId(""))}
              />{" "}
              {k === "rect" ? "Rectangle or square" : k === "round" ? "Round" : "Oval"}
            </label>
          ))}
        </div>
      </fieldset>
      {shape === "round" ? (
        <label className="fld">
          <span>Width across (inches)</span>
          <input name="diameter_in" value={diameter} onChange={typed(setDiameter)} inputMode="decimal" placeholder="2" maxLength={10} />
        </label>
      ) : (
        <div className="fld">
          <span>Width and height (inches)</span>
          <div className="pair">
            <input name="width_in" value={width} onChange={typed(setWidth)} inputMode="decimal" placeholder="3" maxLength={10} aria-label="Width in inches" />
            <input name="height_in" value={height} onChange={typed(setHeight)} inputMode="decimal" placeholder="2" maxLength={10} aria-label="Height in inches" />
          </div>
        </div>
      )}
      <label className="radio">
        <input type="checkbox" name="label_small" value="1" checked={small} onChange={(e) => setSmall(e.target.checked)} /> Small container: less than
        12 sq in of room for labels, all the way around
      </label>
      <p className="hint">
        Then the law allows ingredient letters half as tall (1/32 in), so long ingredient lists fit. Most 2 oz jars, 1 oz bottles, droppers and lip
        tubes qualify. Picking a container above ticks this for you; check it against your own container.
      </p>
      {shape === "rect" && (
        <label className="radio">
          <input type="checkbox" name="label_wrap" value="1" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> One wraparound label
          (front and back on one strip)
        </label>
      )}
      <p className="hint">
        {wrap && shape === "rect"
          ? "The whole strip. The front takes the left 40%, the ingredients and warnings the rest."
          : "The front label. The back prints the same size. Optional, but it sets the smallest letter size allowed for the net weight."}
      </p>
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

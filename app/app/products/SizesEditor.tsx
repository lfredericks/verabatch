"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type React from "react";
import type { FillUnit } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { FILL_UNITS, sizeFacts, type Size } from "@/lib/sizes";
import { findTemplate, type TemplateShape } from "@/lib/labelTemplates";
import { EASY_PICKS, PICK_TABS, findContainer, labelOptions, labelRoomSqIn, type ContainerLook, type LabelOption, type PickTab } from "@/lib/containers";
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

/** A drawing of the container, with its label shown dashed. Colors come from the theme. */
function ContainerArt({ look }: { look: ContainerLook }) {
  const body = { fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 2 };
  const label = { fill: "var(--accent-soft)", stroke: "var(--accent)", strokeWidth: 1.5, strokeDasharray: "3 2" };
  return (
    <svg width="76" height="76" viewBox="0 0 84 84" aria-hidden="true">
      {look === "jar" && (
        <>
          <rect x="16" y="22" width="52" height="12" rx="4" fill="var(--ink)" />
          <path d="M20 34h44v28a8 8 0 01-8 8H28a8 8 0 01-8-8z" {...body} />
          <rect x="27" y="42" width="30" height="18" rx="3" {...label} />
        </>
      )}
      {look === "tin" && (
        <>
          <circle cx="42" cy="42" r="30" {...body} />
          <circle cx="42" cy="42" r="19" {...label} />
        </>
      )}
      {look === "bottle" && (
        <>
          <rect x="35" y="8" width="14" height="12" rx="2" fill="var(--ink)" />
          <path d="M37 20h10v6l9 7v39a4 4 0 01-4 4H32a4 4 0 01-4-4V33l9-7z" {...body} />
          <rect x="32" y="42" width="20" height="24" rx="2" {...label} />
        </>
      )}
      {look === "dropper" && (
        <>
          <path d="M39 6h6v6h-6z" fill="var(--ink)" />
          <rect x="35" y="12" width="14" height="14" rx="2" fill="var(--ink)" />
          <path d="M37 26h10l5 6v38a4 4 0 01-4 4H36a4 4 0 01-4-4V32z" {...body} />
          <rect x="35" y="44" width="14" height="20" rx="2" {...label} />
        </>
      )}
      {look === "tube" && (
        <>
          <rect x="34" y="10" width="16" height="14" rx="3" fill="var(--ink)" />
          <rect x="34" y="24" width="16" height="50" rx="3" {...body} />
          <rect x="36" y="32" width="12" height="34" rx="2" {...label} />
        </>
      )}
      {look === "candle-tin" && (
        <>
          <path d="M14 38h56v22a6 6 0 01-6 6H20a6 6 0 01-6-6z" {...body} />
          <path d="M42 22c4 5 4 9 0 12-4-3-4-7 0-12z" fill="var(--accent)" />
          <rect x="18" y="44" width="48" height="14" rx="2" {...label} />
        </>
      )}
      {look === "candle-jar" && (
        <>
          <path d="M22 26h40v42a6 6 0 01-6 6H28a6 6 0 01-6-6z" {...body} />
          <path d="M42 10c4 5 4 9 0 12-4-3-4-7 0-12z" fill="var(--accent)" />
          <rect x="27" y="40" width="30" height="22" rx="3" {...label} />
        </>
      )}
    </svg>
  );
}

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

type Step = "container" | "label" | "amount" | "own";

/**
 * Adding or changing a size, one question at a time (the approved Container screen):
 * 1. what it goes in (picture tiles), 2. which label, 3. how much goes in one.
 * "My container isn't here" opens the typed-in version.
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
  const known = EASY_PICKS.find((p) => p.label === size?.name);
  const [step, setStep] = useState<Step>(size && !known ? "own" : "container");
  const [tab, setTab] = useState<PickTab>(known?.tab ?? "Jars");
  const [pickKey, setPickKey] = useState(known?.key ?? "");
  const [name, setName] = useState(size?.name ?? "");
  const [amount, setAmount] = useState(size?.fill_amount ?? "");
  const [unit, setUnit] = useState<FillUnit>(size?.fill_unit ?? defaultUnit);
  const [shape, setShape] = useState<TemplateShape>(size?.label_shape ?? "rect");
  const [templateId, setTemplateId] = useState(size?.label_template ?? "");
  const [width, setWidth] = useState(n(size?.width_in));
  const [height, setHeight] = useState(n(size?.height_in));
  const [diameter, setDiameter] = useState(n(size?.diameter_in));
  const [wrap, setWrap] = useState(Boolean(size?.label_wrap));
  const [small, setSmall] = useState(Boolean(size?.label_small));
  const [lookup, setLookup] = useState("");
  const pick = EASY_PICKS.find((p) => p.key === pickKey);
  const container = pick ? findContainer(pick.key) : undefined;
  const options = container ? labelOptions(container) : [];
  const looked = lookup.trim() ? findTemplate(lookup) : null;
  const chosen = (o: LabelOption) =>
    shape === o.shape &&
    (o.shape === "round" ? Number(diameter) === o.widthIn : Number(width) === o.widthIn && Number(height) === o.heightIn) &&
    wrap === (o.placement === "wrap");

  function chooseLabel(o: LabelOption) {
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
  function choosePick(key: string) {
    const p = EASY_PICKS.find((x) => x.key === key);
    const c = p ? findContainer(p.key) : undefined;
    if (!p || !c) return;
    setPickKey(key);
    setName(p.label);
    setSmall(labelRoomSqIn(c) < 12);
    const first = labelOptions(c)[0];
    if (first) chooseLabel(first);
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
  const back = (to: Step) => (
    <button type="button" className="backlink" onClick={() => setStep(to)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      Back
    </button>
  );

  return (
    <form action={action} className="form sizeform">
      {size && <input type="hidden" name="id" value={size.id} />}
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="fill_amount" value={amount} />
      <input type="hidden" name="fill_unit" value={unit} />
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

      {step === "container" && (
        <>
          <p className="step-q">What does it go in?</p>
          <div className="seg seg-5" role="group" aria-label="Kind of container">
            {PICK_TABS.map((t) => (
              <button type="button" key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="tiles">
            {EASY_PICKS.filter((p) => p.tab === tab).map((p) => {
              const c = findContainer(p.key);
              const first = c ? labelOptions(c)[0] : undefined;
              return (
                <button type="button" key={p.key} className="tile" aria-pressed={pickKey === p.key} onClick={() => choosePick(p.key)}>
                  <span className="tile-art">
                    <ContainerArt look={p.look} />
                  </span>
                  <b>{p.label}</b>
                  {first && <span>{sizeText(first)} label</span>}
                </button>
              );
            })}
          </div>
          <button type="button" className="linkbtn" onClick={() => setStep("own")}>
            My container isn&rsquo;t here: type my own size
          </button>
          <button type="button" className="bigbtn bigbtn-pri" disabled={!pick} onClick={() => setStep("label")}>
            {pick ? `Use ${pick.label}` : "Pick a container"}
          </button>
          <button type="button" className="btn ghost sm" onClick={onDone}>
            Cancel
          </button>
        </>
      )}

      {step === "label" && pick && (
        <>
          {back("container")}
          <p className="step-q">Which label for your {pick.label}?</p>
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
          </div>
          <button type="button" className="linkbtn" onClick={() => setStep("own")}>
            Use a different label size
          </button>
          <button type="button" className="bigbtn bigbtn-pri" onClick={() => setStep("amount")}>
            Next
          </button>
        </>
      )}

      {step === "amount" && (
        <>
          {back(pick ? "label" : "own")}
          <p className="step-q">How much goes in one{pick ? ` ${pick.label}` : ""}?</p>
          <div className="pair">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="2" required maxLength={20} aria-label="Fill amount" autoFocus />
            <select value={unit} onChange={(e) => setUnit(e.target.value as FillUnit)} aria-label="Fill unit">
              {FILL_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <p className="hint">Balms and butters: by weight (oz). Sprays and oils: by liquid (fl oz). This is the net weight on the label.</p>
          {state.error && (
            <p className="error" role="alert">
              {state.error}
            </p>
          )}
          <button className="bigbtn bigbtn-pri" disabled={saving || !amount.trim()}>
            {saving ? "Saving..." : size ? "Save size" : "Add size"}
          </button>
        </>
      )}

      {step === "own" && (
        <>
          {back(pick ? "label" : "container")}
          <p className="step-q">Your label size</p>
          {!pick && (
            <label className="fld">
              <span>What do you call this size?</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="3 oz soap bar" maxLength={60} />
            </label>
          )}
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
          <div className="seg seg-3" role="group" aria-label="Label shape">
            {(["rect", "round", "oval"] as const).map((k) => (
              <button type="button" key={k} aria-pressed={shape === k} onClick={() => (setShape(k), setTemplateId(""))}>
                {k === "rect" ? "Rectangle" : k === "round" ? "Round" : "Oval"}
              </button>
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
            <input type="checkbox" checked={small} onChange={(e) => setSmall(e.target.checked)} /> It&rsquo;s a small container (lets the ingredients
            print smaller)
          </label>
          <button type="button" className="bigbtn bigbtn-pri" disabled={!name.trim()} onClick={() => setStep("amount")}>
            Next
          </button>
          {!pick && (
            <button type="button" className="btn ghost sm" onClick={onDone}>
              Cancel
            </button>
          )}
        </>
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

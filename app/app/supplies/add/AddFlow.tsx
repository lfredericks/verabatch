"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addDelivery, type AddState } from "../materialActions";

const UNITS = [
  { key: "lb", label: "pounds" },
  { key: "oz", label: "ounces" },
  { key: "g", label: "grams" },
  { key: "floz", label: "fl oz" },
  { key: "ml", label: "mL" },
  { key: "each", label: "each" },
];

interface Option {
  id: string;
  name: string;
  onHand: string;
}

/**
 * Add a supply, one question per screen (Duolingo): What did you get? How much came in?
 * Where's it from? Matches you already have show first, so nothing gets added twice.
 */
export function AddFlow({ materials, shops, start }: { materials: Option[]; shops: string[]; start: Option | null }) {
  const [state, action, saving] = useActionState<AddState, FormData>(addDelivery, {});
  const [step, setStep] = useState(start ? 1 : 0);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Option | null>(start);
  const [newName, setNewName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("lb");
  const [shop, setShop] = useState("");
  const [otherShop, setOtherShop] = useState(false);
  const [details, setDetails] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = q ? materials.filter((m) => m.name.toLowerCase().includes(q) || q.split(/\s+/).some((w) => w.length > 2 && m.name.toLowerCase().includes(w))) : [];
  const title = picked?.name ?? newName;
  const steps = 3;
  const back = () => setStep((s) => Math.max(start ? 1 : 0, s - 1));

  return (
    <form action={action} className="ob-q add-flow">
      <input type="hidden" name="material_id" value={picked?.id ?? ""} />
      <input type="hidden" name="name" value={picked ? "" : newName} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="unit" value={unit} />
      <input type="hidden" name="supplier" value={shop} />

      <div className="ob-top">
        {step > (start ? 1 : 0) ? (
          <button type="button" className="ob-icon" aria-label="Back" onClick={back}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : (
          <Link href="/app/supplies" className="ob-icon" aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        )}
        <div className="ob-bar" aria-hidden="true">
          <div style={{ width: `${((step + 1) / steps) * 100}%` }} />
        </div>
        <span className="ob-count">
          {step + 1} of {steps}
        </span>
      </div>

      {step === 0 && (
        <>
          <h1>What did you get?</h1>
          <label className="fld">
            <span>Call it what you call it</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Unrefined shea" autoFocus maxLength={120} />
          </label>
          {matches.length > 0 && (
            <>
              <p className="hint">You already have</p>
              <ul className="rows">
                {matches.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <button type="button" className="rowbtn" onClick={() => (setPicked(m), setNewName(""), setStep(1))}>
                      <span className="row-main">
                        <b>{m.name}</b>
                        <span>{m.onHand ? `${m.onHand} on hand. Add this delivery to it.` : "Add this delivery to it."}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {q && (
            <button type="button" className="tile tile-dashed" onClick={() => (setPicked(null), setNewName(query.trim()), setStep(1))}>
              <b>Add as something new</b>
            </button>
          )}
          {matches.length > 0 && <p className="hint">Same thing from a different shop? Pick the one you already have. You never add it twice.</p>}
        </>
      )}

      {step === 1 && (
        <>
          <p className="eyebrow">{title}</p>
          <h1>How much came in?</h1>
          <label className="fld">
            <span>Amount</span>
            <input className="big-input" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d./ ]/g, ""))} inputMode="decimal" placeholder="1" maxLength={20} />
          </label>
          <div className="unit-tiles" role="group" aria-label="Unit">
            {UNITS.map((u) => (
              <button key={u.key} type="button" className="ob-tile" aria-pressed={unit === u.key} onClick={() => setUnit(u.key)}>
                {u.label}
              </button>
            ))}
          </div>
          <p className="hint">Not sure? Leave it empty. It just won&rsquo;t count down.</p>
          <button type="button" className="btn pri big ob-go" onClick={() => setStep(2)}>
            Continue
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="eyebrow">
            {title}
            {amount ? ` · ${amount} ${UNITS.find((u) => u.key === unit)?.label ?? ""}` : ""}
          </p>
          <h1>Where&rsquo;s it from?</h1>
          <div className="tiles2" role="group" aria-label="Shop">
            {shops.slice(0, 6).map((sname) => (
              <button key={sname} type="button" className="ob-tile" aria-pressed={!otherShop && shop === sname} onClick={() => (setShop(sname), setOtherShop(false))}>
                {sname}
              </button>
            ))}
            <button type="button" className="ob-tile" aria-pressed={otherShop} onClick={() => (setOtherShop(true), setShop(""))}>
              Somewhere new
            </button>
            <button type="button" className="ob-tile" aria-pressed={!otherShop && shop === "" } onClick={() => (setShop(""), setOtherShop(false))}>
              Skip
            </button>
          </div>
          {otherShop && (
            <label className="fld">
              <span>Shop name</span>
              <input value={shop} onChange={(e) => setShop(e.target.value)} maxLength={120} placeholder="Mountain Rose Herbs" autoFocus />
            </label>
          )}
          {details ? (
            <>
              <label className="fld">
                <span>Lot number, if it&rsquo;s on the container</span>
                <input name="supplier_lot" maxLength={60} />
              </label>
              <div className="inv-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <label className="fld">
                  <span>Came in</span>
                  <input type="date" name="received_on" />
                </label>
                <label className="fld">
                  <span>Best by</span>
                  <input type="date" name="best_by" />
                </label>
              </div>
              <label className="radio">
                <input type="checkbox" name="organic" value="1" /> Certified organic
              </label>
            </>
          ) : (
            <button type="button" className="linkbtn" onClick={() => setDetails(true)}>
              + Add details: lot number, best-by date, organic
            </button>
          )}
          {state.error && (
            <p className="error" role="alert">
              {state.error}
            </p>
          )}
          <button className="btn pri big ob-go" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      )}
    </form>
  );
}

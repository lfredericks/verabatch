"use client";

import Link from "next/link";
import { startTransition, useMemo, useState, type ReactNode } from "react";
import { computeRecipe } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { createBusiness } from "./actions";
import { saveProduct } from "./products/actions";
import { blankRow, RecipeLines, rowsToLines, type Row } from "./products/RecipeLines";

const pack = activePack();

/**
 * "What do you make?" tiles. A tile with more than one product type asks "Which kind?"
 * on the next screen; a tile with one type skips it. Icons follow the approved
 * Onboarding concept (Screen Concepts).
 */
const GROUPS: { key: string; label: string; types: string[]; icon: ReactNode }[] = [
  {
    key: "balms",
    label: "Balms and salves",
    types: ["salve", "balm", "deodorant"],
    icon: (
      <>
        <rect x="6" y="9" width="22" height="5" rx="2" />
        <path d="M8 14v12a3 3 0 003 3h12a3 3 0 003-3V14" />
      </>
    ),
  },
  {
    key: "butters",
    label: "Butters and lotions",
    types: ["butter", "lotion"],
    icon: (
      <>
        <path d="M9 8h16l2 6H7z" />
        <path d="M8 14v12a3 3 0 003 3h12a3 3 0 003-3V14" />
        <path d="M13 20h8" />
      </>
    ),
  },
  {
    key: "oils",
    label: "Oils and serums",
    types: ["oil", "face", "hair", "perfume"],
    icon: (
      <>
        <path d="M15 4h4v5h-4z" />
        <path d="M13 9h8l2 5v13a3 3 0 01-3 3h-6a3 3 0 01-3-3V14z" />
        <path d="M17 17c1.5 2 2 3 0 5-2-2-1.5-3 0-5z" />
      </>
    ),
  },
  {
    key: "soap",
    label: "Soap",
    types: ["soap", "shampoo", "conditioner"],
    icon: (
      <>
        <rect x="6" y="11" width="22" height="14" rx="4" />
        <path d="M11 17h12" />
      </>
    ),
  },
  {
    key: "bath",
    label: "Bath and scrubs",
    types: ["scrub", "salts", "bomb"],
    icon: (
      <>
        <path d="M5 16h24v3a8 8 0 01-8 8h-8a8 8 0 01-8-8z" />
        <circle cx="12" cy="10" r="2" />
        <circle cx="19" cy="7" r="2.5" />
      </>
    ),
  },
  {
    key: "sprays",
    label: "Sprays and mists",
    types: ["mist", "room"],
    icon: (
      <>
        <path d="M14 4h6v5h-6z" />
        <path d="M20 6h5" />
        <path d="M12 9h10v4H12z" />
        <rect x="10" y="13" width="14" height="17" rx="3" />
      </>
    ),
  },
  {
    key: "candles",
    label: "Candles and melts",
    types: ["candle"],
    icon: (
      <>
        <path d="M17 4c2 3 3 5 0 8-3-3-2-5 0-8z" />
        <path d="M17 12v4" />
        <rect x="8" y="16" width="18" height="13" rx="3" />
      </>
    ),
  },
  {
    key: "other",
    label: "Something else",
    types: ["other"],
    icon: (
      <>
        <circle cx="17" cy="17" r="11" />
        <path d="M17 12v10M12 17h10" />
      </>
    ),
  },
];

type Step = "shop" | "place" | "contact" | "make" | "kind" | "name" | "recipe";

/**
 * First run and "Add a product": one question per screen (approved Onboarding concept).
 * With no business yet it starts with the shop questions; then what you make, its name,
 * and the recipe. Saving lands on the product page, where the container picker is next.
 */
export function Onboarding({ needsBusiness }: { needsBusiness: boolean }) {
  // Shop
  const [shop, setShop] = useState("");
  const [place, setPlace] = useState("");
  const [contact, setContact] = useState("");
  const [haveBusiness, setHaveBusiness] = useState(!needsBusiness);
  // Product
  const [group, setGroup] = useState("");
  const [typeKey, setTypeKey] = useState("");
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [identityOpen, setIdentityOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => [blankRow(), blankRow(), blankRow()]);
  const [makes, setMakes] = useState("");

  const [step, setStep] = useState<Step>(needsBusiness ? "shop" : "make");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const g = GROUPS.find((x) => x.key === group);
  const kinds = g ? g.types.map((k) => pack.productTypes.find((t) => t.key === k)).filter((t) => !!t) : [];
  const steps: Step[] = [
    ...(needsBusiness ? (["shop", "place", "contact"] as Step[]) : []),
    "make",
    ...(kinds.length > 1 ? (["kind"] as Step[]) : []),
    "name",
    "recipe",
  ];
  const at = Math.max(0, steps.indexOf(step));
  const lines = useMemo(() => rowsToLines(rows), [rows]);
  const recipe = useMemo(() => computeRecipe(lines, pack), [lines]);
  const hasRecipe = lines.some((l) => l.text.trim());

  function go(to: Step) {
    setError("");
    setStep(to);
    window.scrollTo(0, 0);
  }
  function next() {
    go(steps[at + 1]!);
  }
  function back() {
    if (at > 0) go(steps[at - 1]!);
  }
  function pickType(key: string) {
    setTypeKey(key);
    setIdentity(pack.productTypes.find((t) => t.key === key)?.identity ?? "");
  }
  function pickGroup(key: string) {
    setGroup(key);
    const gr = GROUPS.find((x) => x.key === key)!;
    // One kind: pick it now. Several: keep a kind only if it's in this group.
    if (gr.types.length === 1) pickType(gr.types[0]!);
    else if (!gr.types.includes(typeKey)) (setTypeKey(""), setIdentity(""));
  }

  async function saveShop() {
    if (haveBusiness) return next();
    setBusy(true);
    const fd = new FormData();
    fd.set("name", shop);
    fd.set("city_state_zip", place);
    fd.set("contact", contact);
    const r = await createBusiness({}, fd);
    setBusy(false);
    if (r.error) return setError(r.error);
    setHaveBusiness(true);
    next();
  }
  function saveAll() {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("mode", "master");
    fd.set("name", name.trim());
    fd.set("type_key", typeKey);
    fd.set("identity", identity.trim());
    fd.set("makes", makes);
    fd.set("recipe", JSON.stringify(lines.filter((l) => l.text.trim() || l.amount.trim())));
    // On success the server sends the maker to the container question, then the label.
    startTransition(async () => {
      const r = await saveProduct({}, fd);
      setBusy(false);
      if (r?.error) setError(r.error);
    });
  }

  let body: ReactNode;
  let action: { label: string; onClick: () => void; disabled?: boolean };

  if (step === "shop") {
    body = (
      <Question title="What's your shop called?" lead="It goes on every label, as the maker.">
        <input
          aria-label="Shop name"
          className="big-input"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          placeholder="Your shop name"
          maxLength={120}
          autoFocus
        />
      </Question>
    );
    action = { label: "Continue", onClick: next, disabled: !shop.trim() };
  } else if (step === "place") {
    body = (
      <Question title="Where are you based?" lead="Labels need the city, state and ZIP of the maker.">
        <input
          aria-label="City, state and ZIP"
          className="big-input"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Anderson, IN 46011"
          maxLength={120}
          autoComplete="address-level2"
          autoFocus
        />
      </Question>
    );
    action = { label: "Continue", onClick: next, disabled: !place.trim() };
  } else if (step === "contact") {
    body = (
      <Question
        title="How can customers reach you?"
        lead="A website, email or phone. Labels need a way to contact you about a reaction."
      >
        <input
          aria-label="Website, email or phone"
          className="big-input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="yourshop.com"
          maxLength={200}
          autoFocus
        />
      </Question>
    );
    action = { label: busy ? "Saving..." : "Continue", onClick: saveShop, disabled: busy || !contact.trim() };
  } else if (step === "make") {
    body = (
      <Question
        title={needsBusiness ? "What do you make?" : "What are you making?"}
        lead="Pick your product. We'll set up the right label rules for it."
      >
        <div className="ob-tiles" role="group" aria-label="Kind of product">
          {GROUPS.map((x) => (
            <button key={x.key} type="button" className="ob-tile" aria-pressed={group === x.key} onClick={() => pickGroup(x.key)}>
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {x.icon}
              </svg>
              {x.label}
            </button>
          ))}
        </div>
      </Question>
    );
    action = { label: "Continue", onClick: next, disabled: !group };
  } else if (step === "kind") {
    body = (
      <Question title="Which kind?" lead={g?.label}>
        <div className="kinds" role="group" aria-label="Which kind">
          {kinds.map((t) => (
            <button key={t.key} type="button" className="kind" aria-pressed={typeKey === t.key} onClick={() => pickType(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </Question>
    );
    action = { label: "Continue", onClick: next, disabled: !typeKey };
  } else if (step === "name") {
    body = (
      <Question title="What's it called?" lead="The product name, as it goes on the front of the label.">
        <input
          aria-label="Product name"
          className="big-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lavender Body Butter"
          maxLength={120}
          autoFocus
        />
        {identityOpen || typeKey === "other" ? (
          <label className="fld">
            <span>What it is, under the name (required on cosmetic labels)</span>
            <input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Botanical Skin Balm" maxLength={120} />
          </label>
        ) : (
          identity && (
            <p className="hint">
              Under the name it says <b>{identity}</b>.{" "}
              <button type="button" className="linkish" onClick={() => setIdentityOpen(true)}>
                Change
              </button>
            </p>
          )
        )}
      </Question>
    );
    action = { label: "Continue", onClick: next, disabled: !name.trim() || (typeKey === "other" && !identity.trim()) };
  } else {
    body = (
      <Question title="Your recipe" lead={`${name || "Your product"}: type it the way you make it, any units.`}>
        <RecipeLines rows={rows} setRows={setRows} onChange={() => setError("")} startOpen onMakes={(n) => setMakes(String(n))} />
        {hasRecipe && (
          <div className="makes">
            <label htmlFor="ob-makes">This batch makes</label>
            <div className="stepper">
              <button
                type="button"
                aria-label="One fewer"
                onClick={() => setMakes((m) => String(Math.max(1, (Number(m) || 1) - 1)))}
                disabled={!makes || Number(makes) <= 1}
              >
                &minus;
              </button>
              <input
                id="ob-makes"
                inputMode="numeric"
                value={makes}
                onChange={(e) => setMakes(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
                placeholder="?"
              />
              <button type="button" aria-label="One more" onClick={() => setMakes((m) => String((Number(m) || 0) + 1))}>
                +
              </button>
            </div>
          </div>
        )}
        {recipe.needsChoice.length > 0 && (
          <p className="hint">Answer the highlighted questions now, or later from the product page.</p>
        )}
      </Question>
    );
    action = { label: busy ? "Saving..." : "Save and continue", onClick: saveAll, disabled: busy || !hasRecipe };
  }

  return (
    <div
      className="ob"
      // Enter in a text box works like the big button.
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          if (!action.disabled) action.onClick();
        }
      }}
    >
      <div className="ob-top">
        {at > 0 ? (
          <button type="button" className="ob-icon" aria-label="Back" onClick={back}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : !needsBusiness ? (
          <Link href="/app" className="ob-icon" aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        ) : (
          <span className="ob-icon" aria-hidden="true" />
        )}
        <div className="ob-bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={at + 1} aria-label="Progress">
          <div style={{ width: `${((at + 1) / steps.length) * 100}%` }} />
        </div>
        <span className="ob-count">
          {at + 1} of {steps.length}
        </span>
      </div>

      {body}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="btn pri big ob-go" onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </button>
    </div>
  );
}

function Question({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <div className="ob-q">
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </div>
  );
}

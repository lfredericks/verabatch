"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { computeRecipe, type RecipeLine } from "@/lib/core";
import { claimsFor, everydayName, type OrganicStatus, type ProductClaims } from "@/lib/frontClaims";
import { activePack } from "@/lib/packs";
import { saveClaims, type ClaimsState } from "./actions";

const pack = activePack();
const OPTIONS = pack.frontClaims ?? [];

/**
 * Front-of-label claims: simple ones as checkboxes, each checked against the recipe,
 * and organic, which depends on how much of the recipe is organic and on certification.
 * Save shows only after a change (Leslie's rule for the recipe screen).
 */
export function Claims({
  productId,
  claims,
  recipe,
  productName,
  identity,
}: {
  productId: string;
  claims: ProductClaims;
  recipe: RecipeLine[];
  productName: string;
  identity: string;
}) {
  const [state, action, saving] = useActionState<ClaimsState, FormData>(saveClaims, {});
  const [c, setC] = useState<ProductClaims>(claims);
  const [dirty, setDirty] = useState(false);

  const computed = useMemo(() => computeRecipe(recipe, pack), [recipe]);
  const result = useMemo(() => claimsFor(c, computed, pack, { productName, identity }), [c, computed, productName, identity]);
  const org = result.organic;
  const canClaim = c.organic.status === "certified" || c.organic.status === "exempt";
  const notesFor = (key: string) => result.notes.filter((n) => n.key === key);

  function change(next: ProductClaims) {
    setC(next);
    setDirty(true);
  }
  function toggle(key: string, on: boolean) {
    const keys = on ? [...c.keys, key] : c.keys.filter((k) => k !== key);
    change({ ...c, keys });
  }
  function setOrganic(patch: Partial<ProductClaims["organic"]>) {
    change({ ...c, organic: { ...c.organic, ...patch } });
  }
  function toggleMadeWith(key: string, on: boolean) {
    const list = on ? [...c.organic.madeWith, key].slice(0, 3) : c.organic.madeWith.filter((k) => k !== key);
    setOrganic({ madeWith: list });
  }

  return (
    <form
      className="card form"
      aria-labelledby="claims"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setDirty(false);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <input type="hidden" name="claims" value={JSON.stringify(c)} />
      <h2 id="claims">Label claims (optional)</h2>
      <p className="hint">Short lines on the front, under what it is. Print only what&rsquo;s true and you can back up.</p>

      <fieldset className="fld">
        <legend>On the front</legend>
        {OPTIONS.map((o) => {
          const on = c.keys.includes(o.key);
          return (
            <div key={o.key} className="claim-opt">
              <label className="radio">
                <input type="checkbox" checked={on} onChange={(e) => toggle(o.key, e.target.checked)} />
                <span>{o.label}</span>
              </label>
              {o.hint && <p className="hint">{o.hint}</p>}
              {on &&
                notesFor(o.key).map((n) => (
                  <p key={n.text} className={n.level === "stop" ? "note" : "hint"} role={n.level === "stop" ? "alert" : undefined}>
                    {n.text}
                  </p>
                ))}
            </div>
          );
        })}
      </fieldset>

      <fieldset className="fld">
        <legend>Organic</legend>
        <p className="hint">
          {org.lines.length ? (
            <>
              This recipe is about <b>{org.pct}% organic</b> by weight (water and salt don&rsquo;t count).
              {org.approximate && " Close, not exact: cups, spoons and drops are turned into weight with typical values."}
            </>
          ) : (
            <>No ingredients marked organic yet. In the recipe, tap a line and tick &ldquo;Certified organic&rdquo; for each one your supplier certifies.</>
          )}
        </p>
        {org.lines.length > 0 && (
          <p className="hint">Marked ingredients print as &ldquo;Organic ...&rdquo; in the ingredient list.</p>
        )}

        <div className="fld" role="radiogroup" aria-label="Organic certification">
          {(
            [
              ["no", "I'm not certified organic"],
              ["exempt", "Not certified: my organic sales are $5,000 a year or less"],
              ["certified", "My business is certified organic"],
            ] as [OrganicStatus, string][]
          ).map(([v, t]) => (
            <label key={v} className="radio">
              <input type="radio" name="org-status" checked={c.organic.status === v} onChange={() => setOrganic({ status: v })} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        {c.organic.status === "certified" && (
          <label className="fld">
            <span>Your certifier (prints as &ldquo;Certified organic by ...&rdquo;)</span>
            <input value={c.organic.certifier} onChange={(e) => setOrganic({ certifier: e.target.value })} placeholder="Indiana Certified Organic" maxLength={100} />
          </label>
        )}

        {canClaim && org.lines.length > 0 && (
          <label className="radio">
            <input type="checkbox" checked={c.organic.front} onChange={(e) => setOrganic({ front: e.target.checked })} />
            <span>
              {org.tier === "organic"
                ? "Say “Organic” on the front"
                : org.tier === "madeWith"
                  ? "Say “Made with organic ...” on the front"
                  : "Put an organic claim on the front"}
            </span>
          </label>
        )}
        {canClaim && c.organic.front && org.tier === "madeWith" && (
          <fieldset className="fld">
            <legend>Name up to three organic ingredients</legend>
            {org.lines.map((l) => (
              <label key={l.key} className="radio">
                <input
                  type="checkbox"
                  checked={c.organic.madeWith.includes(l.key)}
                  disabled={!c.organic.madeWith.includes(l.key) && c.organic.madeWith.length >= 3}
                  onChange={(e) => toggleMadeWith(l.key, e.target.checked)}
                />
                <span>{everydayName(l.name, l.text)}</span>
              </label>
            ))}
          </fieldset>
        )}
        {notesFor("organic").map((n) => (
          <p key={n.text} className={n.level === "stop" ? "note" : "hint"}>
            {n.text}
          </p>
        ))}
        {notesFor("organic-name").map((n) => (
          <p key={n.text} className="note" role="alert">
            {n.text}
          </p>
        ))}
        <p className="hint">Never use the USDA Organic seal unless you&rsquo;re certified and the recipe is 95% organic or more.</p>
      </fieldset>

      <div className="claim-preview">
        <span className="hint">On the front:</span> <b>{result.front.length ? result.front.join(" · ") : "nothing yet"}</b>
      </div>

      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.saved && !dirty && (
        <p className="ok" role="status">
          Saved.
        </p>
      )}
      {(dirty || saving) && (
        <button type="submit" className="btn pri" disabled={saving}>
          {saving ? "Saving..." : "Save claims"}
        </button>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import type { NamePick } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { recognize } from "@/lib/supplies";
import { NameFinder } from "../products/NameFinder";

const pack = activePack();

/**
 * Is this supply a known ingredient? Shows the match, lets the maker pick the official
 * name, and asks for a description when it isn't recognized (required to save).
 */
export function IngredientCheck({
  ingredient,
  pick,
  description,
  onPick,
  onDescription,
  compact,
}: {
  ingredient: string;
  pick: NamePick | null;
  description: string;
  onPick: (p: NamePick | null) => void;
  onDescription: (d: string) => void;
  compact?: boolean;
}) {
  const [finding, setFinding] = useState(false);
  if (!ingredient.trim()) return null;
  const r = recognize(ingredient, pick, pack);

  return (
    <div className="fld ingredient-check">
      {r.status === "official" && (
        <p className="rstatus ok-soft">
          Official name: {r.name}{" "}
          <button type="button" className="btn ghost sm" onClick={() => onPick(null)}>
            Change
          </button>
        </p>
      )}
      {r.status === "recognized" && <p className="rstatus ok-soft">Recognized{r.name ? `: ${r.name}` : ""}</p>}
      {r.status === "unknown" && !finding && (
        <p className="rstatus warn-text">
          Not recognized.{" "}
          <button type="button" className="btn ghost sm" onClick={() => setFinding(true)}>
            Find the official name
          </button>
        </p>
      )}
      {finding && (
        <NameFinder
          typed={ingredient}
          onPick={(p) => {
            setFinding(false);
            // Their own name isn't an official one: the description still explains it.
            onPick(p.kind === "official" ? p : null);
          }}
          onCancel={() => setFinding(false)}
        />
      )}
      {(r.status === "unknown" || description) && (
        <label className="fld">
          <span>{r.status === "unknown" ? "Description (needed)" : "Description"}</span>
          <input
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            maxLength={500}
            placeholder={compact ? "What it is" : "What it is: plant and part, form, blend of what"}
          />
        </label>
      )}
    </div>
  );
}

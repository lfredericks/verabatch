"use client";

import { useActionState, useState } from "react";
import { removeLogo, saveLogo, type LogoState } from "./logoActions";

/**
 * Upload, replace or remove a logo. With a productId it's that product's logo;
 * without, the business logo. Removing is a lower-level change, so a simple confirm.
 */
export function LogoField({
  title,
  url,
  productId,
  note,
}: {
  title: string;
  /** Short-lived link to the current logo, or null. */
  url: string | null;
  productId?: string;
  /** Shown when there's no logo of its own (for example, what the label uses instead). */
  note?: string;
}) {
  const [state, upload, uploading] = useActionState<LogoState, FormData>(saveLogo, {});
  const [removeState, remove, removing] = useActionState<LogoState, FormData>(removeLogo, {});
  const [confirming, setConfirming] = useState(false);
  const [chosen, setChosen] = useState(false);
  const error = state.error ?? removeState.error;

  return (
    <section className="card" aria-label={title}>
      <h2>{title}</h2>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${title} preview`} className="logo-preview" />
      ) : (
        <p className="hint">{note ?? "No logo yet."}</p>
      )}
      <form action={upload} className="form row" onSubmit={() => setChosen(false)}>
        {productId && <input type="hidden" name="product_id" value={productId} />}
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg"
          aria-label="Logo file"
          className="file"
          onChange={(e) => setChosen(Boolean(e.target.files?.length))}
        />
        <button className="btn sm pri" disabled={uploading || !chosen}>
          {uploading ? "Uploading..." : url ? "Replace logo" : "Upload logo"}
        </button>
      </form>
      <p className="hint">PNG or JPG, up to 4 MB. A PNG with a see-through background works best on labels.</p>
      {url &&
        (confirming ? (
          <form action={remove} className="row" onSubmit={() => setConfirming(false)}>
            {productId && <input type="hidden" name="product_id" value={productId} />}
            <span>Remove this logo?</span>
            <button className="btn sm danger" disabled={removing}>
              Yes, remove
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </form>
        ) : (
          <button type="button" className="btn ghost sm cta" onClick={() => setConfirming(true)}>
            Remove logo
          </button>
        ))}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!error && (state.saved || removeState.saved) && (
        <p className="ok" role="status">
          Saved.
        </p>
      )}
    </section>
  );
}

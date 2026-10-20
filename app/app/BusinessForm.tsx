"use client";

import { useActionState, useState } from "react";
import { createBusiness, updateBusiness, type BusinessFormState } from "./actions";

export interface Business {
  id: string;
  name: string;
  city_state_zip: string;
  contact: string;
}

/**
 * Business details. Once saved they show as a locked summary with an Edit button,
 * so a stray tap can't change what goes on every label.
 */
export function BusinessForm({ business }: { business: Business | null }) {
  const [editing, setEditing] = useState(!business);
  const [state, action, saving] = useActionState<BusinessFormState, FormData>(async (prev, form) => {
    const r = await (business ? updateBusiness : createBusiness)(prev, form);
    if (r.saved) setEditing(false);
    return r;
  }, {});

  if (business && !editing) {
    return (
      <section className="card">
        <dl className="facts">
          <div>
            <dt>Business name</dt>
            <dd>{business.name}</dd>
          </div>
          <div>
            <dt>City, state and ZIP</dt>
            <dd>{business.city_state_zip || <i className="hint">not set</i>}</dd>
          </div>
          <div>
            <dt>Website, email or phone</dt>
            <dd>{business.contact || <i className="hint">not set</i>}</dd>
          </div>
        </dl>
        {state.saved && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        <button type="button" className="btn sm cta" onClick={() => setEditing(true)}>
          Edit business details
        </button>
      </section>
    );
  }

  return (
    <form action={action} className="card form">
      {business && <input type="hidden" name="id" value={business.id} />}
      <label className="fld">
        <span>Business name</span>
        <input name="name" defaultValue={business?.name ?? ""} placeholder="Your shop name" required maxLength={120} />
      </label>
      <label className="fld">
        <span>City, state and ZIP</span>
        <input name="city_state_zip" defaultValue={business?.city_state_zip ?? ""} placeholder="Anderson, IN 46011" maxLength={120} />
      </label>
      <label className="fld">
        <span>Website, email or phone</span>
        <input name="contact" defaultValue={business?.contact ?? ""} placeholder="yourshop.com" maxLength={200} />
      </label>
      <p className="hint">
        Labels need who made the product, where you&rsquo;re based, and a way for customers to reach you about a reaction.
        Changes show on every label.
      </p>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="row">
        <button className="btn pri" disabled={saving}>
          {saving ? "Saving..." : business ? "Save changes" : "Save and continue"}
        </button>
        {business && (
          <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

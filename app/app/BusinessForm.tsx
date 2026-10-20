"use client";

import { useActionState } from "react";
import { createBusiness, updateBusiness, type BusinessFormState } from "./actions";

export interface Business {
  id: string;
  name: string;
  city_state_zip: string;
  contact: string;
}

export function BusinessForm({ business }: { business: Business | null }) {
  const [state, action, saving] = useActionState<BusinessFormState, FormData>(
    business ? updateBusiness : createBusiness,
    {},
  );

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
        Labels need who made the product, where you're based, and a way for customers to reach you about a reaction.
      </p>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.saved && business && <p className="ok" role="status">Saved.</p>}
      <button className="btn pri" disabled={saving}>
        {saving ? "Saving..." : business ? "Save changes" : "Save and continue"}
      </button>
    </form>
  );
}

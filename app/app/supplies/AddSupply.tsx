"use client";

import { useState } from "react";
import { SupplyForm } from "./SupplyForm";

/** "+ Add a supply" that opens the form. Opens right away when there are no supplies yet. */
export function AddSupply({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  if (open) return <SupplyForm supply={null} onCancel={startOpen ? undefined : () => setOpen(false)} />;
  return (
    <button type="button" className="btn cta" onClick={() => setOpen(true)}>
      + Add one by hand
    </button>
  );
}

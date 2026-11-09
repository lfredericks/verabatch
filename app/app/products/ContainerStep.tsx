"use client";

import { useRouter } from "next/navigation";
import type { FillUnit } from "@/lib/core";
import type { Size } from "@/lib/sizes";
import { SizeForm } from "./SizesEditor";

/**
 * The last question of adding a product: what it goes in. Saving goes straight to the label,
 * so first run ends on "Your label is ready".
 */
export function ContainerStep({ productId, defaultUnit, typeKey }: { productId: string; defaultUnit: FillUnit; typeKey: string | null }) {
  const router = useRouter();
  return (
    <SizeForm
      productId={productId}
      size={null as Size | null}
      defaultUnit={defaultUnit}
      typeKey={typeKey}
      onDone={() => router.push(`/app/products/${productId}/label`)}
    />
  );
}

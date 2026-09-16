"use client";

import { deleteProduct } from "./product-actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!confirm("Pašalinti šį produktą? Jis dings iš turgaus.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
      >
        Šalinti
      </button>
    </form>
  );
}

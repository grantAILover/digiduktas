"use client";

import { useActionState, useState } from "react";
import { addReview, type ReviewState } from "./actions";

export default function ReviewForm({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    addReview,
    null,
  );
  const [rating, setRating] = useState(0);

  if (state?.ok) {
    return (
      <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
        Ačiū už atsiliepimą!
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="text-sm font-medium">Jūsų įvertinimas</span>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} iš 5`}
              className={`text-2xl leading-none transition-colors ${
                n <= rating ? "text-brand" : "text-line hover:text-brand/50"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <textarea
        name="comment"
        rows={3}
        placeholder="Parašykite atsiliepimą (nebūtina)"
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
      />

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Siunčiama…" : "Palikti atsiliepimą"}
      </button>
    </form>
  );
}

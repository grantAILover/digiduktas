"use client";

import { useActionState } from "react";
import { applySeller, type ApplyState } from "./actions";

export default function SellerApplicationForm() {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(
    applySeller,
    null,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Vardas (arba prekės ženklas)
        <input
          name="full_name"
          type="text"
          required
          placeholder="Pvz. Jonas arba StudijaX"
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Apie jus / ką kursite
        <textarea
          name="about"
          rows={4}
          placeholder="Trumpai — kokius produktus planuojate parduoti?"
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Portfolio / nuoroda (nebūtina)
        <input
          name="portfolio_url"
          type="url"
          placeholder="https://..."
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Siunčiama…" : "Pateikti paraišką"}
      </button>
    </form>
  );
}

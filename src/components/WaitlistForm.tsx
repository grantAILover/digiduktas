"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

export default function WaitlistForm() {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    null,
  );

  if (state?.ok) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-line bg-surface p-6 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 font-semibold">Ačiū! Esi sąraše.</p>
        <p className="mt-1 text-sm text-muted">
          Pranešim tau pirmiems, kai digiduktas startuos.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        name="email"
        type="email"
        required
        placeholder="tavo@paštas.lt"
        className="flex-1 rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Palauk…" : "Pranešti man"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600 sm:absolute sm:mt-14">
          {state.error}
        </p>
      )}
    </form>
  );
}

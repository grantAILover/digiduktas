"use client";

import { useActionState, useState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

const roles = [
  { value: "seller", label: "Noriu parduoti" },
  { value: "buyer", label: "Noriu pirkti" },
  { value: "both", label: "Ir tai, ir tai" },
] as const;

export default function WaitlistForm() {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    null,
  );
  const [role, setRole] = useState<string>("");

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
    <form action={formAction} className="mx-auto mt-8 flex max-w-md flex-col gap-3">
      <input type="hidden" name="role" value={role} />

      <div className="flex justify-center gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              role === r.value
                ? "border-brand bg-brand text-surface"
                : "border-line bg-surface text-ink hover:border-brand"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      {state?.error && (
        <p className="text-center text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}

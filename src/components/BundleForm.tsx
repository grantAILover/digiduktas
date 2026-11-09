"use client";

import { useActionState } from "react";
import { submitBundleRequest, type BundleFormState } from "@/app/bundle-actions";

const inputCls =
  "rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-brand";

// Komplekto (kelių pluginų kartu) užklausa
export default function BundleForm({ plugins, defaultEmail }: { plugins: string[]; defaultEmail?: string }) {
  const [state, action, pending] = useActionState<BundleFormState, FormData>(submitBundleRequest, null);

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-success/30 bg-success-soft p-5 text-sm text-success">
        Ačiū! Užklausą gavome — atsakysime el. paštu artimiausiu metu.
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
      {/* Paslėptas laukas botams */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <label className="flex flex-col gap-1 text-sm font-medium">
        Vardas
        <input name="name" required maxLength={100} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        El. paštas
        <input name="email" type="email" required defaultValue={defaultEmail} maxLength={200} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Telefonas (nebūtina)
        <input name="phone" type="tel" placeholder="+370 600 00000" className={inputCls} />
      </label>

      {plugins.length > 0 && (
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Kurie pluginai domina? (nebūtina)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {plugins.map((p) => (
              <label
                key={p}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
              >
                <input type="checkbox" name="plugins" value={p} className="h-4 w-4 accent-brand" />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Kokį darbą norite automatizuoti?
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Pvz. kas mėnesį gaunu ~80 sąskaitų el. paštu, jas suvedu į Excel ir tikrinu su banko išrašu…"
          className={inputCls}
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">{state.error}</p>
      )}

      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">Duomenis naudosime tik atsakyti į jūsų užklausą.</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Siunčiama…" : "Gauti pasiūlymą"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";
import { attributionFromLocation, type Attribution } from "@/lib/attribution";
import { SELLER_TYPES } from "@/lib/sources";
import { BONUS_OFFER, FOUNDING_LIMIT, FOUNDING_OFFER } from "@/lib/founding";

const roles = [
  { value: "seller", label: "Noriu parduoti" },
  { value: "buyer", label: "Noriu pirkti" },
] as const;

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
    active ? "border-brand bg-brand text-surface" : "border-line bg-surface text-ink hover:border-brand"
  }`;

export default function WaitlistForm({ foundingRemaining = null }: { foundingRemaining?: number | null }) {
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, null);
  const [role, setRole] = useState<string>("");
  const [sellerType, setSellerType] = useState<string>("");
  const [attr, setAttr] = useState<Attribution | null>(null);

  // Mygtukai puslapyje veda į #pardavejas / #pirkejas — iškart parenkam rolę.
  // Šaltinį (UTM / draugo kodą) paimam iš dabartinės nuorodos (nieko nesaugom).
  useEffect(() => {
    const apply = () => {
      if (location.hash === "#pardavejas") setRole("seller");
      if (location.hash === "#pirkejas") setRole("buyer");
    };
    const t = setTimeout(() => {
      apply();
      setAttr(attributionFromLocation());
    }, 0);
    window.addEventListener("hashchange", apply);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", apply);
    };
  }, []);

  return (
    <form action={formAction} className="mx-auto mt-8 flex max-w-md flex-col gap-4 text-left">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="seller_type" value={sellerType} />
      <input type="hidden" name="referred_by" value={attr?.ref ?? ""} />
      <input type="hidden" name="utm_source" value={attr?.utm_source ?? ""} />
      <input type="hidden" name="utm_medium" value={attr?.utm_medium ?? ""} />
      <input type="hidden" name="utm_campaign" value={attr?.utm_campaign ?? ""} />
      <input type="hidden" name="referrer" value={attr?.referrer ?? ""} />

      <div className="grid grid-cols-2 gap-2">
        {roles.map((r) => (
          <button key={r.value} type="button" onClick={() => setRole(r.value)} className={chip(role === r.value)}>
            {r.label}
          </button>
        ))}
      </div>

      {role === "seller" && (
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
          {foundingRemaining !== 0 && (
            <div className="rounded-lg bg-brand-soft px-3 py-2.5 text-sm">
              <p className="font-semibold text-brand-dark">
                {FOUNDING_OFFER}
                {foundingRemaining ? ` — liko ${foundingRemaining} iš ${FOUNDING_LIMIT} vietų.` : ""}
              </p>
              <p className="mt-1 text-xs text-brand-dark/80">{BONUS_OFFER}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Kas tu esi?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SELLER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSellerType(t.value)}
                  className={chip(sellerType === t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Instagram arba telefonas
            <input
              name="contact"
              type="text"
              required
              maxLength={100}
              autoComplete="off"
              placeholder="@tavo_vardas arba +370 6…"
              className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm font-normal outline-none transition-colors focus:border-brand"
            />
            <span className="text-xs font-normal text-muted">
              Susisieksime asmeniškai ir padėsime įkelti pirmą medžiagą.
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Ką norėtum parduoti?
            <textarea
              name="wants_to_sell"
              rows={2}
              maxLength={500}
              placeholder="Pvz.: matematikos egzamino sprendimai, eilėraščių analizės"
              className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm font-normal outline-none transition-colors focus:border-brand"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="tavo@pastas.lt"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Palauk…" : role === "seller" ? "Noriu parduoti" : "Užsiregistruoti"}
        </button>
      </div>

      {state?.error && <p className="text-center text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

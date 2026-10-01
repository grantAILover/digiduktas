"use client";

import { useEffect, useState } from "react";

// Įprasta formos POST užklausa — naršyklė pereina į Stripe pati.
// Stripe atsako kelias sekundes, todėl rodome, kad kažkas vyksta.
export default function ConnectStripeButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);

  // Grįžus „Atgal" iš Stripe naršyklė atkuria puslapį iš talpyklos — atrakinam mygtuką
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setPending(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <form action="/parduoti/stripe" method="post" onSubmit={() => setPending(true)}>
      <button
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {pending ? "Jungiamasi prie Stripe…" : label}
      </button>
    </form>
  );
}

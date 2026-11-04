"use client";

import { useState } from "react";
import Link from "next/link";
import { createCheckout } from "./actions";
import { eur } from "@/components/ProductCard";
import { TIER_LABEL, type Tier } from "@/lib/tiers";

const TIER_HINT: Record<Tier, string> = {
  self: "Failai ir instrukcija iškart po apmokėjimo — įsidiegiate patys.",
  install: "Prisijungsime nuotoliniu būdu, įdiegsime ir pritaikysime pagal jūsų poreikius.",
};

export default function BuyForm({
  productId,
  priceCents,
  installPriceCents,
}: {
  productId: string;
  priceCents: number;
  installPriceCents: number | null;
}) {
  const tiers: { tier: Tier; price: number }[] = [
    { tier: "self", price: priceCents },
    ...(installPriceCents !== null ? [{ tier: "install" as const, price: installPriceCents }] : []),
  ];
  const [tier, setTier] = useState<Tier>("self");
  const price = tiers.find((t) => t.tier === tier)?.price ?? priceCents;

  return (
    <form action={createCheckout} className="mt-4">
      <input type="hidden" name="productId" value={productId} />

      {tiers.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Pasirinkite variantą</legend>
          {tiers.map((t) => (
            <label
              key={t.tier}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                tier === t.tier ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/50"
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={t.tier}
                checked={tier === t.tier}
                onChange={() => setTier(t.tier)}
                className="mt-1 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">{TIER_LABEL[t.tier]}</span>
                  <span className="font-bold text-brand">{eur(t.price)}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">{TIER_HINT[t.tier]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <input type="hidden" name="tier" value="self" />
      )}

      <div className="mt-4 flex flex-col gap-2.5 text-xs leading-relaxed text-muted">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" name="claude" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
          <span>Turiu mokamą Claude paskyrą (Pro arba aukštesnę).</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
          <span>
            Sutinku, kad skaitmeninis turinys būtų pateiktas iš karto po apmokėjimo, ir suprantu, kad
            tuomet prarandu teisę atsisakyti sutarties per 14 dienų.{" "}
            <Link href="/grazinimai" className="text-brand hover:underline">
              Grąžinimų tvarka
            </Link>
          </span>
        </label>
        {tier === "install" && (
          <label className="flex cursor-pointer items-start gap-2.5">
            <input type="checkbox" name="service" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
            <span>
              Sutinku, kad diegimo paslauga būtų pradėta teikti iškart, ir suprantu, kad ją visiškai
              suteikus prarandu teisę atsisakyti sutarties.
            </span>
          </label>
        )}
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark sm:w-auto"
      >
        Pirkti — {eur(price)}
      </button>
    </form>
  );
}

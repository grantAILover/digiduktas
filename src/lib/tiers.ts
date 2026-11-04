// Plugino pirkimo lygiai. Be serverio importų — naudojama ir puslapiuose.
//  self    — „Pats įsidiegiu": failai + instrukcija (products.price_cents)
//  install — „Su įdiegimu": tas pats + įdiegiame ir pritaikome (products.install_price_cents)

export type Tier = "self" | "install";

export const TIER_LABEL: Record<Tier, string> = {
  self: "Pats įsidiegiu",
  install: "Su įdiegimu",
};

export function parseTier(value: unknown): Tier | null {
  return value === "self" || value === "install" ? value : null;
}

/** Lygio kaina iš DB (ne iš naršyklės). null — lygis šiam pluginui nesiūlomas. */
export function tierPrice(
  product: { price_cents: number; install_price_cents?: number | null },
  tier: Tier,
): number | null {
  if (tier === "self") return product.price_cents;
  return product.install_price_cents ?? null;
}

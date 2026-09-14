import Stripe from "stripe";

// Lazy — kad build'as nelūžtų, jei STRIPE_SECRET_KEY dar nenustatytas
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// Platformos komisija (kol kas 10%). Ankstyviems pardavėjams galima 0%.
export const PLATFORM_FEE_RATE = 0.1;
export function platformFee(cents: number): number {
  return Math.round(cents * PLATFORM_FEE_RATE);
}

export type PayoutStatus = "none" | "pending" | "active";

// Ar pardavėjo Stripe paskyra gali gauti išmokas?
export async function getPayoutStatus(
  accountId: string | null | undefined,
): Promise<PayoutStatus> {
  if (!accountId) return "none";
  try {
    const acct = await getStripe().v2.core.accounts.retrieve(accountId, {
      include: ["configuration.recipient"],
    });
    const status =
      acct.configuration?.recipient?.capabilities?.stripe_balance
        ?.stripe_transfers?.status;
    return status === "active" ? "active" : "pending";
  } catch {
    return "pending";
  }
}

import Stripe from "stripe";

// Lazy — kad build'as nelūžtų, jei STRIPE_SECRET_KEY dar nenustatytas
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

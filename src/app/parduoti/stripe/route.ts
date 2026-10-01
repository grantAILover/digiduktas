import { NextResponse } from "next/server";
import { stripeOnboardingTarget } from "@/lib/stripe-onboarding";

// Paprasta formos POST užklausa → 303 nukreipimas. Naršyklė pereina į Stripe pati,
// nepriklausomai nuo JavaScript (server action išorinis nukreipimas kartais užstrigdavo).
export async function POST(request: Request) {
  // Tik iš mūsų pačių puslapio
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const target = await stripeOnboardingTarget();
  return NextResponse.redirect(new URL(target, request.url), 303);
}

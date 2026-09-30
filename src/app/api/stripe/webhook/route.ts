import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckoutSession, markRefunded } from "@/lib/fulfillment";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // Apmokėta → užsakymas + atsisiuntimo prieiga + laiškas
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckoutSession(event.data.object);
      break;

    // Pinigai grąžinti pilnai → prieiga atimama
    case "charge.refunded":
      if (event.data.object.refunded) await markRefunded(event.data.object.payment_intent);
      break;

    // Pralaimėtas mokėjimo ginčas (chargeback) → prieiga atimama
    case "charge.dispute.closed":
      if (event.data.object.status === "lost") await markRefunded(event.data.object.payment_intent);
      break;
  }

  return NextResponse.json({ received: true });
}

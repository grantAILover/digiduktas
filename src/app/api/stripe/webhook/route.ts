import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Stripe from "stripe";
import { getStripe, platformFee } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmation } from "@/lib/email";

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

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "unpaid") {
      await fulfill(session);
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfill(session: Stripe.Checkout.Session) {
  const productId = session.metadata?.product_id;
  const buyerId = session.metadata?.buyer_id;
  if (!productId || !buyerId) return;

  const supabase = createAdminClient();

  // Idempotency — nedvigubinti to paties užsakymo
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const { data: product } = await supabase
    .from("products")
    .select("price_cents, title")
    .eq("id", productId)
    .single();
  if (!product) return;

  const price = product.price_cents;
  const fee = platformFee(price);

  const { data: order } = await supabase
    .from("orders")
    .insert({
      buyer_id: buyerId,
      product_id: productId,
      price_cents: price,
      platform_fee_cents: fee,
      seller_amount_cents: price - fee,
      status: "paid",
      stripe_session_id: session.id,
    })
    .select("id")
    .single();
  if (!order) return;

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("downloads")
    .insert({ order_id: order.id, token, expires_at: expires });

  // Patvirtinimo laiškas pirkėjui (nekritinis)
  const buyerEmail = session.customer_details?.email ?? session.customer_email;
  await sendOrderConfirmation({
    to: buyerEmail,
    productTitle: product.title,
    priceCents: price,
  });
}

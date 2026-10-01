// Užsakymų vykdymas ir grąžinimai. TIK serveriui.
import crypto from "crypto";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, platformFee } from "@/lib/stripe";
import { sendOrderConfirmation } from "@/lib/email";

export type FulfillResult = "created" | "exists" | "skipped";

function paymentIntentId(pi: string | Stripe.PaymentIntent | null | undefined) {
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

/**
 * Sukuria užsakymą iš apmokėtos Checkout sesijos.
 * Idempotentiška: kviečia ir webhook'as, ir grįžimo puslapis (jei webhook'as vėluoja
 * ar nesuveikė) — užsakymas sukuriamas tik kartą (unikali stripe_session_id).
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  db: SupabaseClient = createAdminClient(),
): Promise<FulfillResult> {
  if (session.payment_status === "unpaid") return "skipped";
  const productId = session.metadata?.product_id;
  const buyerId = session.metadata?.buyer_id;
  if (!productId || !buyerId) return "skipped";

  const { data: existing } = await db
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return "exists";

  const { data: product } = await db
    .from("products")
    .select("price_cents, title")
    .eq("id", productId)
    .single();
  if (!product) return "skipped";

  // Kiek pirkėjas REALIAI sumokėjo (kaina galėjo pasikeisti tarp pirkimo ir apdorojimo)
  const price = session.amount_total ?? product.price_cents;
  // Realiai taikyta komisija (founding pardavėjams — 0); senesniems mokėjimams — įprasta
  const metaFee = Number(session.metadata?.fee_cents);
  const fee =
    Number.isInteger(metaFee) && metaFee >= 0 && metaFee <= price ? metaFee : platformFee(price);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      buyer_id: buyerId,
      product_id: productId,
      price_cents: price,
      platform_fee_cents: fee,
      seller_amount_cents: price - fee,
      status: "paid",
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId(session.payment_intent),
    })
    .select("id")
    .single();
  if (error?.code === "23505") return "exists"; // tą pačią akimirką sukūrė kitas kelias
  if (!order) return "skipped";

  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.from("downloads").insert({ order_id: order.id, token, expires_at: expires });

  // Patvirtinimo laiškas pirkėjui (nekritinis)
  await sendOrderConfirmation({
    to: session.customer_details?.email ?? session.customer_email,
    productTitle: product.title,
    priceCents: price,
  });
  return "created";
}

/**
 * Grįžimo iš Stripe atsarginis kelias: jei webhook'as dar neatėjo, patys paklausiam
 * Stripe ir įvykdom užsakymą. Tikrinam, kad sesija priklauso šiam vartotojui.
 */
export async function fulfillFromReturn(sessionId: string, userId: string): Promise<FulfillResult> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return "skipped";
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.buyer_id !== userId) return "skipped";
    return await fulfillCheckoutSession(session);
  } catch {
    return "skipped";
  }
}

/**
 * Grąžinti pinigai (ar pralaimėtas ginčas) → užsakymas 'refunded' → prieiga prie failų atimama.
 * Grąžina, kiek užsakymų pažymėta.
 */
export async function markRefunded(
  paymentIntent: string | Stripe.PaymentIntent | null | undefined,
  db: SupabaseClient = createAdminClient(),
): Promise<number> {
  const pi = paymentIntentId(paymentIntent);
  if (!pi) return 0;

  let { data: orders } = await db.from("orders").select("id").eq("stripe_payment_intent", pi);

  // Senesni užsakymai neturi stripe_payment_intent — ieškom per Checkout sesiją
  if (!orders?.length) {
    try {
      const sessions = await getStripe().checkout.sessions.list({ payment_intent: pi, limit: 1 });
      const sid = sessions.data[0]?.id;
      if (sid) ({ data: orders } = await db.from("orders").select("id").eq("stripe_session_id", sid));
    } catch {
      // nekritinis
    }
  }
  if (!orders?.length) return 0;

  await db
    .from("orders")
    .update({ status: "refunded" })
    .in(
      "id",
      orders.map((o) => o.id),
    );
  return orders.length;
}

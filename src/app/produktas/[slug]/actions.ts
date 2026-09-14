"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPayoutStatus, platformFee } from "@/lib/stripe";

// Sukuria Stripe Checkout sesiją (destination charge + komisija) ir nukreipia
export async function createCheckout(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: product } = await supabase
    .from("products")
    .select("id, title, slug, price_cents, status, seller_id, profiles:seller_id(stripe_account_id)")
    .eq("id", productId)
    .maybeSingle();

  if (!product || product.status !== "live") redirect("/produktai");
  if (product.seller_id === user.id) redirect(`/produktas/${product.slug}?err=own`);

  const seller = Array.isArray(product.profiles)
    ? product.profiles[0]
    : product.profiles;
  const sellerAccount = seller?.stripe_account_id;
  if (!sellerAccount || (await getPayoutStatus(sellerAccount)) !== "active") {
    redirect(`/produktas/${product.slug}?err=seller`);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const meta = { product_id: product.id, buyer_id: user.id };
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: product.price_cents,
          product_data: { name: product.title },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee(product.price_cents),
      transfer_data: { destination: sellerAccount },
      metadata: meta,
    },
    metadata: meta,
    customer_email: user.email ?? undefined,
    success_url: `${site}/pirkiniai?pirkta=1`,
    cancel_url: `${site}/produktas/${product.slug}`,
  });

  redirect(session.url!);
}

export type ReportState = { ok?: boolean; error?: string } | null;

export async function reportProduct(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const productId = String(formData.get("productId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!productId) return { error: "Įvyko klaida." };
  if (!reason) return { error: "Pasirinkite priežastį." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prisijunkite, kad galėtumėte pranešti." };

  const fullReason = details ? `${reason} — ${details}` : reason;
  const { error } = await supabase.from("reports").insert({
    product_id: productId,
    reporter_id: user.id,
    reason: fullReason,
  });

  if (error) return { error: "Nepavyko išsiųsti. Bandykite dar kartą." };
  return { ok: true };
}

export type ReviewState = { ok?: boolean; error?: string } | null;

export async function addReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = parseInt(String(formData.get("rating") ?? ""), 10);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!productId) return { error: "Įvyko klaida." };
  if (!(rating >= 1 && rating <= 5)) {
    return { error: "Pasirinkite įvertinimą (1–5 žvaigždutės)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prisijunkite." };

  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    buyer_id: user.id,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Jau palikote atsiliepimą." };
    return { error: "Nepavyko. Atsiliepimą gali palikti tik pirkęs šį produktą." };
  }

  if (slug) revalidatePath(`/produktas/${slug}`);
  return { ok: true };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { MIN_PRICE_CENTS } from "@/lib/pricing";
import { requestOrigin } from "@/lib/site";
import { TIER_LABEL, parseTier, tierPrice } from "@/lib/tiers";

// Sukuria Stripe Checkout sesiją (pinigai — tiesiai į platformos sąskaitą) ir nukreipia
export async function createCheckout(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: product } = await supabase
    .from("products")
    .select("id, title, slug, price_cents, install_price_cents, status, seller_id")
    .eq("id", productId)
    .maybeSingle();

  if (!product || product.status !== "live") redirect("/");
  if (product.seller_id === user.id) redirect(`/produktas/${product.slug}?err=own`);

  // Lygis ir jo kaina — tik iš DB (naršyklė gali atsiųsti bet ką)
  const tier = parseTier(formData.get("tier"));
  const price = tier ? tierPrice(product, tier) : null;
  if (!tier || price === null) redirect(`/produktas/${product.slug}?err=tier`);

  // Pluginas veikia tik su mokama Claude paskyra — dažniausia grąžinimo priežastis
  if (formData.get("claude") !== "on") redirect(`/produktas/${product.slug}?err=claude`);

  // ES vartotojų teisė: atsisakymo teisė (14 d.) netaikoma skaitmeniniam turiniui TIK
  // jei pirkėjas iš anksto aiškiai sutiko. Tikrinam serveryje, ne tik naršyklėje.
  if (formData.get("consent") !== "on") redirect(`/produktas/${product.slug}?err=consent`);

  // Diegimo paslauga: sutikimas pradėti iškart (visiškai suteikus — atsisakymo teisė baigiasi)
  if (tier === "install" && formData.get("service") !== "on") {
    redirect(`/produktas/${product.slug}?err=service`);
  }

  // Per pigus mokėjimas būtų nuostolingas dėl Stripe mokesčio
  if (price < MIN_PRICE_CENTS) redirect(`/produktas/${product.slug}?err=price`);

  const site = await requestOrigin();
  const now = new Date().toISOString();
  const meta: Record<string, string> = {
    product_id: product.id,
    buyer_id: user.id,
    tier,
    // Sutikimų įrodymas (Stripe saugo metaduomenis prie mokėjimo)
    claude_confirmed_at: now,
    withdrawal_waiver_at: now,
    ...(tier === "install" ? { service_consent_at: now } : {}),
  };
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: price,
          product_data: { name: `${product.title} — ${TIER_LABEL[tier].toLowerCase()}` },
        },
      },
    ],
    payment_intent_data: { metadata: meta },
    metadata: meta,
    customer_email: user.email ?? undefined,
    // session_id — jei webhook'as vėluoja, „Mano pirkiniai" patys įvykdys užsakymą
    success_url: `${site}/pirkiniai?pirkta=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/produktas/${product.slug}`,
  });

  redirect(session.url!);
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

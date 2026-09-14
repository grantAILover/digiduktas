"use server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Sukuria (jei reikia) pardavėjo Stripe Connect paskyrą ir nukreipia į onboarding
export async function connectStripe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, is_seller, display_name")
    .eq("id", user.id)
    .single();
  if (!profile?.is_seller) redirect("/parduoti");

  const stripe = getStripe();
  let accountId = profile.stripe_account_id;

  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: user.email,
      display_name: profile.display_name ?? undefined,
      dashboard: "express",
      identity: { country: "lt" },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
    });
    accountId = account.id;
    await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        return_url: `${site}/parduoti?stripe=done`,
        refresh_url: `${site}/parduoti?stripe=refresh`,
      },
    },
  });

  redirect(link.url);
}

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/site";

/** Ar Stripe paskyra egzistuoja DABARTINIAME režime (test paskyros live režime nėra). */
async function accountExists(stripe: Stripe, accountId: string): Promise<boolean> {
  try {
    await stripe.v2.core.accounts.retrieve(accountId);
    return true;
  } catch (e) {
    const err = e as { statusCode?: number; code?: string };
    if (err.statusCode === 404 || err.code === "resource_missing") return false;
    throw e;
  }
}

/**
 * Sukuria (jei reikia) pardavėjo Stripe Connect paskyrą ir grąžina adresą,
 * į kurį nukreipti: Stripe onboarding arba mūsų puslapį su klaida.
 */
export async function stripeOnboardingTarget(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/auth";

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, is_seller, display_name")
    .eq("id", user.id)
    .single();
  if (!profile?.is_seller) return "/parduoti";

  try {
    const stripe = getStripe();
    let accountId = profile.stripe_account_id;

    // Senas ID iš kito režimo (pvz. test) — kuriam naują
    if (accountId && !(await accountExists(stripe, accountId))) accountId = null;

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
      await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
    }

    const site = await requestOrigin();
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
    return link.url;
  } catch (e) {
    // Priežastis — serverio loguose (Vercel → Logs); pardavėjui — aiškus pranešimas
    console.error("connectStripe nepavyko:", e instanceof Error ? e.message : e);
    const err = e as { code?: string; type?: string; statusCode?: number };
    const code = String(err.code ?? err.type ?? err.statusCode ?? "nezinoma").replace(/[^\w.-]/g, "").slice(0, 60);
    return `/parduoti?stripe=klaida&kodas=${encodeURIComponent(code)}`;
  }
}

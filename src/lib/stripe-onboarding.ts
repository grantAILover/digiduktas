import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/site";

/** Stripe atsakė, kad paskyros nėra arba ji ne šio režimo (test ID live režime → 404 arba 403). */
function isForeignAccountError(e: unknown): boolean {
  const err = e as { statusCode?: number; code?: string };
  return (
    err.statusCode === 404 ||
    err.statusCode === 403 ||
    err.code === "resource_missing" ||
    err.code === "forbidden"
  );
}

/** Ar Stripe paskyra pasiekiama DABARTINIAME režime. */
async function accountExists(stripe: Stripe, accountId: string): Promise<boolean> {
  try {
    await stripe.v2.core.accounts.retrieve(accountId);
    return true;
  } catch (e) {
    if (isForeignAccountError(e)) return false;
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

    const createAccount = async (): Promise<string> => {
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
      await supabase.from("profiles").update({ stripe_account_id: account.id }).eq("id", user.id);
      return account.id;
    };

    const site = await requestOrigin();
    const onboardingLink = (account: string) =>
      stripe.v2.core.accountLinks.create({
        account,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["recipient"],
            return_url: `${site}/parduoti?stripe=done`,
            refresh_url: `${site}/parduoti?stripe=refresh`,
          },
        },
      });

    // Senas ID iš kito režimo (pvz. test) — kuriam naują
    let accountId = profile.stripe_account_id;
    const fresh = !accountId || !(await accountExists(stripe, accountId));
    if (fresh) accountId = await createAccount();

    try {
      return (await onboardingLink(accountId!)).url;
    } catch (e) {
      // Stripe kartais grąžina seną paskyrą, bet neleidžia jai kurti nuorodos — vienas bandymas su nauja
      if (fresh || !isForeignAccountError(e)) throw e;
      return (await onboardingLink(await createAccount())).url;
    }
  } catch (e) {
    // Priežastis — serverio loguose (Vercel → Logs); pardavėjui — aiškus pranešimas
    console.error("connectStripe nepavyko:", e instanceof Error ? e.message : e);
    const err = e as { code?: string; type?: string; statusCode?: number };
    const code = String(err.code ?? err.type ?? err.statusCode ?? "nezinoma").replace(/[^\w.-]/g, "").slice(0, 60);
    return `/parduoti?stripe=klaida&kodas=${encodeURIComponent(code)}`;
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "./helpers/fake-supabase";

const SELLER = "11111111-1111-4111-8111-111111111111";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof createFakeSupabase>,
  existing: new Set<string>(),
  created: [] as string[],
  failCreate: false,
  forbiddenRetrieve: new Set<string>(),
  forbiddenLinks: new Set<string>(),
}));

const forbidden = () => Object.assign(new Error("Forbidden"), { statusCode: 403, code: "forbidden" });

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    v2: {
      core: {
        accounts: {
          retrieve: async (id: string) => {
            if (h.forbiddenRetrieve.has(id)) throw forbidden();
            if (h.existing.has(id)) return { id };
            throw Object.assign(new Error("No such account"), { statusCode: 404 });
          },
          create: async () => {
            if (h.failCreate)
              throw Object.assign(new Error("Your account must be activated"), {
                code: "account_create_activation_required",
              });
            const id = `acct_live_${h.created.length + 1}`;
            h.created.push(id);
            h.existing.add(id);
            return { id };
          },
        },
        accountLinks: {
          create: async ({ account }: { account: string }) => {
            if (h.forbiddenLinks.has(account)) throw forbidden();
            return { url: `https://connect.stripe.test/${account}` };
          },
        },
      },
    },
  }),
}));

import { stripeOnboardingTarget } from "@/lib/stripe-onboarding";

beforeEach(() => {
  h.existing = new Set();
  h.created = [];
  h.failCreate = false;
  h.forbiddenRetrieve = new Set();
  h.forbiddenLinks = new Set();
  h.fake = createFakeSupabase({ profiles: [{ id: SELLER, is_seller: true, display_name: "Mokytoja", stripe_account_id: null }] });
  h.fake.loginAs(SELLER);
});

const profile = () => h.fake.tables.profiles[0];

describe("Išmokų prijungimas (Stripe)", () => {
  it("naujas pardavėjas → sukuriama paskyra ir nukreipiama į Stripe", async () => {
    await expect(stripeOnboardingTarget()).resolves.toBe("https://connect.stripe.test/acct_live_1");
    expect(profile().stripe_account_id).toBe("acct_live_1");
  });

  it("pasenęs ID iš test režimo → sukuriama nauja paskyra (ne juodas puslapis)", async () => {
    profile().stripe_account_id = "acct_test_senas";
    await expect(stripeOnboardingTarget()).resolves.toBe("https://connect.stripe.test/acct_live_1");
    expect(profile().stripe_account_id).toBe("acct_live_1");
  });

  it("senas test ID, Stripe atsako „forbidden“ → sukuriama nauja paskyra", async () => {
    profile().stripe_account_id = "acct_test_svetimas";
    h.forbiddenRetrieve.add("acct_test_svetimas");
    await expect(stripeOnboardingTarget()).resolves.toBe("https://connect.stripe.test/acct_live_1");
    expect(profile().stripe_account_id).toBe("acct_live_1");
  });

  it("paskyra randama, bet nuorodai „forbidden“ → vienas bandymas su nauja paskyra", async () => {
    profile().stripe_account_id = "acct_test_pusiau";
    h.existing.add("acct_test_pusiau");
    h.forbiddenLinks.add("acct_test_pusiau");
    await expect(stripeOnboardingTarget()).resolves.toBe("https://connect.stripe.test/acct_live_1");
    expect(profile().stripe_account_id).toBe("acct_live_1");
    expect(h.created).toHaveLength(1);
  });

  it("esama paskyra → naudojama ta pati", async () => {
    profile().stripe_account_id = "acct_esama";
    h.existing.add("acct_esama");
    await expect(stripeOnboardingTarget()).resolves.toBe("https://connect.stripe.test/acct_esama");
    expect(h.created).toHaveLength(0);
  });

  it("Stripe klaida → pranešimas pardavėjo skydelyje su klaidos kodu", async () => {
    h.failCreate = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(stripeOnboardingTarget()).resolves.toBe(
      "/parduoti?stripe=klaida&kodas=account_create_activation_required",
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("neprisijungęs → į prisijungimą", async () => {
    h.fake.loginAs(null);
    await expect(stripeOnboardingTarget()).resolves.toBe("/auth");
  });
});

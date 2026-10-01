import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "./helpers/fake-supabase";

const SELLER = "11111111-1111-4111-8111-111111111111";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof createFakeSupabase>,
  existing: new Set<string>(),
  created: [] as string[],
  failCreate: false,
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    v2: {
      core: {
        accounts: {
          retrieve: async (id: string) => {
            if (h.existing.has(id)) return { id };
            throw Object.assign(new Error("No such account"), { statusCode: 404 });
          },
          create: async () => {
            if (h.failCreate) throw new Error("Connect live režime nesukonfigūruotas");
            const id = `acct_live_${h.created.length + 1}`;
            h.created.push(id);
            h.existing.add(id);
            return { id };
          },
        },
        accountLinks: { create: async ({ account }: { account: string }) => ({ url: `https://connect.stripe.test/${account}` }) },
      },
    },
  }),
}));

import { connectStripe } from "@/app/parduoti/stripe-actions";

beforeEach(() => {
  h.existing = new Set();
  h.created = [];
  h.failCreate = false;
  h.fake = createFakeSupabase({ profiles: [{ id: SELLER, is_seller: true, display_name: "Mokytoja", stripe_account_id: null }] });
  h.fake.loginAs(SELLER);
});

const profile = () => h.fake.tables.profiles[0];

describe("Išmokų prijungimas (Stripe)", () => {
  it("naujas pardavėjas → sukuriama paskyra ir nukreipiama į Stripe", async () => {
    await expect(connectStripe()).rejects.toThrow("REDIRECT https://connect.stripe.test/acct_live_1");
    expect(profile().stripe_account_id).toBe("acct_live_1");
  });

  it("pasenęs ID iš test režimo → sukuriama nauja paskyra (ne juodas puslapis)", async () => {
    profile().stripe_account_id = "acct_test_senas";
    await expect(connectStripe()).rejects.toThrow("REDIRECT https://connect.stripe.test/acct_live_1");
    expect(profile().stripe_account_id).toBe("acct_live_1");
  });

  it("esama paskyra → naudojama ta pati", async () => {
    profile().stripe_account_id = "acct_esama";
    h.existing.add("acct_esama");
    await expect(connectStripe()).rejects.toThrow("REDIRECT https://connect.stripe.test/acct_esama");
    expect(h.created).toHaveLength(0);
  });

  it("Stripe klaida → aiškus pranešimas pardavėjo skydelyje", async () => {
    h.failCreate = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(connectStripe()).rejects.toThrow("REDIRECT /parduoti?stripe=klaida");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

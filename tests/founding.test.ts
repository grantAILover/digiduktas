import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { createFakeSupabase } from "./helpers/fake-supabase";

process.env.STRIPE_SECRET_KEY = "sk_test_fake";

const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof createFakeSupabase> }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));
vi.mock("@/lib/email", () => ({ sendOrderConfirmation: async () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import { claimFoundingSlot, foundingTaken, sellerFeeCents } from "@/lib/founding-server";
import { FOUNDING_LIMIT, FOUNDING_UNTIL, foundingRemaining } from "@/lib/founding";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import { joinWaitlist } from "@/app/actions";

const SELLER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  h.fake = createFakeSupabase({
    founding_slots: [],
    waitlist: [],
    orders: [],
    downloads: [],
    products: [{ id: PRODUCT, title: "Konspektas", price_cents: 500 }],
  });
});

const db = () => h.fake.client as never;

describe("Pirmųjų 20 pardavėjų vietos", () => {
  it("vietos skiriamos eilės tvarka; tas pats el. paštas — ta pati vieta", async () => {
    expect(await claimFoundingSlot("a@b.lt", null, db())).toBe(1);
    expect(await claimFoundingSlot("c@d.lt", null, db())).toBe(2);
    expect(await claimFoundingSlot("A@B.lt", null, db())).toBe(1);
    expect(await foundingTaken(db())).toBe(2);
  });

  it("patvirtinus paraišką rezervuota vieta susiejama su paskyra (ne nauja vieta)", async () => {
    await claimFoundingSlot("mokytoja@b.lt", null, db());
    expect(await claimFoundingSlot("mokytoja@b.lt", SELLER, db())).toBe(1);
    expect(h.fake.tables.founding_slots).toHaveLength(1);
    expect(h.fake.tables.founding_slots[0].user_id).toBe(SELLER);
  });

  it(`daugiau nei ${FOUNDING_LIMIT} vietų neskiriama`, async () => {
    for (let i = 0; i < FOUNDING_LIMIT; i++) await claimFoundingSlot(`p${i}@b.lt`, null, db());
    expect(await claimFoundingSlot("velai@b.lt", null, db())).toBeNull();
    expect(foundingRemaining(FOUNDING_LIMIT)).toBe(0);
    expect(foundingRemaining(2)).toBe(18);
  });

  it("registracija kaip pardavėjui rezervuoja vietą, pirkėjui — ne", async () => {
    await expect(
      joinWaitlist(null, form({ email: "pirkejas@b.lt", role: "buyer" })),
    ).rejects.toThrow("REDIRECT");
    await expect(
      joinWaitlist(
        null,
        form({ email: "mokytoja@b.lt", role: "seller", seller_type: "mokytojas", contact: "@mokytoja" }),
      ),
    ).rejects.toThrow("REDIRECT");
    expect(h.fake.tables.founding_slots.map((s) => s.email)).toEqual(["mokytoja@b.lt"]);
  });
});

describe("Komisija", () => {
  it("pirmųjų 20 pardavėjui iki termino — 0 %, po termino — 10 %", async () => {
    await claimFoundingSlot("s@b.lt", SELLER, db());
    expect(await sellerFeeCents(SELLER, 500, db())).toBe(0);
    const after = new Date(FOUNDING_UNTIL.getTime() + 1000);
    expect(await sellerFeeCents(SELLER, 500, db(), after)).toBe(50);
  });

  it("kitiems pardavėjams — 10 %", async () => {
    expect(await sellerFeeCents(OTHER, 500, db())).toBe(50);
  });

  it("užsakyme įrašoma realiai taikyta komisija (0 %) — visa suma pardavėjui", async () => {
    await fulfillCheckoutSession({
      id: "cs_test_f",
      payment_status: "paid",
      amount_total: 500,
      payment_intent: "pi_f",
      metadata: { product_id: PRODUCT, buyer_id: OTHER, fee_cents: "0" },
      customer_details: { email: "p@b.lt" },
    } as unknown as Stripe.Checkout.Session);
    expect(h.fake.tables.orders[0]).toMatchObject({ platform_fee_cents: 0, seller_amount_cents: 500 });
  });
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

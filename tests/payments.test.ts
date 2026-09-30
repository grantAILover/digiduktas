import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createFakeSupabase } from "./helpers/fake-supabase";
import { IDS, seed } from "./helpers/seed";

const WEBHOOK_SECRET = "whsec_test_secret";
process.env.STRIPE_SECRET_KEY = "sk_test_fake"; // tik parašams — tinklo užklausų nėra
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof createFakeSupabase>,
  emails: [] as unknown[],
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));
vi.mock("@/lib/email", () => ({
  sendOrderConfirmation: async (o: unknown) => {
    h.emails.push(o);
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { fulfillCheckoutSession, markRefunded } from "@/lib/fulfillment";
import { getFileAccess } from "@/lib/access";
import { POST as webhookPOST } from "@/app/api/stripe/webhook/route";
import { createCheckout } from "@/app/produktas/[slug]/actions";

beforeEach(() => {
  h.fake = createFakeSupabase(seed());
  h.emails = [];
});

function session(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cs_test_new",
    payment_status: "paid",
    amount_total: 999,
    payment_intent: "pi_new",
    metadata: { product_id: IDS.productOpen, buyer_id: IDS.stranger },
    customer_details: { email: "pirkejas@test.lt" },
    customer_email: null,
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

function signedWebhook(type: string, object: object) {
  const payload = JSON.stringify({ id: "evt_test", object: "event", type, data: { object } });
  const header = new Stripe("sk_test_fake").webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": header },
  });
}

const orders = () => h.fake.tables.orders;
const order = (id: string) => orders().find((o) => o.id === id)!;

describe("Užsakymo vykdymas po apmokėjimo", () => {
  it("sukuria užsakymą su komisija, atsisiuntimo prieigą ir laišką", async () => {
    expect(await fulfillCheckoutSession(session())).toBe("created");
    const o = orders().find((x) => x.stripe_session_id === "cs_test_new")!;
    expect(o).toMatchObject({
      buyer_id: IDS.stranger,
      status: "paid",
      price_cents: 999,
      platform_fee_cents: 100,
      seller_amount_cents: 899,
      stripe_payment_intent: "pi_new",
    });
    expect(h.fake.tables.downloads).toHaveLength(1);
    expect(h.emails).toHaveLength(1);
  });

  it("antras kartas (webhook + grįžimo puslapis) — dvigubo užsakymo nėra", async () => {
    await fulfillCheckoutSession(session());
    expect(await fulfillCheckoutSession(session())).toBe("exists");
    expect(orders().filter((o) => o.stripe_session_id === "cs_test_new")).toHaveLength(1);
    expect(h.emails).toHaveLength(1);
  });

  it("abu keliai VIENU METU — vis tiek vienas užsakymas", async () => {
    const results = await Promise.all([fulfillCheckoutSession(session()), fulfillCheckoutSession(session())]);
    expect(results.sort()).toEqual(["created", "exists"]);
    expect(orders().filter((o) => o.stripe_session_id === "cs_test_new")).toHaveLength(1);
  });

  it("neapmokėta sesija — nieko nedaro", async () => {
    expect(await fulfillCheckoutSession(session({ payment_status: "unpaid" }))).toBe("skipped");
    expect(orders()).toHaveLength(3);
  });

  it("įrašo realiai sumokėtą sumą, ne dabartinę produkto kainą", async () => {
    await fulfillCheckoutSession(session({ amount_total: 500 }));
    expect(orders().find((o) => o.stripe_session_id === "cs_test_new")).toMatchObject({
      price_cents: 500,
      platform_fee_cents: 50,
    });
  });

  it("webhook checkout.session.completed sukuria užsakymą", async () => {
    const res = await webhookPOST(signedWebhook("checkout.session.completed", session()));
    expect(res.status).toBe(200);
    expect(orders().some((o) => o.stripe_session_id === "cs_test_new")).toBe(true);
  });
});

describe("Grąžinimai ir ginčai", () => {
  it("grąžinus pinigus pirkėjas praranda prieigą prie failų", async () => {
    expect((await getFileAccess(IDS.buyer, IDS.fileOpen)).ok).toBe(true);
    expect(await markRefunded("pi_o1")).toBe(1);
    expect(order("o1").status).toBe("refunded");
    const after = await getFileAccess(IDS.buyer, IDS.fileOpen);
    expect(after.ok === false && after.status).toBe(403);
  });

  it("webhook charge.refunded (pilnas grąžinimas) → refunded", async () => {
    const res = await webhookPOST(signedWebhook("charge.refunded", { id: "ch_1", refunded: true, payment_intent: "pi_o2" }));
    expect(res.status).toBe(200);
    expect(order("o2").status).toBe("refunded");
  });

  it("dalinis grąžinimas prieigos neatima", async () => {
    await webhookPOST(signedWebhook("charge.refunded", { id: "ch_1", refunded: false, payment_intent: "pi_o2" }));
    expect(order("o2").status).toBe("paid");
  });

  it("pralaimėtas ginčas → refunded, laimėtas — nieko", async () => {
    await webhookPOST(signedWebhook("charge.dispute.closed", { id: "dp_1", status: "won", payment_intent: "pi_o1" }));
    expect(order("o1").status).toBe("paid");
    await webhookPOST(signedWebhook("charge.dispute.closed", { id: "dp_2", status: "lost", payment_intent: "pi_o1" }));
    expect(order("o1").status).toBe("refunded");
  });

  it("suklastotas webhook'as (blogas parašas) atmetamas", async () => {
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "charge.refunded", data: { object: { refunded: true, payment_intent: "pi_o1" } } }),
      headers: { "stripe-signature": "t=1,v1=netikras" },
    });
    expect((await webhookPOST(req)).status).toBe(400);
    expect(order("o1").status).toBe("paid");
  });
});

describe("Pirkimas: sutikimas ir minimali kaina", () => {
  function checkoutForm(consent: boolean) {
    const fd = new FormData();
    fd.set("productId", IDS.productOpen);
    if (consent) fd.set("consent", "on");
    return fd;
  }

  it("be sutikimo dėl atsisakymo teisės pirkti negalima (tikrinama serveryje)", async () => {
    h.fake.loginAs(IDS.stranger);
    await expect(createCheckout(checkoutForm(false))).rejects.toThrow("REDIRECT /produktas/e-knyga?err=consent");
  });

  it("produktas pigesnis nei 3 € neparduodamas", async () => {
    h.fake.loginAs(IDS.stranger);
    h.fake.tables.products[0].price_cents = 200;
    await expect(createCheckout(checkoutForm(true))).rejects.toThrow("REDIRECT /produktas/e-knyga?err=price");
  });
});

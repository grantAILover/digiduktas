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
import { getStripe } from "@/lib/stripe";

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
  it("sukuria užsakymą (be komisijos — visa suma mums), atsisiuntimo prieigą ir laišką", async () => {
    expect(await fulfillCheckoutSession(session())).toBe("created");
    const o = orders().find((x) => x.stripe_session_id === "cs_test_new")!;
    expect(o).toMatchObject({
      buyer_id: IDS.stranger,
      status: "paid",
      tier: "self",
      price_cents: 999,
      platform_fee_cents: 0,
      seller_amount_cents: 999,
      stripe_payment_intent: "pi_new",
    });
    expect(h.fake.tables.downloads).toHaveLength(1);
    expect(h.emails).toHaveLength(1);
  });

  it("užsakymas įsimena lygį „Su įdiegimu“, laiške — taip pat", async () => {
    await fulfillCheckoutSession(
      session({ amount_total: 1999, metadata: { product_id: IDS.productOpen, buyer_id: IDS.stranger, tier: "install" } }),
    );
    expect(orders().find((o) => o.stripe_session_id === "cs_test_new")).toMatchObject({
      tier: "install",
      price_cents: 1999,
    });
    expect(h.emails[0]).toMatchObject({ tier: "install" });
  });

  it("nežinomas lygis metaduomenyse → laikomas „Pats įsidiegiu“", async () => {
    await fulfillCheckoutSession(
      session({ metadata: { product_id: IDS.productOpen, buyer_id: IDS.stranger, tier: "vip" } }),
    );
    expect(orders().find((o) => o.stripe_session_id === "cs_test_new")!.tier).toBe("self");
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
      seller_amount_cents: 500,
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

describe("Pirkimas: lygis, sutikimai ir kaina (serveris)", () => {
  type Created = Stripe.Checkout.SessionCreateParams;
  let created: Created[] = [];

  beforeEach(() => {
    created = [];
    // Tikro Stripe nekviečiam — tik pagaunam, ką siųstume
    vi.spyOn(getStripe().checkout.sessions, "create").mockImplementation((async (params: Created) => {
      created.push(params);
      return { url: "https://checkout.stripe.test/s" };
    }) as never);
    h.fake.loginAs(IDS.stranger);
    h.fake.tables.products[0].install_price_cents = 1999;
  });

  function form(fields: Record<string, string>) {
    const fd = new FormData();
    fd.set("productId", IDS.productOpen);
    for (const [k, v] of Object.entries({ tier: "self", claude: "on", consent: "on", ...fields })) {
      if (v) fd.set(k, v);
    }
    return fd;
  }
  const buy = (fields: Record<string, string> = {}) => createCheckout(form(fields));

  it("pinigai — tiesiai mums: nėra pervedimo pardavėjui ir komisijos", async () => {
    await expect(buy()).rejects.toThrow("REDIRECT https://checkout.stripe.test/s");
    const s = created[0];
    expect(s.line_items?.[0].price_data?.unit_amount).toBe(999);
    expect(s.payment_intent_data).not.toHaveProperty("transfer_data");
    expect(s.payment_intent_data).not.toHaveProperty("application_fee_amount");
    expect(s.metadata).toMatchObject({ tier: "self", product_id: IDS.productOpen, buyer_id: IDS.stranger });
  });

  it("„Su įdiegimu“ — kaina iš DB, įrašomas sutikimas dėl paslaugos", async () => {
    await expect(buy({ tier: "install", service: "on" })).rejects.toThrow("REDIRECT https://checkout");
    expect(created[0].line_items?.[0].price_data?.unit_amount).toBe(1999);
    expect(created[0].metadata).toHaveProperty("service_consent_at");
  });

  it("„Su įdiegimu“ be sutikimo dėl paslaugos — negalima", async () => {
    await expect(buy({ tier: "install" })).rejects.toThrow("REDIRECT /produktas/e-knyga?err=service");
    expect(created).toHaveLength(0);
  });

  it("diegimas nesiūlomas (nėra kainos) arba suklastotas lygis — negalima", async () => {
    h.fake.tables.products[0].install_price_cents = null;
    await expect(buy({ tier: "install", service: "on" })).rejects.toThrow("err=tier");
    await expect(buy({ tier: "nemokamai" })).rejects.toThrow("err=tier");
    expect(created).toHaveLength(0);
  });

  it("be patvirtinimo apie Claude paskyrą — negalima", async () => {
    await expect(buy({ claude: "" })).rejects.toThrow("REDIRECT /produktas/e-knyga?err=claude");
  });

  it("be sutikimo dėl atsisakymo teisės pirkti negalima", async () => {
    await expect(buy({ consent: "" })).rejects.toThrow("REDIRECT /produktas/e-knyga?err=consent");
  });

  it("kaina mažesnė nei 3 € — neparduodama", async () => {
    h.fake.tables.products[0].price_cents = 200;
    await expect(buy()).rejects.toThrow("REDIRECT /produktas/e-knyga?err=price");
    expect(created).toHaveLength(0);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "./helpers/fake-supabase";
import { IDS, seed } from "./helpers/seed";

const h = vi.hoisted(() => ({
  fake: null as unknown as ReturnType<typeof createFakeSupabase>,
  notices: [] as Record<string, unknown>[],
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/email", async (orig) => ({
  ...(await orig<typeof import("@/lib/email")>()),
  sendInstallRequestNotice: async (n: Record<string, unknown>) => {
    h.notices.push(n);
  },
}));

import { submitInstallRequest } from "@/app/pirkiniai/actions";
import { setInstallStatus } from "@/app/admin/actions";
import { escapeHtml } from "@/lib/email";

beforeEach(() => {
  const s = seed();
  // o1 — „Su įdiegimu" (pirkėjas), o2 — „Pats įsidiegiu", o3 — grąžinti pinigai
  s.orders = s.orders.map((o) => ({ ...o, tier: o.id === "o2" ? "self" : "install" }));
  h.fake = createFakeSupabase({ ...s, install_requests: [] });
  h.notices = [];
  h.fake.loginAs(IDS.buyer);
});

function form(fields: Record<string, string> = {}) {
  const fd = new FormData();
  const all = { orderId: "o1", phone: "+370 600 12345", preferred_time: "Po 17 val.", os: "windows", ...fields };
  for (const [k, v] of Object.entries(all)) fd.set(k, v);
  return fd;
}
const submit = async (fields?: Record<string, string>) => (await submitInstallRequest(null, form(fields)))!;
const requests = () => h.fake.tables.install_requests;

describe("Diegimo anketa (pirkėjas)", () => {
  it("pirkėjas užpildo — išsaugoma kaip „naujas“, telefonas suvienodinamas, ateina pranešimas", async () => {
    expect(await submit({ tools: "Swedbank, Rivilė" })).toEqual({ ok: true });
    expect(requests()).toHaveLength(1);
    expect(requests()[0]).toMatchObject({
      order_id: "o1",
      user_id: IDS.buyer,
      phone: "+37060012345",
      os: "windows",
      tools: "Swedbank, Rivilė",
    });
    expect(h.notices[0]).toMatchObject({ phone: "+37060012345", os: "Windows", updated: false });
  });

  it("svetimas užsakymas — negalima", async () => {
    h.fake.loginAs(IDS.stranger);
    expect((await submit()).error).toBeTruthy();
    expect(requests()).toHaveLength(0);
  });

  it("„Pats įsidiegiu“ ar grąžintas užsakymas — anketos nėra", async () => {
    expect((await submit({ orderId: "o2" })).error).toBeTruthy();
    h.fake.loginAs(IDS.refunded);
    expect((await submit({ orderId: "o3" })).error).toBeTruthy();
    expect(requests()).toHaveLength(0);
  });

  it("neteisingi duomenys — aiški klaida", async () => {
    expect((await submit({ phone: "123" })).error).toMatch(/telefono/);
    expect((await submit({ phone: "skambinkit" })).error).toMatch(/telefono/);
    expect((await submit({ preferred_time: "  " })).error).toMatch(/patogu/);
    expect((await submit({ os: "linux" })).error).toMatch(/kompiuterį/);
    expect(requests()).toHaveLength(0);
  });

  it("pakeitus anketą — atnaujinama ta pati (be dublikato), būsena išlieka", async () => {
    await submit();
    requests()[0].status = "suderinta";
    await submit({ preferred_time: "Šeštadienį" });
    expect(requests()).toHaveLength(1);
    expect(requests()[0]).toMatchObject({ preferred_time: "Šeštadienį", status: "suderinta" });
    expect(h.notices[1]).toMatchObject({ updated: true });
  });

  it("jau įdiegus — anketos keisti nebegalima", async () => {
    await submit();
    requests()[0].status = "idiegta";
    expect((await submit({ phone: "+37069999999" })).error).toMatch(/atliktas/);
    expect(requests()[0].phone).toBe("+37060012345");
  });
});

describe("Diegimo būsena (admin)", () => {
  function statusForm(status: string) {
    const fd = new FormData();
    fd.set("id", String(requests()[0].id));
    fd.set("status", status);
    return fd;
  }

  it("keisti gali tik adminas; neteisinga būsena ignoruojama", async () => {
    await submit();
    await setInstallStatus(statusForm("idiegta")); // pirkėjas — ne adminas
    expect(requests()[0].status).toBeUndefined(); // DB numatytoji 'naujas' (netikroje DB — nenustatyta)

    h.fake.loginAs(IDS.admin);
    await setInstallStatus(statusForm("kazkas"));
    expect(requests()[0].status).toBeUndefined();
    await setInstallStatus(statusForm("suderinta"));
    expect(requests()[0].status).toBe("suderinta");
  });
});

describe("Laiško apsauga", () => {
  it("kliento tekstas laiške rodomas kaip tekstas, ne HTML", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">&'`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;",
    );
  });
});

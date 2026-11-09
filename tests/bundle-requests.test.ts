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
  sendBundleRequestNotice: async (n: Record<string, unknown>) => {
    h.notices.push(n);
  },
}));

import { submitBundleRequest } from "@/app/bundle-actions";
import { setBundleStatus } from "@/app/admin/actions";

beforeEach(() => {
  h.fake = createFakeSupabase({ ...seed(), bundle_requests: [] });
  h.notices = [];
});

function form(fields: Record<string, string | string[]> = {}) {
  const fd = new FormData();
  const all: Record<string, string | string[]> = {
    name: "Rasa",
    email: "Rasa@Imone.lt",
    message: "Kas mėnesį suvedu 80 sąskaitų į Excel ranka.",
    ...fields,
  };
  for (const [k, v] of Object.entries(all)) {
    for (const one of Array.isArray(v) ? v : [v]) fd.append(k, one);
  }
  return fd;
}
const submit = async (fields?: Record<string, string | string[]>) => (await submitBundleRequest(null, form(fields)))!;
const rows = () => h.fake.tables.bundle_requests;

describe("Komplekto užklausa (vieša forma)", () => {
  it("užklausa išsaugoma ir ateina pranešimas; el. paštas mažosiomis", async () => {
    expect(await submit({ phone: "+370 600 12345" })).toEqual({ ok: true });
    expect(rows()[0]).toMatchObject({ name: "Rasa", email: "rasa@imone.lt", phone: "+37060012345", user_id: null });
    expect(h.notices).toHaveLength(1);
  });

  it("prisijungusio pirkėjo užklausa susiejama su paskyra", async () => {
    h.fake.loginAs(IDS.buyer);
    await submit();
    expect(rows()[0].user_id).toBe(IDS.buyer);
  });

  it("pažymėti galima tik paskelbtus pluginus", async () => {
    await submit({ plugins: ["E-knyga", "Netikras pluginas <b>", "E-knyga"] });
    expect(rows()[0].plugins).toEqual(["E-knyga"]);
  });

  it("neteisingi duomenys — aiški klaida, niekas neišsaugoma", async () => {
    expect((await submit({ name: " " })).error).toMatch(/vardą/);
    expect((await submit({ email: "ne-pastas" })).error).toMatch(/el\. pašto/);
    expect((await submit({ phone: "123" })).error).toMatch(/telefono/);
    expect((await submit({ message: "trumpai" })).error).toMatch(/automatizuoti/);
    expect(rows()).toHaveLength(0);
    expect(h.notices).toHaveLength(0);
  });

  it("botas (užpildė paslėptą lauką) — atrodo, kad pavyko, bet niekas neišsaugoma", async () => {
    expect(await submit({ website: "http://spam.example" })).toEqual({ ok: true });
    expect(rows()).toHaveLength(0);
    expect(h.notices).toHaveLength(0);
  });

  it("daugiau nei 3 užklausos per valandą iš to paties el. pašto — atmetama", async () => {
    for (let i = 0; i < 3; i++) expect((await submit()).ok).toBe(true);
    expect((await submit()).error).toMatch(/jau gavome/);
    expect(rows()).toHaveLength(3);
  });
});

describe("Komplekto užklausos būsena (admin)", () => {
  it("keisti gali tik adminas", async () => {
    await submit();
    const fd = () => {
      const f = new FormData();
      f.set("id", String(rows()[0].id));
      f.set("status", "atsakyta");
      return f;
    };
    h.fake.loginAs(IDS.buyer);
    await setBundleStatus(fd());
    expect(rows()[0].status).toBeUndefined();
    h.fake.loginAs(IDS.admin);
    await setBundleStatus(fd());
    expect(rows()[0].status).toBe("atsakyta");
  });
});

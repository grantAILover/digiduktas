import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "./helpers/fake-supabase";
import { sourceOf } from "@/lib/sources";

const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof createFakeSupabase> }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import { joinWaitlist } from "@/app/actions";

beforeEach(() => {
  h.fake = createFakeSupabase({ waitlist: [] });
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** Paleidžia veiksmą; grąžina nukreipimo adresą arba klaidos būseną. */
async function submit(fields: Record<string, string>) {
  try {
    return { state: await joinWaitlist(null, form(fields)) };
  } catch (e) {
    const m = /^REDIRECT (.+)$/.exec((e as Error).message);
    if (m) return { redirect: m[1] };
    throw e;
  }
}

const rows = () => h.fake.tables.waitlist;

describe("Laukiančiųjų sąrašas — registracija", () => {
  it("pardavėjas su informacija ir šaltiniu → padėkos puslapis su asmeniniu kodu", async () => {
    const r = await submit({
      email: "Mokytoja@Pastas.LT",
      role: "seller",
      seller_type: "mokytojas",
      wants_to_sell: "Biologijos konspektai",
      utm_source: "tiktok",
      referred_by: "abcd1234",
    });
    expect(r.redirect).toMatch(/^\/aciu\?kodas=[a-f0-9]{8}&r=seller$/);
    expect(rows()[0]).toMatchObject({
      email: "mokytoja@pastas.lt",
      role: "seller",
      seller_type: "mokytojas",
      wants_to_sell: "Biologijos konspektai",
      utm_source: "tiktok",
      referred_by: "abcd1234",
    });
    expect(r.redirect).toContain(`kodas=${rows()[0].ref_code}`);
  });

  it("pardavėjas privalo pasirinkti, kas jis yra", async () => {
    const r = await submit({ email: "a@b.lt", role: "seller" });
    expect(r.state?.error).toMatch(/kas tu esi/i);
    expect(rows()).toHaveLength(0);
  });

  it("pirkėjui pardavėjo laukai neišsaugomi", async () => {
    await submit({ email: "p@b.lt", role: "buyer", seller_type: "mokytojas", wants_to_sell: "x" });
    expect(rows()[0]).toMatchObject({ role: "buyer", seller_type: null, wants_to_sell: null });
  });

  it("neteisingas el. paštas ar rolė — klaida", async () => {
    expect((await submit({ email: "nera-pasto", role: "buyer" })).state?.error).toBeTruthy();
    expect((await submit({ email: "a@b.lt", role: "both" })).state?.error).toBeTruthy();
    expect(rows()).toHaveLength(0);
  });

  it("tas pats el. paštas antrą kartą — tas pats kodas, dublikato nėra", async () => {
    const first = await submit({ email: "a@b.lt", role: "buyer" });
    const second = await submit({ email: "A@b.lt", role: "buyer" });
    expect(rows()).toHaveLength(1);
    expect(second.redirect).toBe(first.redirect);
  });

  it("pirkėjas vėliau užsiregistravęs kaip pardavėjas — tampa pardavėju", async () => {
    await submit({ email: "a@b.lt", role: "buyer" });
    const r = await submit({ email: "a@b.lt", role: "seller", seller_type: "abiturientas", wants_to_sell: "Chemija" });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ role: "seller", seller_type: "abiturientas", wants_to_sell: "Chemija" });
    expect(r.redirect).toContain("r=seller");
  });

  it("netinkamas pakvietimo kodas ignoruojamas", async () => {
    await submit({ email: "a@b.lt", role: "buyer", referred_by: "<script>" });
    expect(rows()[0].referred_by).toBeNull();
  });
});

describe("Šaltinio nustatymas", () => {
  it("UTM → pakvietimas → svetainė → tiesiogiai", () => {
    expect(sourceOf({ utm_source: "TikTok", referred_by: "x" })).toBe("tiktok");
    expect(sourceOf({ referred_by: "abcd1234" })).toBe("pakvietimas");
    expect(sourceOf({ referrer: "l.instagram.com" })).toBe("instagram");
    expect(sourceOf({ referrer: "www.tiktok.com" })).toBe("tiktok");
    expect(sourceOf({ referrer: "www.delfi.lt" })).toBe("delfi.lt");
    expect(sourceOf({})).toBe("tiesiogiai");
  });
});

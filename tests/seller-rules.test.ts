import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "./helpers/fake-supabase";

const SELLER = "11111111-1111-4111-8111-111111111111";

const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof createFakeSupabase> }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import { createProduct, type CreateProductInput } from "@/app/parduoti/actions";

beforeEach(() => {
  h.fake = createFakeSupabase({
    profiles: [{ id: SELLER, is_seller: true, is_verified: false }],
    products: [],
    product_files: [],
  });
  h.fake.loginAs(SELLER);
});

function input(over: Partial<CreateProductInput> = {}): CreateProductInput {
  return {
    title: "Matematikos VBE sprendimai",
    description: "",
    priceEur: "4,99",
    category: "vbe",
    coverImageUrl: null,
    previewImages: [],
    files: [{ storagePath: `${SELLER}/x-sprendimai.pdf`, fileName: "sprendimai.pdf", mimeType: "application/pdf", sizeBytes: 1000 }],
    allowDownload: true,
    rightsConfirmed: true,
    ...over,
  };
}

const products = () => h.fake.tables.products;

describe("Pardavėjo taisyklės įkeliant produktą (serveris)", () => {
  it("be patvirtinimo apie teises į turinį — atmetama", async () => {
    const res = await createProduct(input({ rightsConfirmed: false }));
    expect(res.error).toMatch(/teisę jį parduoti/);
    expect(products()).toHaveLength(0);
  });

  it("neaktyvi ar išjungta kategorija — atmetama", async () => {
    expect((await createProduct(input({ category: "muzika" }))).error).toBeTruthy();
    expect((await createProduct(input({ category: "sablonai" }))).error).toBeTruthy();
    expect(products()).toHaveLength(0);
  });

  it("kaina mažesnė nei 3 € — atmetama", async () => {
    expect((await createProduct(input({ priceEur: "2,50" }))).error).toContain("3,00 €");
    expect(products()).toHaveLength(0);
  });

  it("tinkamas produktas: įrašomas patvirtinimo laikas, laukia patvirtinimo", async () => {
    const res = await createProduct(input());
    expect(res.ok).toBe(true);
    const p = products()[0];
    expect(p).toMatchObject({ category: "vbe", price_cents: 499, status: "pending" });
    expect(typeof p.rights_confirmed_at).toBe("string");
    expect(h.fake.tables.product_files).toHaveLength(1);
  });

  it("Verified pardavėjo produktas skelbiamas iškart", async () => {
    h.fake.tables.profiles[0].is_verified = true;
    await createProduct(input());
    expect(products()[0].status).toBe("live");
  });
});

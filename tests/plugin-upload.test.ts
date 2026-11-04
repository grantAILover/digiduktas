import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase } from "./helpers/fake-supabase";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";

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
    profiles: [
      { id: ADMIN, is_admin: true, is_seller: true },
      // Senas pardavėjas iš turgaus laikų — nebegali kelti
      { id: USER, is_admin: false, is_seller: true },
    ],
    products: [],
    product_files: [],
  });
  h.fake.loginAs(ADMIN);
});

function input(over: Partial<CreateProductInput> = {}, owner = ADMIN): CreateProductInput {
  return {
    title: "Buhalteris",
    description: "",
    priceEur: "69,00",
    coverImageUrl: null,
    previewImages: [],
    files: [{ storagePath: `${owner}/x-buhalteris.zip`, fileName: "buhalteris.zip", mimeType: "application/zip", sizeBytes: 1000 }],
    allowDownload: true,
    ...over,
  };
}

const products = () => h.fake.tables.products;

describe("Pluginų įkėlimas (serveris)", () => {
  it("ne adminas (ir senas pardavėjas) įkelti negali", async () => {
    h.fake.loginAs(USER);
    const res = await createProduct(input({}, USER));
    expect(res.error).toMatch(/administratorius/);
    expect(products()).toHaveLength(0);
  });

  it("neprisijungęs įkelti negali", async () => {
    h.fake.loginAs(null);
    expect((await createProduct(input())).error).toBeTruthy();
    expect(products()).toHaveLength(0);
  });

  it("kaina mažesnė nei 3 € — atmetama", async () => {
    expect((await createProduct(input({ priceEur: "2,50" }))).error).toContain("3,00 €");
    expect(products()).toHaveLength(0);
  });

  it("adminas: pluginas paskelbiamas iškart, kategorija — pluginai", async () => {
    const res = await createProduct(input());
    expect(res.ok).toBe(true);
    expect(products()[0]).toMatchObject({ category: "pluginai", price_cents: 6900, status: "live" });
    expect(h.fake.tables.product_files).toHaveLength(1);
  });
});

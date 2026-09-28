import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createFakeSupabase } from "./helpers/fake-supabase";
import { IDS, seed } from "./helpers/seed";

const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof createFakeSupabase> }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));

import { GET, POST } from "@/app/api/progress/route";

function save(fileId: string, seconds: unknown) {
  return POST(
    new NextRequest("http://localhost/api/progress", {
      method: "POST",
      body: JSON.stringify({ productFileId: fileId, positionSeconds: seconds }),
    }),
  );
}

async function load(productId: string) {
  const res = await GET(new NextRequest(`http://localhost/api/progress?productId=${productId}`));
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  h.fake = createFakeSupabase(seed());
});

describe("Klausymo pozicija — /api/progress", () => {
  it("išsaugoma ir atkuriama", async () => {
    h.fake.loginAs(IDS.buyer);
    expect((await save(IDS.fileLocked, 754.3)).status).toBe(200);

    const { status, body } = await load(IDS.productLocked);
    expect(status).toBe(200);
    expect(body.progress).toEqual([
      expect.objectContaining({ product_file_id: IDS.fileLocked, position_seconds: 754.3 }),
    ]);
  });

  it("nauja pozicija perrašo seną (nedubliuoja)", async () => {
    h.fake.loginAs(IDS.buyer);
    await save(IDS.fileLocked, 100);
    await save(IDS.fileLocked, 200);
    const { body } = await load(IDS.productLocked);
    expect(body.progress).toHaveLength(1);
    expect(body.progress[0].position_seconds).toBe(200);
  });

  it("pozicija priklauso tik tam vartotojui", async () => {
    h.fake.loginAs(IDS.buyer);
    await save(IDS.fileLocked, 300);
    h.fake.loginAs(IDS.seller); // savininkas mato produktą, bet NE pirkėjo poziciją
    const { body } = await load(IDS.productLocked);
    expect(body.progress).toEqual([]);
  });

  it("nepirkęs vartotojas negali saugoti — 403", async () => {
    h.fake.loginAs(IDS.stranger);
    expect((await save(IDS.fileLocked, 10)).status).toBe(403);
    expect(h.fake.tables.playback_progress).toHaveLength(0);
    expect((await load(IDS.productLocked)).status).toBe(403);
  });

  it("neteisingi duomenys — 400", async () => {
    h.fake.loginAs(IDS.buyer);
    expect((await save(IDS.fileLocked, -5)).status).toBe(400);
    expect((await save(IDS.fileLocked, "abc")).status).toBe(400);
    const bad = await POST(
      new NextRequest("http://localhost/api/progress", { method: "POST", body: "{nėra json" }),
    );
    expect(bad.status).toBe(400);
  });

  it("neprisijungusiam — 401", async () => {
    expect((await save(IDS.fileLocked, 10)).status).toBe(401);
    expect((await load(IDS.productLocked)).status).toBe(401);
  });
});

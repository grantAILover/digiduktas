// Integracinis testas su TIKRU Supabase: ar pasibaigusi nuoroda tikrai nebeveikia.
// Paleidimas: npm run test:integration (reikia .env.local su SUPABASE_SERVICE_ROLE_KEY).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const hasSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(!hasSupabase)("Pasirašytos nuorodos (tikras Supabase)", () => {
  // Importuojam tik kai yra raktai (admin klientas juos skaito sukūrimo metu)
  let admin: import("@supabase/supabase-js").SupabaseClient;
  const path = `__tests__/expiry-${crypto.randomUUID()}.txt`;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  beforeAll(async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    admin = createAdminClient();
    const { error } = await admin.storage
      .from("product-files")
      .upload(path, new Blob(["digiduktas testas"], { type: "text/plain" }));
    if (error) throw error;
  });

  afterAll(async () => {
    await admin?.storage.from("product-files").remove([path]);
  });

  it("pasibaigusi nuoroda nebeveikia", async () => {
    const { data } = await admin.storage.from("product-files").createSignedUrl(path, 2);
    const before = await fetch(data!.signedUrl);
    expect(before.status).toBe(200);
    await before.body?.cancel();

    await sleep(3500);
    const after = await fetch(data!.signedUrl);
    expect(after.ok).toBe(false);
    await after.body?.cancel();
  });

  it("peržiūros nuoroda palaiko Range (reikia audio/video persukimui)", async () => {
    const { getPlaybackSource } = await import("@/lib/playback");
    const src = await getPlaybackSource({ storage_path: path, stream_provider: null, stream_ref: null });
    const res = await fetch(src!.url, { headers: { Range: "bytes=0-9" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-disposition") ?? "").not.toContain("attachment");
    expect(await res.text()).toBe("digiduktas");
  });
});

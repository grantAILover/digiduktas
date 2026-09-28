import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createFakeSupabase } from "./helpers/fake-supabase";
import { IDS, seed } from "./helpers/seed";
import { DOWNLOAD_TTL, STREAM_TTL } from "@/lib/files";

// Abu Supabase klientai (vartotojo ir service-role) → ta pati netikra DB
const h = vi.hoisted(() => ({ fake: null as unknown as ReturnType<typeof createFakeSupabase> }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => h.fake.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.fake.client }));

import { GET as streamGET } from "@/app/api/files/[fileId]/stream/route";
import { GET as downloadGET } from "@/app/api/files/[fileId]/download/route";

// Bendras route handler tipas (ctx tipas skiriasi pagal maršrutą, todėl `never`)
type Handler = (req: NextRequest, ctx: never) => Promise<Response>;

function call(handler: Handler, fileId: string, action: "stream" | "download") {
  const req = new NextRequest(`http://localhost/api/files/${fileId}/${action}`);
  return handler(req, { params: Promise.resolve({ fileId }) } as never);
}

beforeEach(() => {
  h.fake = createFakeSupabase(seed());
});

describe("Peržiūros nuoroda — GET /api/files/[id]/stream", () => {
  it("neprisijungusiam — 401", async () => {
    const res = await call(streamGET, IDS.fileOpen, "stream");
    expect(res.status).toBe(401);
    expect(h.fake.signCalls).toHaveLength(0);
  });

  it("nepirkęs vartotojas negauna nuorodos — 403", async () => {
    h.fake.loginAs(IDS.stranger);
    const res = await call(streamGET, IDS.fileOpen, "stream");
    expect(res.status).toBe(403);
    expect((await res.json()).url).toBeUndefined();
    expect(h.fake.signCalls).toHaveLength(0); // nuoroda net nebuvo sukurta
  });

  it("pirkėjas, kuriam grąžinti pinigai — 403", async () => {
    h.fake.loginAs(IDS.refunded);
    const res = await call(streamGET, IDS.fileOpen, "stream");
    expect(res.status).toBe(403);
    expect(h.fake.signCalls).toHaveLength(0);
  });

  it("pirkėjas gauna trumpai galiojančią nuorodą BE atsisiuntimo", async () => {
    h.fake.loginAs(IDS.buyer);
    const res = await call(streamGET, IDS.fileOpen, "stream");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain("storage.test/product-files/");
    expect(body.kind).toBe("pdf");
    expect(h.fake.signCalls).toEqual([
      expect.objectContaining({ bucket: "product-files", ttl: STREAM_TTL, opts: undefined }),
    ]);
    expect(STREAM_TTL).toBeLessThanOrEqual(15 * 60);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("peržiūrėti galima ir kai atsisiuntimas uždraustas", async () => {
    h.fake.loginAs(IDS.buyer);
    const res = await call(streamGET, IDS.fileLocked, "stream");
    expect(res.status).toBe(200);
    expect((await res.json()).canDownload).toBe(false);
  });

  it("pardavėjas ir adminas mato savo/visus failus", async () => {
    h.fake.loginAs(IDS.seller);
    expect((await call(streamGET, IDS.fileLocked, "stream")).status).toBe(200);
    h.fake.loginAs(IDS.admin);
    expect((await call(streamGET, IDS.fileLocked, "stream")).status).toBe(200);
  });

  it("neegzistuojantis ar blogas failo id — 404", async () => {
    h.fake.loginAs(IDS.buyer);
    expect((await call(streamGET, IDS.missing, "stream")).status).toBe(404);
    expect((await call(streamGET, "ne-uuid", "stream")).status).toBe(404);
  });
});

describe("Atsisiuntimas — GET /api/files/[id]/download", () => {
  it("kai allow_download=false — pirkėjui 403, nuoroda neišduodama", async () => {
    h.fake.loginAs(IDS.buyer);
    const res = await call(downloadGET, IDS.fileLocked, "download");
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
    expect(h.fake.signCalls).toHaveLength(0);
  });

  it("kai allow_download=false — pardavėjas savo failą atsisiųsti gali", async () => {
    h.fake.loginAs(IDS.seller);
    const res = await call(downloadGET, IDS.fileLocked, "download");
    expect(res.status).toBe(302);
  });

  it("kai leidžiama — pirkėjas nukreipiamas į 'attachment' nuorodą su failo vardu", async () => {
    h.fake.loginAs(IDS.buyer);
    const res = await call(downloadGET, IDS.fileOpen, "download");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("download=knyga.pdf");
    expect(h.fake.signCalls).toEqual([
      expect.objectContaining({ ttl: DOWNLOAD_TTL, opts: { download: "knyga.pdf" } }),
    ]);
  });

  it("nepirkęs vartotojas — 403", async () => {
    h.fake.loginAs(IDS.stranger);
    expect((await call(downloadGET, IDS.fileOpen, "download")).status).toBe(403);
    expect(h.fake.signCalls).toHaveLength(0);
  });

  it("neprisijungęs — nukreipiamas prisijungti", async () => {
    const res = await call(downloadGET, IDS.fileOpen, "download");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost/auth");
  });
});

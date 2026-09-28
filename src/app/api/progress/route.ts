import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFileAccess, getProductAccess } from "@/lib/access";
import { loadProgress, parseProgressBody, saveProgress } from "@/lib/progress";

export const runtime = "nodejs";

// GET /api/progress?productId=... → vartotojo pozicijos tame produkte
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Prisijunkite." }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId") ?? "";
  const access = await getProductAccess(user.id, productId);
  if (!access.ok) return Response.json({ error: "Nėra prieigos." }, { status: access.status });

  const rows = await loadProgress(supabase, user.id, productId);
  return Response.json({ progress: rows }, { headers: { "Cache-Control": "no-store" } });
}

// POST { productFileId, positionSeconds } → išsaugo poziciją.
// POST (ne PUT), nes naršyklės navigator.sendBeacon moka tik POST.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Prisijunkite." }, { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return Response.json({ error: "Neteisingi duomenys." }, { status: 400 });
  }
  const parsed = parseProgressBody(body);
  if (!parsed) return Response.json({ error: "Neteisingi duomenys." }, { status: 400 });

  const access = await getFileAccess(user.id, parsed.fileId);
  if (!access.ok) return Response.json({ error: "Nėra prieigos." }, { status: access.status });

  // Vartotojo klientas (RLS: galima rašyti tik savo eilutes)
  const ok = await saveProgress(supabase, user.id, access.product.id, parsed.fileId, parsed.seconds);
  if (!ok) return Response.json({ error: "Nepavyko išsaugoti." }, { status: 500 });
  return Response.json({ ok: true });
}

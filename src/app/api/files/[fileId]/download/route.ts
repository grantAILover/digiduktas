import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFileAccess } from "@/lib/access";
import { getDownloadUrl } from "@/lib/playback";

export const runtime = "nodejs";

// Atsisiuntimas. Jei pardavėjas uždraudė atsisiuntimą — 403 serverio pusėje,
// nuoroda neišduodama (net jei kas nors atspėtų šį adresą).
export async function GET(req: NextRequest, ctx: RouteContext<"/api/files/[fileId]/download">) {
  const { fileId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access = await getFileAccess(user?.id ?? null, fileId);
  if (!access.ok) {
    if (access.status === 401) {
      return Response.redirect(new URL("/auth", req.url), 302);
    }
    const msg = access.status === 404 ? "Failas nerastas." : "Neturite prieigos prie šio failo.";
    return new Response(msg, { status: access.status });
  }

  if (!access.canDownload) {
    return new Response("Pardavėjas neleidžia atsisiųsti šio failo — jį galite peržiūrėti naršyklėje.", {
      status: 403,
    });
  }

  const url = await getDownloadUrl(access.file);
  if (!url) return new Response("Nepavyko paruošti failo.", { status: 500 });

  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "no-store" },
  });
}

import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFileAccess } from "@/lib/access";
import { getPlaybackSource } from "@/lib/playback";

export const runtime = "nodejs";

const MESSAGES = {
  401: "Prisijunkite.",
  403: "Neturite prieigos prie šio failo.",
  404: "Failas nerastas.",
} as const;

// Grąžina trumpai galiojančią nuorodą peržiūrai/klausymui (tik pirkėjui, savininkui ar adminui).
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/files/[fileId]/stream">) {
  const { fileId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access = await getFileAccess(user?.id ?? null, fileId);
  if (!access.ok) {
    return Response.json({ error: MESSAGES[access.status] }, { status: access.status });
  }

  const source = await getPlaybackSource(access.file);
  if (!source) {
    return Response.json({ error: "Nepavyko paruošti failo." }, { status: 500 });
  }

  return Response.json(
    {
      ...source,
      kind: access.file.kind,
      mime: access.file.mime_type,
      fileName: access.file.file_name,
      canDownload: access.canDownload,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

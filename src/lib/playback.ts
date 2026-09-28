// Trumpai galiojančios nuorodos į privačius failus. TIK serveriui.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOWNLOAD_TTL, STREAM_TTL } from "@/lib/files";
import type { ProductFile } from "@/lib/access";

const BUCKET = "product-files";

export type PlaybackSource =
  | { type: "file"; url: string; expiresAt: string }
  // Ateičiai: HLS srautas iš Bunny Stream / Cloudflare Stream (adaptyvi kokybė).
  | { type: "hls"; url: string; expiresAt: string };

function expiresIn(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * Šaltinis peržiūrai/klausymui. Nuoroda BE `download` — naršyklė rodo failą inline,
 * Supabase palaiko HTTP Range (persukimas audio/video).
 */
export async function getPlaybackSource(
  file: Pick<ProductFile, "storage_path" | "stream_provider" | "stream_ref">,
  db: SupabaseClient = createAdminClient(),
): Promise<PlaybackSource | null> {
  // Kai video bus perkeltas į Bunny/Cloudflare, čia grąžinsim { type: "hls", url }
  // pagal file.stream_provider + file.stream_ref. Kol neįgyvendinta — tiesioginis failas.

  const { data } = await db.storage.from(BUCKET).createSignedUrl(file.storage_path, STREAM_TTL);
  if (!data?.signedUrl) return null;
  return { type: "file", url: data.signedUrl, expiresAt: expiresIn(STREAM_TTL) };
}

/** Atsisiuntimo nuoroda: `Content-Disposition: attachment` su failo pavadinimu. */
export async function getDownloadUrl(
  file: Pick<ProductFile, "storage_path" | "file_name">,
  db: SupabaseClient = createAdminClient(),
): Promise<string | null> {
  const { data } = await db.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, DOWNLOAD_TTL, { download: file.file_name });
  return data?.signedUrl ?? null;
}

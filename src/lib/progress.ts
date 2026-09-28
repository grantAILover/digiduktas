// Klausymo/žiūrėjimo pozicija. TIK serveriui.
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_SECONDS = 48 * 60 * 60; // apsauga nuo šiukšlių

export type ProgressRow = {
  product_file_id: string;
  position_seconds: number;
  updated_at: string;
};

/** Patikrina užklausos turinį: { productFileId, positionSeconds }. */
export function parseProgressBody(body: unknown): { fileId: string; seconds: number } | null {
  if (!body || typeof body !== "object") return null;
  const { productFileId, positionSeconds } = body as Record<string, unknown>;
  if (typeof productFileId !== "string" || !productFileId) return null;
  const n = Number(positionSeconds);
  if (!Number.isFinite(n) || n < 0) return null;
  return { fileId: productFileId, seconds: Math.min(Math.round(n * 10) / 10, MAX_SECONDS) };
}

export async function saveProgress(
  db: SupabaseClient,
  userId: string,
  productId: string,
  fileId: string,
  seconds: number,
) {
  const { error } = await db.from("playback_progress").upsert(
    {
      user_id: userId,
      product_id: productId,
      product_file_id: fileId,
      position_seconds: seconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_file_id" },
  );
  return !error;
}

/** Visos vartotojo pozicijos produkte, naujausia — pirma. */
export async function loadProgress(
  db: SupabaseClient,
  userId: string,
  productId: string,
): Promise<ProgressRow[]> {
  const { data } = await db
    .from("playback_progress")
    .select("product_file_id, position_seconds, updated_at")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .order("updated_at", { ascending: false });
  return (data ?? []).map((r) => ({ ...r, position_seconds: Number(r.position_seconds) }));
}

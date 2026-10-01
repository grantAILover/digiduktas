// Founding vietos ir komisija. TIK serveriui.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformFee } from "@/lib/stripe";
import { FOUNDING_LIMIT, foundingActive } from "@/lib/founding";

/** Kiek founding vietų jau užimta (null — nepavyko nuskaityti). */
export async function foundingTaken(db: SupabaseClient = createAdminClient()): Promise<number | null> {
  const { count, error } = await db.from("founding_slots").select("id", { count: "exact", head: true });
  return error ? null : (count ?? 0);
}

/**
 * Rezervuoja founding vietą (atomiškai DB funkcija). Grąžina vietos numerį arba null,
 * jei vietų nebėra. Klaida — nekritinė (registracija vis tiek pavyksta).
 */
export async function claimFoundingSlot(
  email: string,
  userId: string | null = null,
  db: SupabaseClient = createAdminClient(),
): Promise<number | null> {
  const { data, error } = await db.rpc("claim_founding_slot", {
    p_email: email.toLowerCase(),
    p_user_id: userId,
    p_limit: FOUNDING_LIMIT,
  });
  if (error) return null;
  return typeof data === "number" ? data : null;
}

export async function isFoundingSeller(
  sellerId: string,
  db: SupabaseClient = createAdminClient(),
): Promise<boolean> {
  const { data } = await db.from("founding_slots").select("id").eq("user_id", sellerId).maybeSingle();
  return !!data;
}

/**
 * Platformos komisija konkrečiam pardavėjui: founding pardavėjams iki termino — 0,
 * kitiems — įprasta. Jei patikrinti nepavyksta — įprasta komisija (saugus numatytasis).
 */
export async function sellerFeeCents(
  sellerId: string,
  priceCents: number,
  db: SupabaseClient = createAdminClient(),
  now: Date = new Date(),
): Promise<number> {
  if (foundingActive(now) && (await isFoundingSeller(sellerId, db))) return 0;
  return platformFee(priceCents);
}

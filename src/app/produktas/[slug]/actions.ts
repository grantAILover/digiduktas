"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportState = { ok?: boolean; error?: string } | null;

export async function reportProduct(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const productId = String(formData.get("productId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!productId) return { error: "Įvyko klaida." };
  if (!reason) return { error: "Pasirinkite priežastį." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prisijunkite, kad galėtumėte pranešti." };

  const fullReason = details ? `${reason} — ${details}` : reason;
  const { error } = await supabase.from("reports").insert({
    product_id: productId,
    reporter_id: user.id,
    reason: fullReason,
  });

  if (error) return { error: "Nepavyko išsiųsti. Bandykite dar kartą." };
  return { ok: true };
}

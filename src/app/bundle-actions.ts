"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBundleForm } from "@/lib/bundle";
import { sendBundleRequestNotice } from "@/lib/email";

export type BundleFormState = { ok?: boolean; error?: string } | null;

/** Daugiausia tiek užklausų iš to paties el. pašto per valandą (apsauga nuo šlamšto). */
const MAX_PER_HOUR = 3;

// Komplekto užklausa — vieša forma pagrindiniame puslapyje
export async function submitBundleRequest(
  _prev: BundleFormState,
  formData: FormData,
): Promise<BundleFormState> {
  const db = createAdminClient();

  // Pažymėti galima tik šiuo metu paskelbtus pluginus
  const { data: live } = await db.from("products").select("title").eq("status", "live");
  const parsed = parseBundleForm(formData, (live ?? []).map((p) => p.title as string));
  if (parsed.spam) return { ok: true }; // botui atrodo, kad pavyko
  if (!parsed.data) return { error: parsed.error };
  const r = parsed.data;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("bundle_requests")
    .select("id", { count: "exact", head: true })
    .eq("email", r.email)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return { error: "Jūsų užklausą jau gavome — atsakysime artimiausiu metu." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await db.from("bundle_requests").insert({
    user_id: user?.id ?? null,
    ...r,
    created_at: new Date().toISOString(),
  });
  if (error) return { error: "Nepavyko išsiųsti. Bandykite dar kartą arba parašykite mums el. paštu." };

  await sendBundleRequestNotice(r);
  return { ok: true };
}

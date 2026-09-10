"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Grąžina Supabase klientą TIK jei prisijungęs naudotojas yra adminas.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return supabase;
}

export async function approveSeller(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  const appId = String(formData.get("appId"));
  const userId = String(formData.get("userId"));
  await supabase.from("profiles").update({ is_seller: true }).eq("id", userId);
  await supabase
    .from("seller_applications")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", appId);
  revalidatePath("/admin");
}

export async function rejectSeller(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  const appId = String(formData.get("appId"));
  await supabase
    .from("seller_applications")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", appId);
  revalidatePath("/admin");
}

export async function setProductStatus(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  const productId = String(formData.get("productId"));
  const status = String(formData.get("status"));
  const allowed = ["live", "pending", "suspended", "removed"];
  if (!allowed.includes(status)) return;
  await supabase.from("products").update({ status }).eq("id", productId);
  revalidatePath("/admin");
}

export async function toggleVerified(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  const userId = String(formData.get("userId"));
  const value = formData.get("value") === "true";
  await supabase.from("profiles").update({ is_verified: value }).eq("id", userId);
  revalidatePath("/admin");
}

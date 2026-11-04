"use server";

import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";

export async function setProductStatus(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;
  const productId = String(formData.get("productId"));
  const status = String(formData.get("status"));
  const allowed = ["live", "pending", "suspended", "removed"];
  if (!allowed.includes(status)) return;
  await admin.supabase.from("products").update({ status }).eq("id", productId);
  revalidatePath("/admin");
}

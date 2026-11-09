"use server";

import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isInstallStatus } from "@/lib/install";
import { isBundleStatus } from "@/lib/bundle";
import { revalidatePath } from "next/cache";

// Diegimo darbo būsena: naujas → suderinta → įdiegta
export async function setInstallStatus(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!isInstallStatus(status)) return;
  await createAdminClient()
    .from("install_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/pirkiniai");
}

// Komplekto užklausos būsena: nauja → atsakyta → uždaryta
export async function setBundleStatus(formData: FormData) {
  if (!(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!isBundleStatus(status)) return;
  await createAdminClient().from("bundle_requests").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

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

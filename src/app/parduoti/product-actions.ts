"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EditState = { error?: string } | null;

export type UpdateProductInput = {
  id: string;
  title: string;
  description: string;
  priceEur: string;
  category: string;
  coverImageUrl?: string | null;
};

export async function updateProduct(
  input: UpdateProductInput,
): Promise<EditState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prisijunkite iš naujo." };

  const title = input.title.trim();
  if (!title) return { error: "Įrašykite pavadinimą." };

  const priceCents = Math.round(parseFloat(input.priceEur.replace(",", ".")) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return { error: "Neteisinga kaina." };
  }

  const patch: Record<string, unknown> = {
    title,
    description: input.description.trim() || null,
    price_cents: priceCents,
    category: input.category || null,
    updated_at: new Date().toISOString(),
  };
  if (input.coverImageUrl) patch.cover_image_url = input.coverImageUrl;

  // RLS: products_update_own → tik savininkas
  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", input.id)
    .eq("seller_id", user.id);
  if (error) return { error: "Nepavyko išsaugoti." };

  revalidatePath("/parduoti");
  redirect("/parduoti");
}

// Soft-delete: status='removed' (užsakymų istorija išlieka; produktas dingsta iš turgaus)
export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const id = String(formData.get("productId") ?? "");
  await supabase
    .from("products")
    .update({ status: "removed" })
    .eq("id", id)
    .eq("seller_id", user.id);

  revalidatePath("/parduoti");
}

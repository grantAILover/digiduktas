"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ApplyState = { error?: string } | null;

// ── Pardavėjo paraiška (#1) ─────────────────────────────────
export async function applySeller(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Pirma prisijunk." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const portfolio_url = String(formData.get("portfolio_url") ?? "").trim();

  if (!full_name) return { error: "Įrašyk savo vardą." };

  const { error } = await supabase.from("seller_applications").insert({
    user_id: user.id,
    full_name,
    about: about || null,
    portfolio_url: portfolio_url || null,
  });

  if (error) return { error: "Nepavyko pateikti paraiškos. Bandyk dar kartą." };

  revalidatePath("/parduoti");
  redirect("/parduoti");
}

// ── Produkto sukūrimas (#3) ─────────────────────────────────
export type CreateProductInput = {
  title: string;
  description: string;
  priceEur: string;
  category: string;
  coverImageUrl: string | null;
  filePath: string;
};

export type CreateProductResult = { ok?: boolean; slug?: string; error?: string };

function slugify(input: string): string {
  const map: Record<string, string> = {
    ą: "a", č: "c", ę: "e", ė: "e", į: "i", š: "s", ų: "u", ū: "u", ž: "z",
  };
  return input
    .toLowerCase()
    .replace(/[ąčęėįšųūž]/g, (m) => map[m] ?? m)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<CreateProductResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Pirma prisijunk." };

  // Tik patvirtinti pardavėjai gali kurti
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .single();
  if (!profile?.is_seller) {
    return { error: "Tavo pardavėjo paraiška dar nepatvirtinta." };
  }

  const title = input.title.trim();
  if (!title) return { error: "Įrašyk pavadinimą." };
  if (!input.filePath) return { error: "Įkelk parduodamą failą." };

  const normalized = input.priceEur.replace(",", ".");
  const priceCents = Math.round(parseFloat(normalized) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return { error: "Neteisinga kaina." };
  }

  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase.from("products").insert({
    seller_id: user.id,
    title,
    slug,
    description: input.description.trim() || null,
    price_cents: priceCents,
    category: input.category || null,
    cover_image_url: input.coverImageUrl,
    file_path: input.filePath,
    status: "pending", // laukia admino patvirtinimo (#4)
  });

  if (error) return { error: "Nepavyko išsaugoti produkto." };

  revalidatePath("/parduoti");
  return { ok: true, slug };
}

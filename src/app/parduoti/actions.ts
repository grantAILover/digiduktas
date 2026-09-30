"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePriceEur, priceError } from "@/lib/pricing";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkFileCount,
  effectiveAllowDownload,
  toNewFileRow,
  type NewFileInput,
  type NewFileRow,
} from "@/lib/product-files-server";

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
  if (!user) return { error: "Pirma prisijunkite." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const portfolio_url = String(formData.get("portfolio_url") ?? "").trim();

  if (!full_name) return { error: "Įrašykite savo vardą." };

  const { error } = await supabase.from("seller_applications").insert({
    user_id: user.id,
    full_name,
    about: about || null,
    portfolio_url: portfolio_url || null,
  });

  if (error) return { error: "Nepavyko pateikti paraiškos. Bandykite dar kartą." };

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
  previewImages?: string[];
  files: NewFileInput[]; // tvarka = skyrių tvarka
  allowDownload: boolean;
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
  if (!user) return { error: "Pirma prisijunkite." };

  // Tik patvirtinti pardavėjai gali kurti
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller, is_verified")
    .eq("id", user.id)
    .single();
  if (!profile?.is_seller) {
    return { error: "Jūsų pardavėjo paraiška dar nepatvirtinta." };
  }

  // Verified kūrėjų produktai skelbiami iškart; kitų — peržiūrimi
  const status = profile.is_verified ? "live" : "pending";

  const title = input.title.trim();
  if (!title) return { error: "Įrašykite pavadinimą." };

  const countError = checkFileCount(input.files?.length ?? 0);
  if (countError) return { error: countError };
  const fileRows: NewFileRow[] = [];
  for (const f of input.files) {
    const row = toNewFileRow(user.id, f);
    if (!row) return { error: "Neteisingas failas. Įkelkite iš naujo." };
    fileRows.push(row);
  }

  const priceCents = parsePriceEur(input.priceEur);
  const priceProblem = priceError(priceCents);
  if (priceProblem || priceCents === null) return { error: priceProblem ?? "Neteisinga kaina." };

  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      seller_id: user.id,
      title,
      slug,
      description: input.description.trim() || null,
      price_cents: priceCents,
      category: input.category || null,
      cover_image_url: input.coverImageUrl,
      preview_images: (input.previewImages ?? []).slice(0, 7),
      file_path: fileRows[0].storage_path, // atgaliniam suderinamumui
      allow_download: effectiveAllowDownload(
        !!input.allowDownload,
        fileRows.map((r) => r.kind),
      ),
      status, // verified → 'live', kiti → 'pending' (peržiūra)
    })
    .select("id")
    .single();

  if (error || !product) return { error: "Nepavyko išsaugoti produkto." };

  const { error: filesError } = await supabase
    .from("product_files")
    .insert(fileRows.map((r, i) => ({ ...r, product_id: product.id, position: i })));
  if (filesError) {
    // Be failų produktas beprasmis — atšaukiam (savininkas trinti negali, tad per admin)
    await createAdminClient().from("products").delete().eq("id", product.id);
    return { error: "Nepavyko išsaugoti failų. Bandykite dar kartą." };
  }

  revalidatePath("/parduoti");
  return { ok: true, slug };
}

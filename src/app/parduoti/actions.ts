"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import { parseOptionalPrice, parsePriceEur, priceError } from "@/lib/pricing";
import { PLUGIN_CATEGORY } from "@/lib/categories";
import { parsePluginDetails, type PluginDetailsInput } from "@/lib/plugin-details";
import { revalidatePath } from "next/cache";
import {
  checkFileCount,
  effectiveAllowDownload,
  toNewFileRow,
  type NewFileInput,
  type NewFileRow,
} from "@/lib/product-files-server";

// ── Plugino sukūrimas (tik adminas) ─────────────────────────
export type CreateProductInput = PluginDetailsInput & {
  title: string;
  description: string;
  priceEur: string;
  installPriceEur?: string; // „Su įdiegimu"; tuščia — lygis nesiūlomas
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
  const admin = await requireAdmin();
  if (!admin) return { error: "Pluginus įkelti gali tik administratorius." };
  const { supabase, user } = admin;

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
  const install = parseOptionalPrice(input.installPriceEur);
  if (install.error) return { error: install.error };
  const details = parsePluginDetails(input);
  if (!details.data) return { error: details.error };

  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      seller_id: user.id,
      title,
      slug,
      description: input.description.trim() || null,
      price_cents: priceCents,
      install_price_cents: install.cents,
      requirements: details.data.requirements,
      demo_url: details.data.demo_url,
      category: PLUGIN_CATEGORY,
      cover_image_url: input.coverImageUrl,
      preview_images: (input.previewImages ?? []).slice(0, 7),
      file_path: fileRows[0].storage_path, // atgaliniam suderinamumui
      rights_confirmed_at: new Date().toISOString(), // savas turinys
      allow_download: effectiveAllowDownload(
        !!input.allowDownload,
        fileRows.map((r) => r.kind),
      ),
      status: "live", // savi pluginai — skelbiami iškart
    })
    .select("id")
    .single();

  if (error || !product) return { error: "Nepavyko išsaugoti plugino." };

  const { error: filesError } = await supabase
    .from("product_files")
    .insert(fileRows.map((r, i) => ({ ...r, product_id: product.id, position: i })));
  if (filesError) {
    // Be failų pluginas beprasmis — atšaukiam
    await createAdminClient().from("products").delete().eq("id", product.id);
    return { error: "Nepavyko išsaugoti failų. Bandykite dar kartą." };
  }

  // Diegimo instrukcija — atskiroje, tik serveriui pasiekiamoje lentelėje
  if (details.data.install_guide) {
    await createAdminClient()
      .from("product_guides")
      .upsert(
        { product_id: product.id, install_guide: details.data.install_guide, updated_at: new Date().toISOString() },
        { onConflict: "product_id" },
      );
  }

  revalidatePath("/parduoti");
  return { ok: true, slug };
}

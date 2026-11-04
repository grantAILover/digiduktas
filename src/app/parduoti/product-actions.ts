"use server";

import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FileKind } from "@/lib/files";
import { parseOptionalPrice, parsePriceEur, priceError } from "@/lib/pricing";
import {
  checkFileCount,
  effectiveAllowDownload,
  isExisting,
  toNewFileRow,
  type FileInput,
  type NewFileRow,
} from "@/lib/product-files-server";

export type EditState = { error?: string } | null;

export type UpdateProductInput = {
  id: string;
  title: string;
  description: string;
  priceEur: string;
  installPriceEur?: string; // „Su įdiegimu"; tuščia — lygis nesiūlomas
  coverImageUrl?: string | null;
  previewImages?: string[]; // jei nurodyta — pakeičia visą peržiūrų sąrašą
  files?: FileInput[]; // jei nurodyta — galutinis failų sąrašas (tvarka = skyrių tvarka)
  allowDownload: boolean;
};

type Planned = { existingId: string } | { row: NewFileRow };

export async function updateProduct(
  input: UpdateProductInput,
): Promise<EditState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Pluginus redaguoti gali tik administratorius." };
  const { supabase, user } = admin;

  const title = input.title.trim();
  if (!title) return { error: "Įrašykite pavadinimą." };

  const priceCents = parsePriceEur(input.priceEur);
  const priceProblem = priceError(priceCents);
  if (priceProblem || priceCents === null) return { error: priceProblem ?? "Neteisinga kaina." };
  const install = parseOptionalPrice(input.installPriceEur);
  if (install.error) return { error: install.error };

  const patch: Record<string, unknown> = {
    title,
    description: input.description.trim() || null,
    price_cents: priceCents,
    install_price_cents: install.cents,
    updated_at: new Date().toISOString(),
  };
  if (input.coverImageUrl) patch.cover_image_url = input.coverImageUrl;
  if (input.previewImages) patch.preview_images = input.previewImages.slice(0, 7);

  // Savininko patikra (toliau failus keičiam vartotojo klientu — RLS irgi saugo)
  const { data: owned } = await supabase
    .from("products")
    .select("id")
    .eq("id", input.id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "Pluginas nerastas." };

  const { data: currentRows } = await supabase
    .from("product_files")
    .select("id, storage_path, kind")
    .eq("product_id", input.id);
  const current = new Map(
    (currentRows ?? []).map((r) => [r.id as string, r as { storage_path: string; kind: FileKind }]),
  );
  let finalKinds: FileKind[] = [...current.values()].map((r) => r.kind);

  if (input.files) {
    const countError = checkFileCount(input.files.length);
    if (countError) return { error: countError };

    if (input.files.some((f) => !isExisting(f))) patch.rights_confirmed_at = new Date().toISOString();

    const plan: Planned[] = [];
    const seen = new Set<string>();
    for (const f of input.files) {
      if (isExisting(f)) {
        if (!current.has(f.id) || seen.has(f.id)) {
          return { error: "Failų sąrašas pasikeitė. Perkraukite puslapį." };
        }
        seen.add(f.id);
        plan.push({ existingId: f.id });
      } else {
        const row = toNewFileRow(user.id, f);
        if (!row) return { error: "Neteisingas failas. Įkelkite iš naujo." };
        plan.push({ row });
      }
    }

    // 1) nauji, 2) esamų tvarka, 3) pašalinti — tokia eilė, kad produktas nė akimirkai neliktų be failų
    const newRows = plan.flatMap((p, i) =>
      "row" in p ? [{ ...p.row, product_id: input.id, position: i }] : [],
    );
    if (newRows.length) {
      const { error } = await supabase.from("product_files").insert(newRows);
      if (error) return { error: "Nepavyko išsaugoti failų." };
    }
    for (const [i, p] of plan.entries()) {
      if ("existingId" in p) {
        await supabase.from("product_files").update({ position: i }).eq("id", p.existingId);
      }
    }
    const removed = [...current.keys()].filter((id) => !seen.has(id));
    if (removed.length) {
      // Pastaba: failas saugykloje lieka (pirkėjai jo nebepasieks — prieiga tik per product_files)
      await supabase.from("product_files").delete().in("id", removed);
    }

    finalKinds = plan.map((p) => ("row" in p ? p.row.kind : current.get(p.existingId)!.kind));
    const first = plan[0];
    patch.file_path = "row" in first ? first.row.storage_path : current.get(first.existingId)!.storage_path;
  }

  patch.allow_download = effectiveAllowDownload(!!input.allowDownload, finalKinds);

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

// Soft-delete: status='removed' (užsakymų istorija išlieka; pluginas dingsta iš katalogo)
export async function deleteProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  const { supabase, user } = admin;

  const id = String(formData.get("productId") ?? "");
  await supabase
    .from("products")
    .update({ status: "removed" })
    .eq("id", id)
    .eq("seller_id", user.id);

  revalidatePath("/parduoti");
}

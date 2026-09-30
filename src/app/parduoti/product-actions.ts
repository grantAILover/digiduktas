"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FileKind } from "@/lib/files";
import { parsePriceEur, priceError } from "@/lib/pricing";
import { isActiveCategory } from "@/lib/categories";
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
  category: string;
  coverImageUrl?: string | null;
  previewImages?: string[]; // jei nurodyta — pakeičia visą peržiūrų sąrašą
  files?: FileInput[]; // jei nurodyta — galutinis failų sąrašas (tvarka = skyrių tvarka)
  allowDownload: boolean;
  rightsConfirmed?: boolean; // privaloma, kai pridedami nauji failai
};

type Planned = { existingId: string } | { row: NewFileRow };

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

  const priceCents = parsePriceEur(input.priceEur);
  const priceProblem = priceError(priceCents);
  if (priceProblem || priceCents === null) return { error: priceProblem ?? "Neteisinga kaina." };

  const patch: Record<string, unknown> = {
    title,
    description: input.description.trim() || null,
    price_cents: priceCents,
    category: input.category || null,
    updated_at: new Date().toISOString(),
  };
  if (input.coverImageUrl) patch.cover_image_url = input.coverImageUrl;
  if (input.previewImages) patch.preview_images = input.previewImages.slice(0, 7);

  // Savininko patikra (toliau failus keičiam vartotojo klientu — RLS irgi saugo)
  const { data: owned } = await supabase
    .from("products")
    .select("id, category")
    .eq("id", input.id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "Produktas nerastas." };

  // Galima pasirinkti aktyvią kategoriją arba palikti esamą (net jei ji nebeaktyvi)
  if (!isActiveCategory(input.category) && input.category !== owned.category) {
    return { error: "Pasirinkite kategoriją." };
  }

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

    // Nauji failai → naujas patvirtinimas dėl teisių
    if (input.files.some((f) => !isExisting(f))) {
      if (input.rightsConfirmed !== true) {
        return { error: "Patvirtinkite, kad naujų failų turinys yra jūsų sukurtas arba turite teisę jį parduoti." };
      }
      patch.rights_confirmed_at = new Date().toISOString();
    }

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

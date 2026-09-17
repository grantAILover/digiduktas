"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { createProduct } from "../actions";
import ProductGallery from "@/components/ProductGallery";

const MAX_PREVIEWS = 7; // + viršelis = iki 8 galerijoje

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(-80);
}

export default function ProductForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [dots, setDots] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Animuoti taškai, kad nesijaustų užstrigę
  useEffect(() => {
    if (!busy) {
      setDots("");
      return;
    }
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, [busy]);

  // Vietiniai URL'ai peržiūrai „kaip matys pirkėjas"
  const galleryUrls = useMemo(() => {
    const files = [coverFile, ...previewFiles].filter(Boolean) as File[];
    return files.map((f) => URL.createObjectURL(f));
  }, [coverFile, previewFiles]);

  useEffect(() => {
    return () => galleryUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryUrls]);

  function onPickPreviews(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setError(null);
    if (picked.length > MAX_PREVIEWS) {
      setError(`Peržiūros nuotraukų daugiausia ${MAX_PREVIEWS}.`);
    }
    setPreviewFiles(picked.slice(0, MAX_PREVIEWS));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const title = String(fd.get("title") ?? "").trim();
      const description = String(fd.get("description") ?? "");
      const priceEur = String(fd.get("price") ?? "");
      const category = String(fd.get("category") ?? "");
      const productFile = fd.get("file") as File | null;

      if (!title) throw new Error("Įrašykite pavadinimą.");
      if (!productFile || productFile.size === 0)
        throw new Error("Pasirinkite parduodamą failą.");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesija baigėsi. Prisijunkite iš naujo.");

      const uploadImage = async (file: File) => {
        const path = `${user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("covers").upload(path, file);
        if (upErr) throw new Error(`Nepavyko įkelti paveikslėlio: ${upErr.message}`);
        return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      };

      // 1. Viršelis (nebūtina) → viešas 'covers' bucket'as
      let coverImageUrl: string | null = null;
      if (coverFile && coverFile.size > 0) {
        setProgress("Keliamas viršelis");
        coverImageUrl = await uploadImage(coverFile);
      }

      // 2. Peržiūros nuotraukos → viešas 'covers' bucket'as
      const previewImages: string[] = [];
      for (let k = 0; k < previewFiles.length; k++) {
        setProgress(`Keliamos peržiūros (${k + 1}/${previewFiles.length})`);
        previewImages.push(await uploadImage(previewFiles[k]));
      }

      // 3. Parduodamas failas → privatus 'product-files' bucket'as
      setProgress("Keliamas failas");
      const filePath = `${user.id}/${crypto.randomUUID()}-${safeName(productFile.name)}`;
      const { error: fileErr } = await supabase.storage
        .from("product-files")
        .upload(filePath, productFile);
      if (fileErr) throw new Error(`Nepavyko įkelti failo: ${fileErr.message}`);

      // 4. Įrašom produktą per server action
      setProgress("Išsaugoma");
      const res = await createProduct({
        title,
        description,
        priceEur,
        category,
        coverImageUrl,
        previewImages,
        filePath,
      });
      if (res.error) throw new Error(res.error);

      router.push("/parduoti");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kažkas nepavyko.");
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Pavadinimas
        <input
          name="title"
          type="text"
          required
          placeholder="Pvz. Notion produktyvumo šablonas"
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Aprašymas
        <textarea
          name="description"
          rows={4}
          placeholder="Ką pirkėjas gaus? Kam tinka?"
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Kaina (€)
          <input
            name="price"
            type="text"
            inputMode="decimal"
            required
            placeholder="9.99"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Kategorija
          <select
            name="category"
            required
            defaultValue=""
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
          >
            <option value="" disabled>
              Pasirink…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Viršelio paveiksliukas (nebūtina)
        <input
          name="cover"
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Peržiūros nuotraukos (nebūtina, iki {MAX_PREVIEWS})
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onPickPreviews}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
        />
        <span className="text-xs text-muted">
          Ką pirkėjas mato prieš pirkdamas — pavyzdžiai iš produkto vidaus. Nerodykite viso turinio.
        </span>
      </label>

      {galleryUrls.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="w-fit rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft"
        >
          Peržiūrėti kaip matys pirkėjas ({galleryUrls.length})
        </button>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Parduodamas failas
        <input
          name="file"
          type="file"
          required
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
        />
        <span className="text-xs text-muted">
          Failas privatus — pirkėjai gauna jį tik po apmokėjimo.
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? `${progress || "Keliama"}${dots}` : "Įkelti produktą"}
      </button>

      {/* „Kaip matys pirkėjas" modalas */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Kaip matys pirkėjas</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-sm text-muted hover:text-ink"
              >
                Uždaryti ✕
              </button>
            </div>
            <ProductGallery images={galleryUrls} title="Peržiūra" />
          </div>
        </div>
      )}
    </form>
  );
}

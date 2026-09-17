"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { updateProduct } from "../../product-actions";
import ProductGallery from "@/components/ProductGallery";

const MAX_PREVIEWS = 7;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(-80);
}

const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand";

export default function EditProductForm({
  product,
}: {
  product: {
    id: string;
    title: string;
    description: string | null;
    price_cents: number;
    category: string | null;
    cover_image_url: string | null;
    preview_images?: string[] | null;
  };
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(product.cover_image_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Peržiūros: jau esančios (URL) + naujai pridėtos (failai)
  const [keptPreviews, setKeptPreviews] = useState<string[]>(
    Array.isArray(product.preview_images) ? product.preview_images : [],
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewsDirty, setPreviewsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const newFileUrls = useMemo(
    () => newFiles.map((f) => URL.createObjectURL(f)),
    [newFiles],
  );
  useEffect(() => {
    return () => newFileUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFileUrls]);

  const totalPreviews = keptPreviews.length + newFiles.length;

  function removeKept(url: string) {
    setKeptPreviews((prev) => prev.filter((u) => u !== url));
    setPreviewsDirty(true);
  }
  function removeNew(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewsDirty(true);
  }
  function onAddPreviews(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const room = MAX_PREVIEWS - totalPreviews;
    if (room <= 0) {
      setError(`Peržiūros nuotraukų daugiausia ${MAX_PREVIEWS}.`);
      return;
    }
    setNewFiles((prev) => [...prev, ...picked.slice(0, room)]);
    setPreviewsDirty(true);
    setError(null);
    e.target.value = "";
  }

  const galleryUrls = [
    coverFile ? URL.createObjectURL(coverFile) : product.cover_image_url,
    ...keptPreviews,
    ...newFileUrls,
  ].filter(Boolean) as string[];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
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

      let coverImageUrl: string | null = null;
      if (coverFile && coverFile.size > 0) {
        coverImageUrl = await uploadImage(coverFile);
      }

      // Peržiūros — tik jei kažkas keitėsi
      let previewImages: string[] | undefined;
      if (previewsDirty) {
        const uploaded: string[] = [];
        for (const f of newFiles) uploaded.push(await uploadImage(f));
        previewImages = [...keptPreviews, ...uploaded];
      }

      const res = await updateProduct({
        id: product.id,
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        priceEur: String(fd.get("price") ?? ""),
        category: String(fd.get("category") ?? ""),
        coverImageUrl,
        previewImages,
      });
      if (res?.error) throw new Error(res.error);
      // sėkmės atveju updateProduct redirect'ina į /parduoti
    } catch (err) {
      setError(err instanceof Error ? err.message : "Įvyko klaida.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Pavadinimas
        <input name="title" type="text" required defaultValue={product.title} className={inputCls} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Aprašymas
        <textarea
          name="description"
          rows={4}
          defaultValue={product.description ?? ""}
          className={inputCls}
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
            defaultValue={(product.price_cents / 100).toFixed(2)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Kategorija
          <select name="category" required defaultValue={product.category ?? ""} className={inputCls}>
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
        Viršelis (palik tuščią, jei nekeiti)
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-24 w-32 rounded-lg object-cover" />
        )}
        <input
          name="cover"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setCoverFile(f);
            if (f) setPreview(URL.createObjectURL(f));
          }}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
        />
      </label>

      {/* Peržiūros nuotraukos */}
      <div className="flex flex-col gap-2 text-sm font-medium">
        Peržiūros nuotraukos ({totalPreviews}/{MAX_PREVIEWS})
        {(keptPreviews.length > 0 || newFiles.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {keptPreviews.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
                <button
                  type="button"
                  onClick={() => removeKept(url)}
                  aria-label="Pašalinti"
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-surface"
                >
                  ✕
                </button>
              </div>
            ))}
            {newFileUrls.map((url, idx) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-16 rounded-lg border border-brand object-cover" />
                <button
                  type="button"
                  onClick={() => removeNew(idx)}
                  aria-label="Pašalinti"
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-surface"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onAddPreviews}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
        />
        <span className="text-xs font-normal text-muted">
          Ką pirkėjas mato prieš pirkdamas. Nerodykite viso turinio.
        </span>
      </div>

      {galleryUrls.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="w-fit rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft"
        >
          Peržiūrėti kaip matys pirkėjas ({galleryUrls.length})
        </button>
      )}

      <p className="text-xs text-muted">
        Parduodamo failo pakeisti negalima — jei reikia kito failo, pašalink produktą ir įkelk naują.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Saugoma…" : "Išsaugoti pakeitimus"}
      </button>

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

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { updateProduct } from "../../product-actions";

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
  };
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(product.cover_image_url);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      const coverFile = fd.get("cover") as File | null;

      let coverImageUrl: string | null = null;
      if (coverFile && coverFile.size > 0) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sesija baigėsi. Prisijunkite iš naujo.");
        const path = `${user.id}/${crypto.randomUUID()}-${safeName(coverFile.name)}`;
        const { error: upErr } = await supabase.storage
          .from("covers")
          .upload(path, coverFile);
        if (upErr) throw new Error(`Nepavyko įkelti viršelio: ${upErr.message}`);
        coverImageUrl = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      }

      const res = await updateProduct({
        id: product.id,
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        priceEur: String(fd.get("price") ?? ""),
        category: String(fd.get("category") ?? ""),
        coverImageUrl,
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
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
        />
      </label>

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
    </form>
  );
}

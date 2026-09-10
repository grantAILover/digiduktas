import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

export const metadata = {
  title: "Produktai",
  description:
    "Naršykite lietuviškus skaitmeninius produktus: šablonus, presetus, e-knygas, kursus ir daugiau.",
};

type RawRow = Omit<ProductCardData, "seller"> & {
  profiles:
    | { display_name: string | null; is_verified: boolean }
    | { display_name: string | null; is_verified: boolean }[]
    | null;
};

export default async function ProduktaiPage({
  searchParams,
}: PageProps<"/produktai">) {
  const sp = await searchParams;
  const kategorija = typeof sp.kategorija === "string" ? sp.kategorija : null;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "slug, title, price_cents, category, cover_image_url, profiles:seller_id(display_name, is_verified)",
    )
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (kategorija) query = query.eq("category", kategorija);

  const { data } = await query;
  const products: ProductCardData[] = ((data as RawRow[]) ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    price_cents: p.price_cents,
    category: p.category,
    cover_image_url: p.cover_image_url,
    seller: Array.isArray(p.profiles) ? (p.profiles[0] ?? null) : p.profiles,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Produktai</h1>

      {/* Kategorijų filtras */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/produktai"
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            !kategorija
              ? "border-brand bg-brand text-surface"
              : "border-line bg-surface hover:border-brand"
          }`}
        >
          Visos
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/produktai?kategorija=${c.slug}`}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              kategorija === c.slug
                ? "border-brand bg-brand text-surface"
                : "border-line bg-surface hover:border-brand"
            }`}
          >
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {/* Sąrašas */}
      {products.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-4xl">🌱</p>
          <p className="mt-3 font-medium">Kol kas produktų čia nėra</p>
          <p className="mt-1 text-sm text-muted">
            Pirmieji kūrėjai jau ruošiami — netrukus čia bus ką atrasti.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

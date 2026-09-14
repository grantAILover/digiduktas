import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryName } from "@/lib/categories";
import ProductCard, { VerifiedBadge, eur, type ProductCardData } from "@/components/ProductCard";
import ReportButton from "./ReportButton";
import ReviewForm from "./ReviewForm";
import { createCheckout } from "./actions";

export const dynamic = "force-dynamic";

type Seller = { display_name: string | null; is_verified: boolean };

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, seller_id, title, description, price_cents, category, cover_image_url, status, profiles:seller_id(display_name, is_verified)",
    )
    .eq("slug", slug)
    .maybeSingle();
  // RLS grąžina ne-'live' produktą tik savininkui/adminui, tad papildomo tikrinimo nereikia
  if (!data) return null;
  const seller: Seller | null = Array.isArray(data.profiles)
    ? (data.profiles[0] ?? null)
    : data.profiles;
  return { ...data, seller };
}

export async function generateMetadata({ params }: PageProps<"/produktas/[slug]">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produktas nerastas" };
  return {
    title: p.title,
    description: p.description?.slice(0, 155) ?? undefined,
  };
}

export default async function ProduktasPage({
  params,
  searchParams,
}: PageProps<"/produktas/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const p = await getProduct(slug);
  if (!p) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === p.seller_id;

  // Daugiau iš to paties kūrėjo
  const { data: moreRaw } = await supabase
    .from("products")
    .select("slug, title, price_cents, category, cover_image_url, created_at")
    .eq("seller_id", p.seller_id)
    .eq("status", "live")
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(4);
  const more: ProductCardData[] = (moreRaw ?? []).map((m) => ({
    ...m,
    seller: {
      display_name: p.seller?.display_name ?? null,
      is_verified: p.seller?.is_verified ?? false,
    },
  }));

  // Atsiliepimai
  const { data: reviewsRaw } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, buyer_id, profiles:buyer_id(display_name)")
    .eq("product_id", p.id)
    .order("created_at", { ascending: false });
  const reviews = reviewsRaw ?? [];
  const reviewCount = reviews.length;
  const avg = reviewCount
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
    : 0;
  const hasReviewed = !!user && reviews.some((r) => r.buyer_id === user.id);

  let hasPurchased = false;
  if (user && !isOwner) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", user.id)
      .eq("product_id", p.id)
      .eq("status", "paid");
    hasPurchased = (count ?? 0) > 0;
  }
  const canReview = !!user && !isOwner && hasPurchased && !hasReviewed;
  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/produktai" className="text-sm text-muted hover:text-ink">
        ← Atgal į produktus
      </Link>

      {sp?.pirkta === "1" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ Ačiū! Apmokėjimas gautas. (Automatinį failo pristatymą pridėsime netrukus.)
        </div>
      )}

      {p.status !== "live" && (
        <div className="mt-4 rounded-lg border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand-dark">
          {p.status === "pending"
            ? "Šis produktas dar laukia patvirtinimo — matomas tik jums."
            : p.status === "suspended"
              ? "Šis produktas sustabdytas — matomas tik jums."
              : "Šis produktas nepaskelbtas — matomas tik jums."}
        </div>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Viršelis */}
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-brand-soft">
          {p.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.cover_image_url}
              alt={p.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-6xl">🗂️</div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {p.category && (
            <Link
              href={`/produktai?kategorija=${p.category}`}
              className="w-fit rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark transition-colors hover:bg-brand hover:text-surface"
            >
              {categoryName(p.category)}
            </Link>
          )}
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{p.title}</h1>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <Link href={`/kurejas/${p.seller_id}`} className="hover:text-ink">
              {p.seller?.display_name ?? "Kūrėjas"}
            </Link>
            {p.seller?.is_verified && <VerifiedBadge />}
          </p>

          {reviewCount > 0 && (
            <p className="mt-1 text-sm text-brand">
              {stars(Math.round(avg))}{" "}
              <span className="text-muted">
                {avg.toFixed(1)} ({reviewCount})
              </span>
            </p>
          )}

          <p className="mt-6 text-3xl font-bold text-brand">
            {eur(p.price_cents)}
          </p>

          {sp?.err === "seller" && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Šis pardavėjas dar nepriima mokėjimų. Pabandykite vėliau.
            </p>
          )}

          {isOwner ? (
            <p className="mt-4 rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-muted">
              Tai jūsų produktas.
            </p>
          ) : (
            <form action={createCheckout}>
              <input type="hidden" name="productId" value={p.id} />
              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark sm:w-auto"
              >
                Pirkti — {eur(p.price_cents)}
              </button>
            </form>
          )}
          <p className="mt-2 text-xs text-muted">
            Saugus apmokėjimas per Stripe. Po apmokėjimo failą gausite iškart.
          </p>

          {p.description && (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="text-sm font-semibold">Aprašymas</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">
                {p.description}
              </p>
            </div>
          )}

          <ReportButton productId={p.id} isLoggedIn={!!user} />
        </div>
      </div>

      {/* Atsiliepimai */}
      <section className="mt-14 border-t border-line pt-8">
        <h2 className="text-lg font-bold tracking-tight">
          Atsiliepimai{" "}
          {reviewCount > 0 && <span className="text-muted">({reviewCount})</span>}
        </h2>

        {canReview && <ReviewForm productId={p.id} slug={slug} />}
        {user && !isOwner && !hasPurchased && (
          <p className="mt-3 text-sm text-muted">
            Atsiliepimą galėsite palikti nusipirkę šį produktą.
          </p>
        )}

        {reviewCount === 0 ? (
          <p className="mt-3 text-sm text-muted">Kol kas atsiliepimų nėra.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {reviews.map((r, i) => {
              const rn = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
              return (
                <div key={i} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-brand">{stars(r.rating)}</span>
                    <span className="text-sm font-medium">
                      {rn?.display_name ?? "Pirkėjas"}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-muted">{r.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {more.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Daugiau iš šio kūrėjo</h2>
            <Link
              href={`/kurejas/${p.seller_id}`}
              className="text-sm font-medium text-brand hover:text-brand-dark"
            >
              Visi →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {more.map((m) => (
              <ProductCard key={m.slug} p={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

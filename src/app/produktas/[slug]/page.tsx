import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categoryName } from "@/lib/categories";
import { VerifiedBadge, eur } from "@/components/ProductCard";
import ReportButton from "./ReportButton";

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
  if (!data || data.status !== "live") return null;
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
}: PageProps<"/produktas/[slug]">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/produktai" className="text-sm text-muted hover:text-ink">
        ← Atgal į produktus
      </Link>

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
            <span className="w-fit rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">
              {categoryName(p.category)}
            </span>
          )}
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{p.title}</h1>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <Link href={`/kurejas/${p.seller_id}`} className="hover:text-ink">
              {p.seller?.display_name ?? "Kūrėjas"}
            </Link>
            {p.seller?.is_verified && <VerifiedBadge />}
          </p>

          <p className="mt-6 text-3xl font-bold text-brand">
            {eur(p.price_cents)}
          </p>

          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface opacity-60 sm:w-auto"
          >
            Pirkti — netrukus
          </button>
          <p className="mt-2 text-xs text-muted">
            Mokėjimai bus įjungti netrukus. Po apmokėjimo failą gausite iškart.
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
    </div>
  );
}

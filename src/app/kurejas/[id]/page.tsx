import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard, { type ProductCardData, VerifiedBadge } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

async function getSeller(id: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url, is_verified, is_seller, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile || !profile.is_seller) return null;

  const { data: products } = await supabase
    .from("products")
    .select("slug, title, price_cents, category, cover_image_url")
    .eq("seller_id", id)
    .eq("status", "live")
    .order("created_at", { ascending: false });

  return { profile, products: products ?? [] };
}

export async function generateMetadata({ params }: PageProps<"/kurejas/[id]">) {
  const { id } = await params;
  const data = await getSeller(id);
  if (!data) return { title: "Kūrėjas nerastas" };
  return {
    title: data.profile.display_name ?? "Kūrėjas",
    description: data.profile.bio?.slice(0, 155) ?? undefined,
  };
}

export default async function KurejasPage({ params }: PageProps<"/kurejas/[id]">) {
  const { id } = await params;
  const data = await getSeller(id);
  if (!data) notFound();
  const { profile, products } = data;

  const name = profile.display_name ?? "Kūrėjas";
  const initial = name.charAt(0).toUpperCase();
  const year = new Date(profile.created_at).getFullYear();

  const items: ProductCardData[] = products.map((p) => ({
    ...p,
    seller: { display_name: name, is_verified: profile.is_verified },
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Profilio antraštė */}
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-2xl font-bold text-surface">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            {name}
            {profile.is_verified && <VerifiedBadge />}
          </h1>
          <p className="text-sm text-muted">
            {products.length} {products.length === 1 ? "produktas" : "produktai"} ·
            Narys nuo {year}
          </p>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 max-w-2xl text-sm text-muted">{profile.bio}</p>
      )}

      {/* Produktai */}
      <div className="mt-10">
        {items.length === 0 ? (
          <p className="text-sm text-muted">Šis kūrėjas dar neturi paskelbtų produktų.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

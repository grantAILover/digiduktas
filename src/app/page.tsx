import { createClient } from "@/lib/supabase/server";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

// Pluginų sąrašas visada aktualus (įkėlus naują — matosi iškart)
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("slug, title, price_cents, cover_image_url, created_at")
    .eq("status", "live")
    .order("created_at", { ascending: false });
  const plugins: ProductCardData[] = data ?? [];

  return (
    <div>
      {/* Aprašymas */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Atsikratykite rankų darbo —{" "}
            <span className="text-brand">leiskite DI tai padaryti už jus</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            DI pluginai, kurie atlieka pasikartojančius darbus: tvarko sąskaitas, sutikrina
            banko išrašus ir dar daugiau. Įsidiekite patys arba leiskite mums viską įdiegti
            ir pritaikyti jūsų poreikiams.
          </p>
          <a
            href="#pluginai"
            className="mt-8 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
          >
            Peržiūrėti pluginus
          </a>
          <p className="mt-4 text-xs text-muted">Pluginams reikalinga mokama Claude paskyra.</p>
        </div>
      </section>

      {/* Pluginai */}
      <section id="pluginai" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Pluginai</h2>
        {plugins.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
            <p className="font-medium">Pirmieji pluginai netrukus</p>
            <p className="mt-1 text-sm text-muted">Jau ruošiame — užsukite po kelių dienų.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {plugins.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

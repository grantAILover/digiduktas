import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eur } from "@/components/ProductCard";

export const metadata = { title: "Mano pirkiniai" };
export const dynamic = "force-dynamic";

export default async function PirkiniaiPage({
  searchParams,
}: PageProps<"/pirkiniai">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const sp = await searchParams;

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, price_cents, created_at, products(title, slug), downloads(token)")
    .eq("buyer_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  const rows = orders ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Mano pirkiniai</h1>

      {sp?.pirkta === "1" && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Ačiū! Apmokėjimas gautas. Jūsų pirkinys žemiau.
        </div>
      )}
      {sp?.klaida && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Nepavyko atsisiųsti. Bandykite dar kartą arba susisiekite su mumis.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-medium">Dar nieko nepirkote</p>
          <Link
            href="/produktai"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
          >
            Naršyti produktus
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {rows.map((o) => {
            const product = Array.isArray(o.products) ? o.products[0] : o.products;
            const download = Array.isArray(o.downloads) ? o.downloads[0] : o.downloads;
            return (
              <div
                key={o.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={product?.slug ? `/produktas/${product.slug}` : "#"}
                    className="truncate font-semibold hover:text-brand"
                  >
                    {product?.title ?? "Produktas"}
                  </Link>
                  <p className="text-xs text-muted">{eur(o.price_cents)}</p>
                </div>
                {download?.token ? (
                  <a
                    href={`/atsisiusti/${download.token}`}
                    className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
                  >
                    Atsisiųsti
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-muted">Ruošiama…</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

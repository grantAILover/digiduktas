import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import DeleteProductButton from "./DeleteProductButton";
import { CoverPlaceholder } from "@/components/ProductCard";

export const metadata = { title: "Pluginų valdymas" };

const statusLabels: Record<string, { text: string; cls: string }> = {
  draft: { text: "Juodraštis", cls: "bg-line text-ink" },
  pending: { text: "Nepaskelbta", cls: "bg-brand-soft text-brand-dark" },
  live: { text: "Paskelbta", cls: "bg-success-soft text-success" },
  suspended: { text: "Sustabdyta", cls: "bg-danger-soft text-danger" },
  removed: { text: "Pašalinta", cls: "bg-danger-soft text-danger" },
};

function eur(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

// Pluginų valdymas — tik adminui (pluginų savininkui)
export default async function PluginuValdymasPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  const { supabase, user } = admin;

  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, price_cents, cover_image_url, status, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Pluginų valdymas</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/parduoti/statistika"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft"
          >
            Statistika
          </Link>
          <Link
            href="/parduoti/naujas"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
          >
            + Naujas pluginas
          </Link>
        </div>
      </div>

      {!products?.length ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-muted">Dar neturite pluginų.</p>
          <Link
            href="/parduoti/naujas"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
          >
            Įkelti pirmą pluginą
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {products.map((p) => {
            const s = statusLabels[p.status] ?? statusLabels.draft;
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-soft text-xl">
                    {p.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CoverPlaceholder />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/produktas/${p.slug}`}
                      className="block truncate font-semibold hover:text-brand"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs">
                      <span className={`rounded-md px-1.5 py-0.5 font-medium ${s.cls}`}>{s.text}</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="mr-1 font-semibold text-brand">{eur(p.price_cents)}</span>
                  <Link
                    href={`/pirkiniai/${p.id}`}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand-soft"
                    title="Kaip failus matys pirkėjas"
                  >
                    Failai
                  </Link>
                  <Link
                    href={`/parduoti/${p.id}/redaguoti`}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand-soft"
                  >
                    Redaguoti
                  </Link>
                  <DeleteProductButton productId={p.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

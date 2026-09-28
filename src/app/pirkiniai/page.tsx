import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eur } from "@/components/ProductCard";
import { KIND_LABEL, isViewable, type FileKind } from "@/lib/files";

export const metadata = { title: "Mano pirkiniai" };

type OrderProduct = {
  id: string;
  title: string;
  slug: string;
  allow_download: boolean;
  product_files: { id: string; kind: FileKind; position: number }[];
};
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
    .select(
      "id, price_cents, created_at, products(id, title, slug, allow_download, product_files(id, kind, position))",
    )
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
            const raw = Array.isArray(o.products) ? o.products[0] : o.products;
            const product = raw as OrderProduct | null;
            const files = [...(product?.product_files ?? [])].sort((a, b) => a.position - b.position);
            const kinds = [...new Set(files.map((f) => KIND_LABEL[f.kind]))].join(", ");

            // „Atidaryti" — kai yra ką peržiūrėti naršyklėje arba keli failai (sąrašas).
            // „Atsisiųsti" — tik jei pardavėjas leidžia; keliems failams — viewer'yje prie kiekvieno.
            const canOpen = files.some((f) => isViewable(f.kind)) || files.length > 1;
            const directDownload = product?.allow_download && files.length === 1;

            return (
              <div
                key={o.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={product?.slug ? `/produktas/${product.slug}` : "#"}
                    className="truncate font-semibold hover:text-brand"
                  >
                    {product?.title ?? "Produktas"}
                  </Link>
                  <p className="text-xs text-muted">
                    {eur(o.price_cents)}
                    {kinds && ` · ${kinds}`}
                    {files.length > 1 && ` · ${files.length} failai`}
                  </p>
                </div>
                {files.length === 0 || !product ? (
                  <span className="shrink-0 text-xs text-muted">Ruošiama…</span>
                ) : (
                  <div className="flex shrink-0 gap-2">
                    {canOpen && (
                      <Link
                        href={`/pirkiniai/${product.id}`}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
                      >
                        Atidaryti
                      </Link>
                    )}
                    {directDownload && (
                      <a
                        href={`/api/files/${files[0].id}/download`}
                        className={
                          canOpen
                            ? "rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft"
                            : "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
                        }
                      >
                        Atsisiųsti
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

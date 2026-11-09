import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eur } from "@/components/ProductCard";
import { KIND_LABEL, type FileKind } from "@/lib/files";
import { fulfillFromReturn } from "@/lib/fulfillment";
import { TIER_LABEL } from "@/lib/tiers";
import InstallForm, { type ExistingInstall } from "./InstallForm";

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

  // Grįžus iš Stripe: jei webhook'as vėluoja ar nesuveikė — įvykdom užsakymą patys
  // (idempotentiška, dvigubo užsakymo nebus)
  if (typeof sp?.session_id === "string") {
    await fulfillFromReturn(sp.session_id, user.id);
  }

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select(
      "id, tier, price_cents, created_at, products(id, title, slug, allow_download, product_files(id, kind, position))",
    )
    .eq("buyer_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  const rows = orders ?? [];

  // Diegimo anketos „Su įdiegimu" užsakymams
  const installOrderIds = rows.filter((o) => o.tier === "install").map((o) => o.id);
  const installs = new Map<string, ExistingInstall>();
  if (installOrderIds.length) {
    const { data } = await admin
      .from("install_requests")
      .select("order_id, phone, preferred_time, os, tools, notes, status")
      .in("order_id", installOrderIds);
    for (const r of data ?? []) installs.set(r.order_id, r as ExistingInstall);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Mano pirkiniai</h1>

      {sp?.pirkta === "1" && (
        <div className="mt-4 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Ačiū! Apmokėjimas gautas. Jūsų pirkinys žemiau.
        </div>
      )}
      {sp?.klaida && (
        <div className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          Nepavyko atsisiųsti. Bandykite dar kartą arba susisiekite su mumis.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-medium">Dar nieko nepirkote</p>
          <Link
            href="/#pluginai"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
          >
            Peržiūrėti pluginus
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {rows.map((o) => {
            const raw = Array.isArray(o.products) ? o.products[0] : o.products;
            const product = raw as OrderProduct | null;
            const files = [...(product?.product_files ?? [])].sort((a, b) => a.position - b.position);
            const kinds = [...new Set(files.map((f) => KIND_LABEL[f.kind]))].join(", ");

            // „Atidaryti" — visada: ten diegimo instrukcija ir failų sąrašas.
            // „Atsisiųsti" — tik jei leidžiama; keliems failams — viewer'yje prie kiekvieno.
            const canOpen = true;
            const directDownload = product?.allow_download && files.length === 1;

            return (
              <div key={o.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={product?.slug ? `/produktas/${product.slug}` : "#"}
                    className="truncate font-semibold hover:text-brand"
                  >
                    {product?.title ?? "Produktas"}
                  </Link>
                  <p className="text-xs text-muted">
                    {eur(o.price_cents)}
                    {o.tier === "install" && ` · ${TIER_LABEL.install}`}
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
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
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
                            : "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
                        }
                      >
                        Atsisiųsti
                      </a>
                    )}
                  </div>
                )}
              </div>
              {o.tier === "install" && <InstallForm orderId={o.id} existing={installs.get(o.id) ?? null} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categoryName } from "@/lib/categories";
import { eur } from "@/components/ProductCard";
import {
  approveSeller,
  rejectSeller,
  setProductStatus,
  toggleVerified,
  resolveReport,
} from "./actions";

export const metadata = { title: "Admin" };

function sellerName(profiles: unknown): string {
  const s = Array.isArray(profiles) ? profiles[0] : profiles;
  return (s as { display_name?: string })?.display_name ?? "—";
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) notFound();

  const [
    { data: apps },
    { data: pending },
    { data: listings },
    { data: sellers },
    { data: reports },
  ] = await Promise.all([
      supabase
        .from("seller_applications")
        .select("id, user_id, full_name, about, portfolio_url, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("products")
        .select("id, title, price_cents, category, file_path, created_at, profiles:seller_id(display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("products")
        .select("id, title, slug, status, price_cents, profiles:seller_id(display_name)")
        .in("status", ["live", "suspended"])
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, display_name, is_verified")
        .eq("is_seller", true)
        .order("display_name", { ascending: true }),
      supabase
        .from("reports")
        .select("id, reason, created_at, products:product_id(title, slug)")
        .eq("status", "open")
        .order("created_at", { ascending: true }),
    ]);

  // Pasirašytos nuorodos peržiūrėti pending produktų failus
  const pendingWithUrls = await Promise.all(
    (pending ?? []).map(async (p) => {
      let fileUrl: string | null = null;
      if (p.file_path) {
        const { data } = await supabase.storage
          .from("product-files")
          .createSignedUrl(p.file_path, 3600);
        fileUrl = data?.signedUrl ?? null;
      }
      return { ...p, fileUrl };
    }),
  );

  const btn =
    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-muted">
        Pardavėjų paraiškos, produktų peržiūra ir valdymas.
      </p>

      {/* 1. Pardavėjų paraiškos */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Pardavėjų paraiškos{" "}
          <span className="text-muted">({apps?.length ?? 0})</span>
        </h2>
        {!apps?.length ? (
          <p className="mt-2 text-sm text-muted">Naujų paraiškų nėra.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {apps.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="font-semibold">{a.full_name}</div>
                {a.about && <p className="mt-1 text-sm text-muted">{a.about}</p>}
                {a.portfolio_url && (
                  <a
                    href={a.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-brand hover:underline"
                  >
                    {a.portfolio_url}
                  </a>
                )}
                <div className="mt-3 flex gap-2">
                  <form action={approveSeller}>
                    <input type="hidden" name="appId" value={a.id} />
                    <input type="hidden" name="userId" value={a.user_id} />
                    <button className={`${btn} bg-brand text-surface hover:bg-brand-dark`}>
                      Patvirtinti
                    </button>
                  </form>
                  <form action={rejectSeller}>
                    <input type="hidden" name="appId" value={a.id} />
                    <button className={`${btn} border border-line hover:bg-brand-soft`}>
                      Atmesti
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Produktai peržiūrai */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Produktai peržiūrai{" "}
          <span className="text-muted">({pendingWithUrls.length})</span>
        </h2>
        {!pendingWithUrls.length ? (
          <p className="mt-2 text-sm text-muted">Nėra laukiančių peržiūros.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pendingWithUrls.map((p) => (
              <div key={p.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.title}</div>
                    <div className="text-xs text-muted">
                      {sellerName(p.profiles)} · {categoryName(p.category)} · {eur(p.price_cents)}
                    </div>
                  </div>
                  {p.fileUrl && (
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-brand hover:underline"
                    >
                      Peržiūrėti failą ↗
                    </a>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <form action={setProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="status" value="live" />
                    <button className={`${btn} bg-brand text-surface hover:bg-brand-dark`}>
                      Skelbti
                    </button>
                  </form>
                  <form action={setProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="status" value="removed" />
                    <button className={`${btn} border border-line hover:bg-brand-soft`}>
                      Atmesti
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skundai */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Skundai <span className="text-muted">({reports?.length ?? 0})</span>
        </h2>
        {!reports?.length ? (
          <p className="mt-2 text-sm text-muted">Naujų skundų nėra.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {reports.map((r) => {
              const prod = Array.isArray(r.products) ? r.products[0] : r.products;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    {prod?.slug ? (
                      <Link
                        href={`/produktas/${prod.slug}`}
                        className="text-sm font-medium hover:text-brand"
                      >
                        {prod?.title ?? "Produktas"}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium">Produktas pašalintas</span>
                    )}
                    <p className="text-xs text-muted">{r.reason}</p>
                  </div>
                  <form action={resolveReport}>
                    <input type="hidden" name="reportId" value={r.id} />
                    <button className={`${btn} border border-line hover:bg-brand-soft`}>
                      Pažymėti išspręsta
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Verified kūrėjai */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Pardavėjai <span className="text-muted">({sellers?.length ?? 0})</span>
        </h2>
        {!sellers?.length ? (
          <p className="mt-2 text-sm text-muted">Dar nėra pardavėjų.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {sellers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {s.display_name ?? "—"}
                  {s.is_verified && (
                    <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">
                      Verified
                    </span>
                  )}
                </span>
                <form action={toggleVerified}>
                  <input type="hidden" name="userId" value={s.id} />
                  <input type="hidden" name="value" value={(!s.is_verified).toString()} />
                  <button className={`${btn} border border-line hover:bg-brand-soft`}>
                    {s.is_verified ? "Nuimti Verified" : "Duoti Verified"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Paskelbti produktai */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Paskelbti produktai{" "}
          <span className="text-muted">({listings?.length ?? 0})</span>
        </h2>
        {!listings?.length ? (
          <p className="mt-2 text-sm text-muted">Dar nėra paskelbtų produktų.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {listings.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5"
              >
                <div className="min-w-0">
                  <Link href={`/produktas/${p.slug}`} className="truncate text-sm font-medium hover:text-brand">
                    {p.title}
                  </Link>
                  <span className="ml-2 text-xs text-muted">
                    {sellerName(p.profiles)}
                    {p.status === "suspended" && " · sustabdyta"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  {p.status === "live" ? (
                    <form action={setProductStatus}>
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="status" value="suspended" />
                      <button className={`${btn} border border-line hover:bg-brand-soft`}>
                        Sustabdyti
                      </button>
                    </form>
                  ) : (
                    <form action={setProductStatus}>
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="status" value="live" />
                      <button className={`${btn} bg-brand text-surface hover:bg-brand-dark`}>
                        Atkurti
                      </button>
                    </form>
                  )}
                  <form action={setProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="status" value="removed" />
                    <button className={`${btn} border border-line text-red-700 hover:bg-red-50`}>
                      Pašalinti
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

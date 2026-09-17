import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Statistika" };
export const dynamic = "force-dynamic";

function eur(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

const MONTHS_SHORT = [
  "sau", "vas", "kov", "bal", "geg", "bir",
  "lie", "rgp", "rgs", "spa", "lap", "grd",
];

export default async function StatistikaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .single();
  if (!profile?.is_seller) redirect("/parduoti");

  // 1. Pardavėjo produktai
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, title, slug")
    .eq("seller_id", user.id);

  const productList = products ?? [];
  const productMap = new Map(productList.map((p) => [p.id, p]));
  const ids = productList.map((p) => p.id);

  // 2. Apmokėti užsakymai už tuos produktus
  let orders: {
    product_id: string;
    seller_amount_cents: number;
    price_cents: number;
    created_at: string;
  }[] = [];
  if (ids.length) {
    const { data } = await admin
      .from("orders")
      .select("product_id, seller_amount_cents, price_cents, created_at")
      .in("product_id", ids)
      .eq("status", "paid");
    orders = data ?? [];
  }

  // 3. Agregavimas
  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const thisMonthKey = monthKey(now);

  let totalEarned = 0;
  let monthEarned = 0;
  let monthCount = 0;

  const perProduct = new Map<string, { count: number; earned: number }>();
  // Paskutinių 6 mėn. kibirai
  const buckets: { key: string; label: string; earned: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: MONTHS_SHORT[d.getMonth()], earned: 0 });
  }
  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  for (const o of orders) {
    const amt = o.seller_amount_cents || 0;
    totalEarned += amt;

    const created = new Date(o.created_at);
    const mk = monthKey(created);
    if (mk === thisMonthKey) {
      monthEarned += amt;
      monthCount += 1;
    }
    const b = bucketMap.get(mk);
    if (b) b.earned += amt;

    const pp = perProduct.get(o.product_id) ?? { count: 0, earned: 0 };
    pp.count += 1;
    pp.earned += amt;
    perProduct.set(o.product_id, pp);
  }

  const totalCount = orders.length;
  const maxBucket = Math.max(1, ...buckets.map((b) => b.earned));

  // Produktų eilutės, rūšiuotos pagal uždarbį
  const rows = [...perProduct.entries()]
    .map(([pid, v]) => ({ product: productMap.get(pid), ...v }))
    .sort((a, b) => b.earned - a.earned);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistika</h1>
          <p className="mt-1 text-sm text-muted">Jūsų pardavimų apžvalga.</p>
        </div>
        <Link
          href="/parduoti"
          className="shrink-0 rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft"
        >
          Mano produktai
        </Link>
      </div>

      {/* KPI kortelės */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Uždarbis (viso)</p>
          <p className="mt-1 text-2xl font-bold text-brand">{eur(totalEarned)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Pardavimai (viso)</p>
          <p className="mt-1 text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Šį mėnesį</p>
          <p className="mt-1 text-2xl font-bold">{eur(monthEarned)}</p>
          <p className="mt-0.5 text-xs text-muted">{monthCount} pard.</p>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="font-medium">Dar nėra pardavimų</p>
          <p className="mt-1 text-sm text-muted">
            Kai kas nors nusipirks jūsų produktą, statistika atsiras čia.
          </p>
        </div>
      ) : (
        <>
          {/* Mėnesių grafikas */}
          <section className="mt-8 rounded-xl border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-muted">
              Uždarbis (paskutiniai 6 mėn.)
            </h2>
            <div className="mt-5 flex items-end justify-between gap-3" style={{ height: 160 }}>
              {buckets.map((b) => {
                const h = Math.round((b.earned / maxBucket) * 130);
                return (
                  <div key={b.key} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-medium text-ink">
                      {b.earned > 0 ? eur(b.earned) : ""}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-brand transition-all"
                        style={{ height: Math.max(b.earned > 0 ? 4 : 0, h) }}
                      />
                    </div>
                    <span className="text-xs text-muted">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pagal produktą */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-muted">Pagal produktą</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-brand-soft text-left text-xs text-brand-dark">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Produktas</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Pardavimai</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Uždarbis</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-line bg-surface">
                      <td className="px-4 py-3">
                        {r.product?.slug ? (
                          <Link
                            href={`/produktas/${r.product.slug}`}
                            className="font-medium hover:text-brand"
                          >
                            {r.product.title}
                          </Link>
                        ) : (
                          <span className="text-muted">Pašalintas produktas</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{r.count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand">
                        {eur(r.earned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="mt-8 text-xs text-muted">
        Uždarbis — suma, kuri tenka jums, atskaičius platformos komisiją. Išmokas
        į banko sąskaitą tvarko Stripe.
      </p>
    </div>
  );
}

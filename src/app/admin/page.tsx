import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import { sourceOf, sellerTypeLabel } from "@/lib/sources";
import { eur } from "@/components/ProductCard";
import { setProductStatus } from "./actions";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();
  const { supabase } = admin;

  // Visi paskelbti / sustabdyti pluginai (įskaitant senus testinius kitų paskyrų)
  const { data: listings } = await supabase
    .from("products")
    .select("id, title, slug, status, price_cents")
    .in("status", ["live", "suspended"])
    .order("created_at", { ascending: false });

  // Laukiančiųjų sąrašas (lentelė pasiekiama tik service-role klientu)
  const { data: waitlistRaw } = await createAdminClient()
    .from("waitlist")
    .select("id, email, role, seller_type, wants_to_sell, contact, utm_source, referred_by, referrer, ref_code, created_at")
    .order("created_at", { ascending: false });
  const waitlist = waitlistRaw ?? [];
  const sellersWaiting = waitlist.filter((w) => w.role === "seller" || w.role === "both").length;
  const invitedBy = new Map<string, number>();
  for (const w of waitlist) {
    if (w.referred_by) invitedBy.set(w.referred_by, (invitedBy.get(w.referred_by) ?? 0) + 1);
  }

  const btn =
    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted">Laukiančiųjų sąrašas ir paskelbti pluginai.</p>
        </div>
        <Link
          href="/parduoti"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
        >
          Pluginų valdymas
        </Link>
      </div>

      {/* 0. Laukiančiųjų sąrašas */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Laukiančiųjų sąrašas <span className="text-muted">({waitlist.length})</span>
          </h2>
          <a
            href="/admin/waitlist.csv"
            className={`${btn} border border-line hover:bg-brand-soft`}
          >
            Atsisiųsti CSV
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-brand/30 bg-surface p-4">
            <p className="text-xs text-muted">Pardavėjai (tikslas 10)</p>
            <p className="mt-1 text-2xl font-bold text-brand">{sellersWaiting} / 10</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Pirkėjai</p>
            <p className="mt-1 text-2xl font-bold">{waitlist.length - sellersWaiting}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Atėjo per pakvietimą</p>
            <p className="mt-1 text-2xl font-bold">{waitlist.filter((w) => w.referred_by).length}</p>
          </div>
        </div>
        {waitlist.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-brand-soft text-xs text-brand-dark">
                <tr>
                  <th className="px-3 py-2 font-semibold">El. paštas</th>
                  <th className="px-3 py-2 font-semibold">Rolė</th>
                  <th className="px-3 py-2 font-semibold">Ką parduotų</th>
                  <th className="px-3 py-2 font-semibold">Šaltinis</th>
                  <th className="px-3 py-2 font-semibold">Pakvietė</th>
                  <th className="px-3 py-2 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w) => (
                  <tr key={w.id} className="border-t border-line bg-surface align-top">
                    <td className="px-3 py-2 font-medium">
                      {w.email}
                      {w.contact && <span className="block text-xs font-normal text-brand-dark">{w.contact}</span>}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {w.role === "seller" ? "Pardavėjas" : w.role === "buyer" ? "Pirkėjas" : "Abu"}
                      {w.seller_type && (
                        <span className="block text-xs">{sellerTypeLabel(w.seller_type)}</span>
                      )}
                    </td>
                    <td className="max-w-56 px-3 py-2 text-muted">{w.wants_to_sell ?? "—"}</td>
                    <td className="px-3 py-2 text-muted">{sourceOf(w)}</td>
                    <td className="px-3 py-2 text-muted">
                      {w.ref_code ? invitedBy.get(w.ref_code) ?? 0 : 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted">
                      {new Date(w.created_at).toLocaleDateString("lt-LT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Paskelbti pluginai */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Paskelbti pluginai{" "}
          <span className="text-muted">({listings?.length ?? 0})</span>
        </h2>
        {!listings?.length ? (
          <p className="mt-2 text-sm text-muted">Dar nėra paskelbtų pluginų.</p>
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
                    {eur(p.price_cents)}
                    {p.status === "suspended" && " · sustabdyta"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/pirkiniai/${p.id}`}
                    target="_blank"
                    className={`${btn} border border-line hover:bg-brand-soft`}
                  >
                    Failai ↗
                  </Link>
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
                      <button className={`${btn} bg-brand text-on-brand hover:bg-brand-dark`}>
                        Atkurti
                      </button>
                    </form>
                  )}
                  <form action={setProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="status" value="removed" />
                    <button className={`${btn} border border-line text-danger hover:bg-danger-soft`}>
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

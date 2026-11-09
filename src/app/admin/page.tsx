import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import { sourceOf, sellerTypeLabel } from "@/lib/sources";
import { eur } from "@/components/ProductCard";
import { INSTALL_STATUS_LABEL, OS_LABEL, type InstallOs, type InstallStatus } from "@/lib/install";
import { BUNDLE_STATUS_LABEL, type BundleStatus } from "@/lib/bundle";
import { setBundleStatus, setInstallStatus, setProductStatus } from "./actions";

const STATUS_ORDER: Record<InstallStatus, number> = { naujas: 0, suderinta: 1, idiegta: 2 };
const STATUS_CLS: Record<InstallStatus, string> = {
  naujas: "bg-brand-soft text-brand-dark",
  suderinta: "bg-line text-ink",
  idiegta: "bg-success-soft text-success",
};

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

  // Diegimo anketos: nauji viršuje, tada pagal datą
  const { data: installsRaw } = await createAdminClient()
    .from("install_requests")
    .select("id, email, phone, preferred_time, os, tools, notes, status, created_at, orders(price_cents, products(title))")
    .order("created_at", { ascending: false });
  const installs = (installsRaw ?? [])
    .map((r) => {
      const order = Array.isArray(r.orders) ? r.orders[0] : r.orders;
      const product = order && (Array.isArray(order.products) ? order.products[0] : order.products);
      return { ...r, status: r.status as InstallStatus, title: (product?.title as string) ?? "Pluginas" };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const newInstalls = installs.filter((r) => r.status === "naujas").length;

  // Komplekto užklausos: naujos viršuje
  const { data: bundlesRaw } = await createAdminClient()
    .from("bundle_requests")
    .select("id, name, email, phone, plugins, message, status, created_at")
    .order("created_at", { ascending: false });
  const BUNDLE_ORDER: Record<BundleStatus, number> = { naujas: 0, atsakyta: 1, uzdaryta: 2 };
  const bundles = (bundlesRaw ?? [])
    .map((b) => ({ ...b, status: b.status as BundleStatus, plugins: (b.plugins ?? []) as string[] }))
    .sort((a, b) => BUNDLE_ORDER[a.status] - BUNDLE_ORDER[b.status]);
  const newBundles = bundles.filter((b) => b.status === "naujas").length;

  const btn =
    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted">Diegimai, paskelbti pluginai ir laukiančiųjų sąrašas.</p>
        </div>
        <Link
          href="/parduoti"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark"
        >
          Pluginų valdymas
        </Link>
      </div>

      {/* Diegimai („Su įdiegimu" anketos) */}
      <section id="diegimai" className="mt-8 scroll-mt-20">
        <h2 className="text-lg font-semibold">
          Diegimai{" "}
          <span className="text-muted">
            ({installs.length}
            {newInstalls > 0 && `, nauji: ${newInstalls}`})
          </span>
        </h2>
        {installs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Diegimo anketų dar nėra.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {installs.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{r.title}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status]}`}>
                    {INSTALL_STATUS_LABEL[r.status]}
                  </span>
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-muted">Kontaktai</dt>
                  <dd>
                    <a href={`tel:${r.phone}`} className="text-brand hover:underline">
                      {r.phone}
                    </a>
                    {r.email && (
                      <>
                        {" · "}
                        <a href={`mailto:${r.email}`} className="text-brand hover:underline">
                          {r.email}
                        </a>
                      </>
                    )}
                  </dd>
                  <dt className="text-muted">Patogus laikas</dt>
                  <dd>{r.preferred_time}</dd>
                  <dt className="text-muted">Kompiuteris</dt>
                  <dd>{OS_LABEL[r.os as InstallOs] ?? r.os}</dd>
                  {r.tools && (
                    <>
                      <dt className="text-muted">Programos</dt>
                      <dd>{r.tools}</dd>
                    </>
                  )}
                  {r.notes && (
                    <>
                      <dt className="text-muted">Pastabos</dt>
                      <dd className="whitespace-pre-line">{r.notes}</dd>
                    </>
                  )}
                  <dt className="text-muted">Gauta</dt>
                  <dd>{new Date(r.created_at).toLocaleString("lt-LT")}</dd>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["naujas", "suderinta", "idiegta"] as InstallStatus[])
                    .filter((s) => s !== r.status)
                    .map((s) => (
                      <form key={s} action={setInstallStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={s} />
                        <button
                          className={`${btn} ${
                            s === "idiegta"
                              ? "bg-brand text-on-brand hover:bg-brand-dark"
                              : "border border-line hover:bg-brand-soft"
                          }`}
                        >
                          {s === "naujas" ? "Grąžinti į naujus" : s === "suderinta" ? "Laikas suderintas" : "Pažymėti įdiegta"}
                        </button>
                      </form>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Komplekto užklausos (3 lygis) */}
      <section id="uzklausos" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-semibold">
          Komplekto užklausos{" "}
          <span className="text-muted">
            ({bundles.length}
            {newBundles > 0 && `, naujos: ${newBundles}`})
          </span>
        </h2>
        {bundles.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Užklausų dar nėra.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {bundles.map((b) => (
              <div key={b.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{b.name}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      b.status === "naujas"
                        ? "bg-brand-soft text-brand-dark"
                        : b.status === "atsakyta"
                          ? "bg-line text-ink"
                          : "bg-success-soft text-success"
                    }`}
                  >
                    {BUNDLE_STATUS_LABEL[b.status]}
                  </span>
                </div>
                <p className="mt-1">
                  <a href={`mailto:${b.email}`} className="text-brand hover:underline">
                    {b.email}
                  </a>
                  {b.phone && (
                    <>
                      {" · "}
                      <a href={`tel:${b.phone}`} className="text-brand hover:underline">
                        {b.phone}
                      </a>
                    </>
                  )}
                  <span className="text-muted"> · {new Date(b.created_at).toLocaleString("lt-LT")}</span>
                </p>
                {b.plugins.length > 0 && (
                  <p className="mt-1 text-muted">Pluginai: {b.plugins.join(", ")}</p>
                )}
                <p className="mt-2 whitespace-pre-line">{b.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["naujas", "atsakyta", "uzdaryta"] as BundleStatus[])
                    .filter((s) => s !== b.status)
                    .map((s) => (
                      <form key={s} action={setBundleStatus}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value={s} />
                        <button className={`${btn} border border-line hover:bg-brand-soft`}>
                          {s === "naujas" ? "Grąžinti į naujas" : s === "atsakyta" ? "Pažymėti atsakyta" : "Uždaryti"}
                        </button>
                      </form>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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

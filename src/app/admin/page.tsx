import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sourceOf, sellerTypeLabel } from "@/lib/sources";
import { BONUS_EUR, BONUS_SALES, BONUS_SELLERS, FOUNDING_LIMIT, FOUNDING_UNTIL_LABEL } from "@/lib/founding";
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
        .select("id, title, price_cents, category, created_at, profiles:seller_id(display_name)")
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
        .select("id, reason, created_at, products:product_id(id, title, slug, status)")
        .eq("status", "open")
        .order("created_at", { ascending: true }),
    ]);

  // Failus adminas žiūri per viewer'į (/pirkiniai/[id]) — jis rodo VISUS produkto failus
  // ir pats tikrina admino teises. (Tiesioginė nuoroda vartotojo teisėmis neveikė:
  // privačiam bucket'ui nėra skaitymo taisyklės.)
  const pendingWithUrls = pending ?? [];

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

  // Pirmųjų 20 pardavėjų vietos + bonuso sąlyga (pardavimai skirtingiems pirkėjams)
  const adminDb = createAdminClient();
  const [{ data: slotsRaw }, { data: paidRaw }] = await Promise.all([
    adminDb
      .from("founding_slots")
      .select("id, email, user_id, created_at, profiles:user_id(display_name)")
      .order("id", { ascending: true }),
    adminDb.from("orders").select("buyer_id, products(seller_id)").eq("status", "paid"),
  ]);
  const buyersBySeller = new Map<string, Set<string>>();
  for (const o of paidRaw ?? []) {
    const prod = Array.isArray(o.products) ? o.products[0] : o.products;
    if (!prod?.seller_id) continue;
    if (!buyersBySeller.has(prod.seller_id)) buyersBySeller.set(prod.seller_id, new Set());
    buyersBySeller.get(prod.seller_id)!.add(o.buyer_id);
  }
  const slots = (slotsRaw ?? []).map((s, i) => {
    const buyers = s.user_id ? (buyersBySeller.get(s.user_id)?.size ?? 0) : 0;
    return {
      ...s,
      number: i + 1,
      name: sellerName(s.profiles),
      buyers,
      bonusEarned: i < BONUS_SELLERS && buyers >= BONUS_SALES,
    };
  });

  const btn =
    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-muted">
        Pardavėjų paraiškos, produktų peržiūra ir valdymas.
      </p>

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

      {/* 0b. Pirmųjų 20 pardavėjų vietos */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Pirmųjų {FOUNDING_LIMIT} pardavėjų vietos{" "}
          <span className="text-muted">
            ({slots.length} / {FOUNDING_LIMIT})
          </span>
        </h2>
        <p className="mt-1 text-xs text-muted">
          0 % komisijos iki {FOUNDING_UNTIL_LABEL} Bonusą ({BONUS_EUR} €) gauna pirmieji {BONUS_SELLERS},
          pardavę {BONUS_SALES} skirtingiems pirkėjams — pervesk rankiniu būdu.
        </p>
        {slots.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Dar nėra užimtų vietų.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-brand-soft text-xs text-brand-dark">
                <tr>
                  <th className="px-3 py-2 font-semibold">Nr.</th>
                  <th className="px-3 py-2 font-semibold">El. paštas</th>
                  <th className="px-3 py-2 font-semibold">Paskyra</th>
                  <th className="px-3 py-2 font-semibold">Pirkėjų</th>
                  <th className="px-3 py-2 font-semibold">Bonusas</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className="border-t border-line bg-surface">
                    <td className="px-3 py-2 text-muted">{s.number}</td>
                    <td className="px-3 py-2 font-medium">{s.email}</td>
                    <td className="px-3 py-2 text-muted">{s.user_id ? s.name : "dar nėra (tik sąraše)"}</td>
                    <td className="px-3 py-2 text-muted">{s.buyers}</td>
                    <td className="px-3 py-2">
                      {s.bonusEarned ? (
                        <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Užsitarnavo {BONUS_EUR} €
                        </span>
                      ) : s.number <= BONUS_SELLERS ? (
                        <span className="text-xs text-muted">
                          {s.buyers}/{BONUS_SALES}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                  <Link
                    href={`/pirkiniai/${p.id}`}
                    target="_blank"
                    className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand-soft"
                  >
                    Failai ↗
                  </Link>
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
                    {prod?.status === "suspended" && (
                      <p className="text-xs font-medium text-red-700">Produktas sustabdytas</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {prod?.id && prod.status === "live" && (
                      <form action={setProductStatus}>
                        <input type="hidden" name="productId" value={prod.id} />
                        <input type="hidden" name="status" value="suspended" />
                        <button className={`${btn} border border-line text-red-700 hover:bg-red-50`}>
                          Sustabdyti produktą
                        </button>
                      </form>
                    )}
                    <form action={resolveReport}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <button className={`${btn} border border-line hover:bg-brand-soft`}>
                        Pažymėti išspręsta
                      </button>
                    </form>
                  </div>
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categoryName } from "@/lib/categories";
import { getPayoutStatus } from "@/lib/stripe";
import SellerApplicationForm from "./SellerApplicationForm";
import { connectStripe } from "./stripe-actions";

const statusLabels: Record<string, { text: string; cls: string }> = {
  draft: { text: "Juodraštis", cls: "bg-line text-ink" },
  pending: { text: "Laukia patvirtinimo", cls: "bg-brand-soft text-brand-dark" },
  live: { text: "Paskelbta", cls: "bg-green-100 text-green-800" },
  suspended: { text: "Sustabdyta", cls: "bg-red-100 text-red-700" },
  removed: { text: "Pašalinta", cls: "bg-red-100 text-red-700" },
};

function eur(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

export default async function ParduotiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Neprisijungęs
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Parduokite savo kūrybą</h1>
        <p className="mt-3 text-muted">
          Prisijunkite arba susikurkite paskyrą, kad galėtumėte pradėti parduoti.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
        >
          Prisijungti
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller, stripe_account_id")
    .eq("id", user.id)
    .single();

  // 2. Patvirtintas pardavėjas → dashboardas
  if (profile?.is_seller) {
    const [{ data: products }, payout] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, slug, price_cents, category, cover_image_url, status, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      getPayoutStatus(profile.stripe_account_id),
    ]);

    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Mano produktai</h1>
          <Link
            href="/parduoti/naujas"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
          >
            + Naujas produktas
          </Link>
        </div>

        {/* Išmokų (Stripe) statusas */}
        {payout === "active" ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            ✓ Išmokos prijungtos — galėsite gauti pinigus už pardavimus.
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">
                {payout === "pending"
                  ? "Užbaikite išmokų nustatymą"
                  : "Prijunkite išmokas"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                Kad gautumėte pinigus už pardavimus, prijunkite Stripe (banko
                sąskaitą, tapatybę).
              </p>
            </div>
            <form action={connectStripe}>
              <button className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark sm:w-auto">
                {payout === "pending" ? "Tęsti" : "Prijungti išmokas"}
              </button>
            </form>
          </div>
        )}

        {!products?.length ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-surface p-10 text-center">
            <p className="text-muted">Dar neturite produktų.</p>
            <Link
              href="/parduoti/naujas"
              className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
            >
              Įkelti pirmą produktą
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {products.map((p) => {
              const s = statusLabels[p.status] ?? statusLabels.draft;
              return (
                <Link
                  key={p.id}
                  href={`/produktas/${p.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition-all hover:border-brand hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-soft text-xl">
                      {p.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.cover_image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "🗂️"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{p.title}</h3>
                      <p className="text-xs text-muted">{categoryName(p.category)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold text-brand">{eur(p.price_cents)}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                      {s.text}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. Turi laukiančią paraišką
  const { data: application } = await supabase
    .from("seller_applications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (application?.status === "pending") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-4xl">⏳</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Paraiška gauta</h1>
        <p className="mt-3 text-muted">
          Peržiūrime jūsų paraišką tapti pardavėju. Pranešime, kai patvirtinsime.
        </p>
      </div>
    );
  }

  if (application?.status === "rejected") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Paraiška atmesta</h1>
        <p className="mt-3 text-muted">
          Deja, jūsų paraiška šįkart nebuvo patvirtinta.
        </p>
      </div>
    );
  }

  // 4. Nauja paraiška
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-2xl font-bold tracking-tight">
        Tapkite pardavėju
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Užpildykite trumpą paraišką. Patvirtinę galėsite įkelti produktus.
      </p>
      <SellerApplicationForm />
    </div>
  );
}

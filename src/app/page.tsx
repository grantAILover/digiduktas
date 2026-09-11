import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";

const categories = [
  { emoji: "🎨", name: "Grafika ir dizainas" },
  { emoji: "📄", name: "Šablonai" },
  { emoji: "📸", name: "Presetai ir filtrai" },
  { emoji: "📚", name: "E-knygos ir gidai" },
  { emoji: "🎓", name: "Kursai" },
  { emoji: "🎵", name: "Muzika ir garsai" },
];

const values = [
  {
    emoji: "🇱🇹",
    title: "Sukurta Lietuvai",
    text: "Lietuviški kūrėjai, lietuviškas turinys ir aiškios kainos eurais — be užsienio tarpininkų.",
  },
  {
    emoji: "💸",
    title: "Pinigai tiesiai jums",
    text: "Parduokite savo kūrybą, o uždarbis keliauja tiesiai į jūsų banko sąskaitą. Komisija maža ir aiški.",
  },
  {
    emoji: "🔒",
    title: "Saugu abiem pusėm",
    text: "Pirkėjas gauna failą iškart po apmokėjimo per apsaugotą nuorodą. Jokių rūpesčių.",
  },
];

const examples = [
  { emoji: "🗂️", title: "Notion ir Excel šablonai", tag: "Šablonai" },
  { emoji: "🌅", title: "Lightroom presetų rinkiniai", tag: "Presetai" },
  { emoji: "📄", title: "CV ir dokumentų šablonai", tag: "Šablonai" },
  { emoji: "🎧", title: "Muzika, garsai ir efektai", tag: "Muzika" },
  { emoji: "🖼️", title: "Iliustracijos ir ikonos", tag: "Grafika" },
  { emoji: "🎓", title: "Vaizdo kursai ir gidai", tag: "Kursai" },
];

const steps = [
  { n: "1", title: "Susikurkite paskyrą", text: "Prisijunkite per el. paštą — nemokamai, per minutę." },
  { n: "2", title: "Įkelkite savo produktą", text: "Failą, aprašymą ir kainą. Peržiūrėsim ir paskelbsim." },
  { n: "3", title: "Gaukite pinigus", text: "Pirkėjai apmoka, uždarbis keliauja tiesiai jums." },
];

const faq = [
  {
    q: "Kada startuojate?",
    a: "Netrukus. Užsiregistruokite į laukiančiųjų sąrašą ir pranešime jums vieniems pirmųjų, kai atidarysime duris.",
  },
  {
    q: "Kiek kainuoja parduoti?",
    a: "Registracija ir produktų įkėlimas — nemokami. Imsime tik nedidelę, aiškią komisiją nuo kiekvieno pardavimo.",
  },
  {
    q: "Ką galiu parduoti?",
    a: "Bet kokį savo sukurtą skaitmeninį produktą: šablonus, presetus, e-knygas, kursus, grafiką, muziką ir kt.",
  },
  {
    q: "Kaip gausiu pinigus?",
    a: "Per saugų mokėjimų tiekėją uždarbis bus pervedamas tiesiai į jūsų banko sąskaitą.",
  },
  {
    q: "Ar saugu pirkti?",
    a: "Taip. Sumokėję iškart gaunate failą per apsaugotą, laikiną atsisiuntimo nuorodą.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: newestRaw } = await supabase
    .from("products")
    .select(
      "slug, title, price_cents, category, cover_image_url, created_at, profiles:seller_id(display_name, is_verified)",
    )
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(4);
  const newest: ProductCardData[] = (newestRaw ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    price_cents: p.price_cents,
    category: p.category,
    cover_image_url: p.cover_image_url,
    created_at: p.created_at,
    seller: Array.isArray(p.profiles) ? (p.profiles[0] ?? null) : p.profiles,
  }));

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-soft to-canvas">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Pirkite ir parduokite{" "}
            <span className="text-brand">skaitmeninius produktus</span> lietuviškai
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Šablonai, presetai, e-knygos, kursai — sukurti kūrėjų iš Lietuvos.
            Netrukus startuojame. Palikite el. paštą ir sužinokite pirmi.
          </p>
          <WaitlistForm />
          <p className="mt-4 text-xs text-muted">
            Be spamo. Vienas laiškas, kai atidarysime duris.
          </p>
        </div>
      </section>

      {/* Vertė */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-line bg-surface p-6">
              <span className="text-3xl">{v.emoji}</span>
              <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Naujausi produktai (jei jau yra) */}
      {newest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Naujausi produktai</h2>
            <Link
              href="/produktai"
              className="text-sm font-medium text-brand hover:text-brand-dark"
            >
              Žiūrėti visus →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {newest.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Kategorijos */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Ką čia rasite</h2>
        <p className="mt-2 text-sm text-muted">Kategorijos, kuriose kūrėjai galės parduoti.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-5 text-center"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-sm font-medium">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Ko tikėtis (pavyzdžiai, ne tikri įrašai) */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Ko tikėtis</h2>
        <p className="mt-2 text-sm text-muted">
          Pavyzdžiai, kokių produktų netrukus galėsite rasti ir parduoti.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {examples.map((p) => (
            <div
              key={p.title}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface"
            >
              <div className="grid aspect-[5/2] place-items-center bg-brand-soft text-5xl">
                {p.emoji}
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                <h3 className="text-sm font-semibold">{p.title}</h3>
                <span className="shrink-0 rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">
                  {p.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kaip veiks */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Parduokite savo kūrybą per 3 žingsnius
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl border border-line bg-canvas p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-lg font-bold text-surface">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DUK */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Dažni klausimai
        </h2>
        <div className="mt-8 flex flex-col gap-3">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-line bg-surface p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {item.q}
                <span className="text-brand transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Baigiamasis CTA */}
      <section className="border-t border-line bg-gradient-to-b from-canvas to-brand-soft">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Būkite pirmi, kai startuosime
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Palikite el. paštą — pranešime, kai galėsite pradėti pirkti ir parduoti.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}

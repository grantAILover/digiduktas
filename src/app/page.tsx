import Link from "next/link";

const categories = [
  { emoji: "🎨", name: "Grafika ir dizainas", slug: "grafika" },
  { emoji: "📄", name: "Šablonai", slug: "sablonai" },
  { emoji: "📸", name: "Presetai ir filtrai", slug: "presetai" },
  { emoji: "📚", name: "E-knygos ir gidai", slug: "e-knygos" },
  { emoji: "🎓", name: "Kursai", slug: "kursai" },
  { emoji: "🎵", name: "Muzika ir garsai", slug: "muzika" },
];

const featured = [
  { title: "Notion produktyvumo sistema", author: "Gabrielė", price: 12.99, emoji: "🗂️" },
  { title: "Lightroom presetų rinkinys „Vasara“", author: "Tomas F.", price: 8.5, emoji: "🌅" },
  { title: "CV šablonas (LT/EN)", author: "Rūta", price: 4.99, emoji: "📄" },
  { title: "Instagram istorijų šablonai", author: "studija.lt", price: 15.0, emoji: "📱" },
];

const steps = [
  { n: "1", title: "Susikurk paskyrą", text: "Prisijunk per el. paštą ar Google — nemokamai." },
  { n: "2", title: "Įkelk savo produktą", text: "Failą, aprašymą ir kainą. Patvirtinsim ir paskelbsim." },
  { n: "3", title: "Gauk pinigus", text: "Pirkėjai apmoka, pinigai keliauja tiesiai tau." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-soft to-canvas">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Pirk ir parduok{" "}
            <span className="text-brand">skaitmeninius produktus</span> lietuviškai
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Šablonai, presetai, e-knygos, kursai — sukurti kūrėjų iš Lietuvos.
            Nusipirk per kelias sekundes arba pradėk uždirbti iš savo kūrybos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/produktai"
              className="w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark sm:w-auto"
            >
              Naršyti produktus
            </Link>
            <Link
              href="/parduoti"
              className="w-full rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-brand-soft sm:w-auto"
            >
              Pradėti parduoti
            </Link>
          </div>
        </div>
      </section>

      {/* Kategorijos */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Kategorijos</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/produktai?kategorija=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-5 text-center transition-all hover:border-brand hover:shadow-sm"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-sm font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Populiarūs produktai */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Populiaru dabar</h2>
          <Link href="/produktai" className="text-sm font-medium text-brand hover:text-brand-dark">
            Žiūrėti visus →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((p) => (
            <div
              key={p.title}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all hover:shadow-md"
            >
              <div className="grid aspect-[4/3] place-items-center bg-brand-soft text-5xl">
                {p.emoji}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
                <p className="mt-1 text-xs text-muted">{p.author}</p>
                <p className="mt-auto pt-3 text-base font-bold text-brand">
                  {p.price.toFixed(2)} €
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kaip veikia */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Parduok savo kūrybą per 3 žingsnius
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
          <div className="mt-10 text-center">
            <Link
              href="/parduoti"
              className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
            >
              Tapti pardavėju
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

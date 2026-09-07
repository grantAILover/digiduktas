import WaitlistForm from "@/components/WaitlistForm";

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
    title: "Pinigai tiesiai tau",
    text: "Parduok savo kūrybą, o uždarbis keliauja tiesiai į tavo banko sąskaitą. Komisija maža ir aiški.",
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
  { n: "1", title: "Susikurk paskyrą", text: "Prisijunk per el. paštą — nemokamai, per minutę." },
  { n: "2", title: "Įkelk savo produktą", text: "Failą, aprašymą ir kainą. Peržiūrėsim ir paskelbsim." },
  { n: "3", title: "Gauk pinigus", text: "Pirkėjai apmoka, uždarbis keliauja tiesiai tau." },
];

const faq = [
  {
    q: "Kada startuojate?",
    a: "Netrukus. Užsiregistruok į laukiančiųjų sąrašą ir pranešime tau vienais pirmųjų, kai atidarysime duris.",
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
    a: "Per saugų mokėjimų tiekėją uždarbis bus pervedamas tiesiai į tavo banko sąskaitą.",
  },
  {
    q: "Ar saugu pirkti?",
    a: "Taip. Sumokėjęs iškart gauni failą per apsaugotą, laikiną atsisiuntimo nuorodą.",
  },
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
            Netrukus startuojame. Palik el. paštą ir sužinok pirmas.
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

      {/* Kategorijos */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Ką čia rasi</h2>
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
          Pavyzdžiai, kokių produktų netrukus galėsi rasti ir parduoti.
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
            Būk pirmas, kai startuosim
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Palik el. paštą — pranešim, kai galėsi pradėti pirkti ir parduoti.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}

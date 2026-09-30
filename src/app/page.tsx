import WaitlistForm from "@/components/WaitlistForm";
import { CoverPlaceholder } from "@/components/ProductCard";

// Pagrindinė žinutė — mokymosi medžiaga egzaminams ir pamokoms. Kitos kategorijos — „netrukus".
const comingSoon = ["Šablonai", "Grafika ir dizainas", "Presetai ir filtrai", "Vaizdo kursai"];

const benefits = [
  {
    title: "Tavo failas apsaugotas",
    text: "Gali leisti pirkėjams tik peržiūrėti medžiagą naršyklėje — be atsisiuntimo.",
  },
  {
    title: "Jokių mėnesinių mokesčių",
    text: "Registracija ir įkėlimas nemokami. Moki tik tada, kai parduodi.",
  },
  {
    title: "Vieną kartą sukūrei — parduodi daug kartų",
    text: "Tas pats konspektas gali padėti šimtams moksleivių visoje Lietuvoje.",
  },
];

const audiences = [
  {
    title: "Mokytojams",
    text: "Konspektai, užduočių rinkiniai ir kartojimo medžiaga, kurią jau naudojate pamokose.",
  },
  {
    title: "Korepetitoriams",
    text: "Pamokų medžiaga ir sprendimų pavyzdžiai — papildomos pajamos be papildomų valandų.",
  },
  {
    title: "Abiturientams",
    text: "Išlaikei egzaminus? Tavo konspektai gali padėti kitiems — ir tau uždirbti.",
  },
];

const examples = [
  { title: "Matematikos egzamino uždavinių sprendimai", tag: "Egzaminai" },
  { title: "Rašinio planai ir argumentai", tag: "Lietuvių k." },
  { title: "Kūrinių ir eilėraščių analizės", tag: "Literatūra" },
  { title: "Istorijos ir biologijos konspektai", tag: "Konspektai" },
  { title: "Savikontrolės testai su atsakymais", tag: "Testai" },
  { title: "Formulių ir sąvokų atmintinės", tag: "Atmintinės" },
];

const steps = [
  { n: "1", title: "Užsiregistruok", text: "Palik el. paštą — susisieksime ir padėsime pradėti." },
  { n: "2", title: "Įkelk medžiagą", text: "Failas, trumpas aprašymas ir kaina. Peržiūrime ir paskelbiame." },
  { n: "3", title: "Gauk pinigus", text: "Moksleiviai perka, pinigai keliauja į tavo banko sąskaitą." },
];

const faq = [
  {
    q: "Kiek kainuoja parduoti?",
    a: "Registracija nemokama. Pirmą savaitę — 0 % komisijos, vėliau 10 % nuo kiekvieno pardavimo. Jokių mėnesinių mokesčių.",
  },
  {
    q: "Kas gali parduoti?",
    a: "Mokytojai, korepetitoriai, abiturientai ir visi, kas kuria mokymosi medžiagą. Parduoti gali asmenys nuo 18 metų.",
  },
  {
    q: "Ką galiu parduoti?",
    a: "Tik savo sukurtą medžiagą: konspektus, užduočių sprendimus, analizes, testus, atmintines. Kitų autorių darbų ar vadovėlių kopijų — ne.",
  },
  {
    q: "Ar mano medžiagos niekas nenukopijuos?",
    a: "Gali pasirinkti, kad pirkėjai failą tik peržiūrėtų naršyklėje, be atsisiuntimo. Failai saugomi privačiai, o prieigos nuorodos galioja vos kelias minutes.",
  },
  {
    q: "Kaip gausiu pinigus?",
    a: "Per saugią mokėjimų sistemą Stripe — pinigai pervedami tiesiai į tavo banko sąskaitą.",
  },
  {
    q: "Kada startuojate?",
    a: "Dabar renkame pirmuosius pardavėjus. Užsiregistruok — susisieksime asmeniškai ir padėsime įkelti pirmą medžiagą.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-soft to-canvas">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Mokymosi medžiaga egzaminams ir pamokoms —{" "}
            <span className="text-brand">nuo tų, kurie jau išlaikė</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Mokytojai, korepetitoriai ir abiturientai dalinasi konspektais, išspręstomis
            užduotimis, rašinių ir kūrinių analizėmis. Lietuviškai ir pagal tai, ko tikrai reikia.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#pardavejas"
              className="w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark sm:w-auto"
            >
              Tapk pirmuoju pardavėju
            </a>
            <a
              href="#pirkejas"
              className="w-full rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand sm:w-auto"
            >
              Noriu pirkti
            </a>
          </div>

          <p className="mx-auto mt-6 w-fit rounded-lg border border-brand/30 bg-surface px-4 py-2 text-sm">
            <span className="font-semibold text-brand">Pirmą savaitę — 0 % komisijos.</span>{" "}
            <span className="text-muted">Visa kaina keliauja tau.</span>
          </p>

          <div className="mt-5">
            <a href="/naujienos" className="text-sm text-muted transition-colors hover:text-brand">
              Kas jau veikia? Naujienos →
            </a>
          </div>
        </div>
      </section>

      {/* Pasiūlymas pardavėjams */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Uždirbk iš to, ką jau sukūrei</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {/* Skaičiai */}
          <div className="rounded-xl border border-brand/30 bg-surface p-6">
            <p className="text-sm text-muted">Pavyzdžiui, parduodi konspektą už</p>
            <p className="mt-1 text-3xl font-bold">5,00 €</p>
            <div className="mt-5 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-3">
                <span>
                  Pirmą savaitę <span className="text-muted">(0 % komisijos)</span>
                </span>
                <span className="font-bold text-brand">gauni 5,00 €</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                <span>
                  Vėliau <span className="text-muted">(10 % komisija)</span>
                </span>
                <span className="font-bold">gauni 4,50 €</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">
              Kainą nustatai pats (nuo 3 €). Pinigai pervedami į tavo banko sąskaitą per Stripe.
            </p>
          </div>

          {/* Privalumai */}
          <div className="flex flex-col gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kam */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.title} className="rounded-xl border border-line bg-surface p-6">
              <h3 className="text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm text-muted">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ką galima parduoti (pavyzdžiai, ne tikri įrašai) */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Ką galima parduoti</h2>
        <p className="mt-2 text-sm text-muted">Pavyzdžiai — tavo medžiaga gali būti bet kurio dalyko.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {examples.map((p) => (
            <div
              key={p.title}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface"
            >
              <div className="grid aspect-[5/2] place-items-center bg-brand-soft">
                <CoverPlaceholder />
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

      {/* Kaip veikia */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Pradėk parduoti per 3 žingsnius
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

      {/* Registracija (mygtukai viršuje veda čia ir parenka rolę) */}
      <section id="registracija" className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <span id="pardavejas" className="absolute -top-4" aria-hidden />
        <span id="pirkejas" className="absolute -top-4" aria-hidden />
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Būk tarp pirmųjų</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Palik el. paštą — pardavėjams padėsime įkelti pirmą medžiagą, pirkėjams pranešime,
          kai atsiras pirmieji konspektai.
        </p>
        <WaitlistForm />
        <p className="mt-4 text-xs text-muted">Be spamo. Tik svarbiausios žinios apie startą.</p>
      </section>

      {/* Netrukus */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-xl border border-dashed border-line p-6 text-center">
          <h2 className="text-sm font-semibold text-muted">Netrukus ir kitos kategorijos</h2>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {comingSoon.map((c) => (
              <span key={c} className="rounded-md bg-line/60 px-3 py-1 text-sm text-muted">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DUK */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight">Dažni klausimai</h2>
        <div className="mt-8 flex flex-col gap-3">
          {faq.map((item) => (
            <details key={item.q} className="group rounded-xl border border-line bg-surface p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {item.q}
                <span className="text-brand transition-transform group-open:rotate-45">+</span>
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
            Turi konspektų, kurie padėjo tau ar tavo mokiniams?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Jie gali padėti ir kitiems. Pirmą savaitę — be jokios komisijos.
          </p>
          <a
            href="#pardavejas"
            className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
          >
            Tapk pirmuoju pardavėju
          </a>
        </div>
      </section>
    </div>
  );
}

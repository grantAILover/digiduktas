import Link from "next/link";

export const metadata = {
  title: "Kaip veikia",
  description:
    "Kaip veikia digiduktas — lietuviškas skaitmeninių produktų turgus. Pirkėjams ir pardavėjams.",
};

const buyerSteps = [
  { n: "1", t: "Naršykite", d: "Raskite šablonų, presetų, kursų ir kitų skaitmeninių produktų." },
  { n: "2", t: "Nusipirkite", d: "Saugus apmokėjimas kortele ar Apple/Google Pay." },
  { n: "3", t: "Atsisiųskite iškart", d: "Failą gaunate akimirksniu po apmokėjimo." },
];

const sellerSteps = [
  { n: "1", t: "Pateikite paraišką", d: "Trumpai apie save. Patvirtinę galėsite kelti produktus." },
  { n: "2", t: "Įkelkite produktą", d: "Failą, aprašymą ir kainą. Kainą nustatote patys." },
  { n: "3", t: "Uždirbkite", d: "Kiek parduodate, tiek uždirbate — pinigai keliauja tiesiai jums." },
];

function Steps({ steps }: { steps: { n: string; t: string; d: string }[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {steps.map((s) => (
        <div key={s.n} className="rounded-xl border border-line bg-surface p-5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-surface">
            {s.n}
          </span>
          <h3 className="mt-3 font-semibold">{s.t}</h3>
          <p className="mt-1 text-sm text-muted">{s.d}</p>
        </div>
      ))}
    </div>
  );
}

export default function KaipVeikiaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Kaip veikia digiduktas</h1>
      <p className="mt-3 max-w-2xl text-muted">
        digiduktas — lietuviškas skaitmeninių produktų turgus. Pirkite kūrėjų
        darbus arba parduokite savo — viskas vienoje vietoje, lietuviškai.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">🛍️ Pirkėjams</h2>
        <Steps steps={buyerSteps} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">💸 Pardavėjams</h2>
        <Steps steps={sellerSteps} />
      </section>

      <section className="mt-12 rounded-xl border border-line bg-brand-soft p-6">
        <h2 className="text-lg font-semibold">Kodėl digiduktas?</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
          <li>🇱🇹 Sukurta Lietuvai — lietuviškas turinys ir kainos eurais.</li>
          <li>🔒 Saugu — failą gaunate tik po apmokėjimo, per apsaugotą nuorodą.</li>
          <li>✓ Patikimi kūrėjai — patvirtinti pardavėjai ir Verified ženklas.</li>
          <li>💸 Sąžininga — kiek parduodate, tiek uždirbate, maža komisija.</li>
        </ul>
      </section>

      <div className="mt-12 text-center">
        <p className="text-muted">Netrukus startuojame.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
        >
          Prisijungti prie laukiančiųjų
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Naujienos",
  description:
    "digiduktas kuriamas viešai. Čia matote, kas jau veikia, kas kuriama dabar ir kas planuojama.",
};

type Status = "done" | "wip" | "planned";

type Entry = {
  // "done" — su data (kada pridėta). "wip"/"planned" — data nebūtina.
  date?: string;
  title: string;
  desc: string;
  status: Status;
};

// ─────────────────────────────────────────────────────────────
// Naują įrašą tiesiog įdėkite į šį masyvą. Naujausi — viršuje.
// status: "done" (veikia) | "wip" (kuriama) | "planned" (planuojama)
// ─────────────────────────────────────────────────────────────
const entries: Entry[] = [
  {
    status: "done",
    date: "2026-09-16",
    title: "Teisiniai dokumentai",
    desc: "Privatumo politika, naudojimosi taisyklės ir grąžinimų tvarka.",
  },
  {
    status: "done",
    date: "2026-09-16",
    title: "Naujienų puslapis",
    desc: "Šis puslapis — skaidriai rodome, kas jau veikia, kas kuriama ir kas planuojama.",
  },
  {
    status: "done",
    date: "2026-09-14",
    title: "Pirkėjo patvirtinimo laiškai",
    desc: "Po apmokėjimo pirkėjas gauna el. laišką su pirkiniu ir atsisiuntimo nuoroda.",
  },
  {
    status: "done",
    date: "2026-09-12",
    title: "Produktų redagavimas ir šalinimas",
    desc: "Pardavėjai gali koreguoti kainą, aprašymą, failą arba pašalinti produktą.",
  },
  {
    status: "done",
    date: "2026-09-10",
    title: "Įvertinimai ir pranešimai",
    desc: "Pirkėjai palieka atsiliepimus žvaigždutėmis. Netinkamą turinį galima pranešti.",
  },
  {
    status: "done",
    date: "2026-09-08",
    title: "Administravimo skydelis",
    desc: "Pardavėjų paraiškų tvirtinimas, „Verified“ ženklas, produktų ir pranešimų valdymas.",
  },
  {
    status: "done",
    date: "2026-09-05",
    title: "Apmokėjimai ir komisijos",
    desc: "Saugus apmokėjimas per Stripe. Pinigai keliauja tiesiai pardavėjui, atskaičius mažą komisiją.",
  },
  {
    status: "done",
    date: "2026-09-03",
    title: "Produktų puslapiai ir atsisiuntimas",
    desc: "Produkto puslapis su aprašymu, pirkimu ir akimirksniniu failo atsisiuntimu po apmokėjimo.",
  },
  {
    status: "done",
    date: "2026-08-30",
    title: "Pardavėjų srautas",
    desc: "Paraiška tapti pardavėju, tapatybės ir išmokų prijungimas, produktų įkėlimas su moderacija.",
  },
  {
    status: "done",
    date: "2026-08-25",
    title: "Pradinis puslapis ir SEO",
    desc: "Landing puslapis, registracija į laukiančiųjų sąrašą ir matomumas paieškos sistemose.",
  },
];

const planned: Entry[] = [
  {
    status: "planned",
    title: "Kūrėjo pardavimų statistika",
    desc: "Skydelis su pardavimais, uždarbiu ir populiariausiais produktais.",
  },
  {
    status: "planned",
    title: "Pardavimo pranešimai pardavėjui",
    desc: "El. laiškas pardavėjui, kai kas nors nuperka jo produktą.",
  },
  {
    status: "planned",
    title: "Nuolaidų kodai",
    desc: "Galimybė pardavėjams kurti akcijas ir nuolaidų kodus.",
  },
];

const statusMeta: Record<Status, { label: string; dot: string; chip: string }> = {
  done: {
    label: "Veikia",
    dot: "bg-green-500",
    chip: "bg-green-100 text-green-800",
  },
  wip: {
    label: "Kuriama",
    dot: "bg-brand",
    chip: "bg-brand-soft text-brand-dark",
  },
  planned: {
    label: "Planuojama",
    dot: "bg-line",
    chip: "bg-line text-muted",
  },
};

function formatDate(iso?: string) {
  if (!iso) return null;
  const months = [
    "sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio",
    "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio",
  ];
  const d = new Date(iso);
  return `${d.getFullYear()} m. ${months[d.getMonth()]} ${d.getDate()} d.`;
}

function TimelineItem({ e, last }: { e: Entry; last: boolean }) {
  const m = statusMeta[e.status];
  return (
    <li className="relative flex gap-4 pb-8">
      {/* Linija */}
      {!last && (
        <span className="absolute left-[7px] top-4 h-full w-px bg-line" aria-hidden />
      )}
      {/* Taškas */}
      <span className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-canvas ${m.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{e.title}</h3>
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${m.chip}`}>
            {m.label}
          </span>
        </div>
        {e.date && (
          <p className="mt-0.5 text-xs text-muted">{formatDate(e.date)}</p>
        )}
        <p className="mt-1 text-sm text-muted">{e.desc}</p>
      </div>
    </li>
  );
}

export default function NaujienosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
        Kuriama viešai
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Naujienos</h1>
      <p className="mt-3 text-muted">
        digiduktas kuriamas atvirai. Čia skaidriai matote, kas jau veikia, kas
        kuriama šiuo metu ir kas planuojama toliau.
      </p>

      {/* Timeline */}
      <ol className="mt-10">
        {entries.map((e, i) => (
          <TimelineItem key={i} e={e} last={i === entries.length - 1} />
        ))}
      </ol>

      {/* Planuojama */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold">Planuojama toliau</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {planned.map((e, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full bg-line ring-4 ring-surface" />
              <div>
                <h3 className="font-medium text-ink">{e.title}</h3>
                <p className="mt-0.5 text-sm text-muted">{e.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-muted">
          Turite pasiūlymą, ko trūksta? Parašykite — kuriame pagal kūrėjų
          poreikius.
        </p>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/parduoti"
          className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
        >
          Pradėti parduoti
        </Link>
      </div>
    </div>
  );
}

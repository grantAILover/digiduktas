import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 text-base font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-surface">d</span>
            <span>
              digi<span className="text-brand">duktas</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Lietuviška vieta pirkti ir parduoti skaitmeninius produktus — šablonus,
            presetus, e-knygas, kursus ir daugiau.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink">Platforma</span>
            <Link href="/produktai" className="text-muted transition-colors hover:text-ink">
              Naršyti produktus
            </Link>
            <Link href="/parduoti" className="text-muted transition-colors hover:text-ink">
              Tapti pardavėju
            </Link>
            <Link href="/kaip-veikia" className="text-muted transition-colors hover:text-ink">
              Kaip veikia
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink">Pagalba</span>
            <Link href="/duk" className="text-muted transition-colors hover:text-ink">
              D.U.K.
            </Link>
            <Link href="/taisykles" className="text-muted transition-colors hover:text-ink">
              Taisyklės
            </Link>
            <Link href="/privatumas" className="text-muted transition-colors hover:text-ink">
              Privatumas
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} digiduktas · Sukurta Lietuvoje
        </div>
      </div>
    </footer>
  );
}

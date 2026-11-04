import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-center sm:px-6">
        <div className="flex items-center justify-center gap-2 text-base font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-on-brand">d</span>
          <span>
            digi<span className="text-brand">duktas</span>
          </span>
        </div>
        <p className="mx-auto max-w-md text-sm text-muted">
          DI pluginai, kurie atlieka rankų darbą už jus.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
          <Link href="/#pluginai" className="transition-colors hover:text-ink">
            Pluginai
          </Link>
          <a href="/naujienos" className="transition-colors hover:text-ink">
            Naujienos
          </a>
        </nav>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <a href="/privatumas" className="transition-colors hover:text-ink">
            Privatumo politika
          </a>
          <a href="/taisykles" className="transition-colors hover:text-ink">
            Naudojimosi taisyklės
          </a>
          <a href="/grazinimai" className="transition-colors hover:text-ink">
            Grąžinimų tvarka
          </a>
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} digiduktas · Sukurta Lietuvoje
        </p>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-center sm:px-6">
        <div className="flex items-center justify-center gap-2 text-base font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-surface">d</span>
          <span>
            digi<span className="text-brand">duktas</span>
          </span>
        </div>
        <p className="mx-auto max-w-md text-sm text-muted">
          Lietuviška vieta pirkti ir parduoti skaitmeninius produktus. Netrukus
          startuojame.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
          <a href="/produktai" className="transition-colors hover:text-ink">
            Naršyti
          </a>
          <a href="/kaip-veikia" className="transition-colors hover:text-ink">
            Kaip veikia
          </a>
          <a href="/parduoti" className="transition-colors hover:text-ink">
            Parduoti
          </a>
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} digiduktas · Sukurta Lietuvoje 🇱🇹
        </p>
      </div>
    </footer>
  );
}

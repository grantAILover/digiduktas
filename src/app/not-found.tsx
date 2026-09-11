import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Puslapis nerastas</h1>
      <p className="mt-2 text-muted">
        Deja, tokio puslapio nėra arba jis buvo pašalintas.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
        >
          Į pradžią
        </Link>
        <Link
          href="/produktai"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-brand-soft"
        >
          Naršyti produktus
        </Link>
      </div>
    </div>
  );
}

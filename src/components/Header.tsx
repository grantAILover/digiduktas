import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Paskyra";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-surface">d</span>
          <span>
            digi<span className="text-brand">duktas</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted sm:flex">
          <Link href="/produktai" className="transition-colors hover:text-ink">
            Naršyti
          </Link>
          <Link href="/parduoti" className="transition-colors hover:text-ink">
            Parduoti
          </Link>
          <Link href="/kaip-veikia" className="transition-colors hover:text-ink">
            Kaip veikia
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/paskyra"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-soft sm:block"
              >
                {displayName}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-soft"
                >
                  Atsijungti
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-soft sm:block"
              >
                Prisijungti
              </Link>
              <Link
                href="/parduoti"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
              >
                Pradėti parduoti
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

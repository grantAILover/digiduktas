import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Paskyra";
  let avatarUrl: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Paskyra";
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-surface">d</span>
          {/* Labai siauruose ekranuose (iki 359 px) — tik ikona, kad tilptų mygtukai */}
          <span className="hide-xs">
            digi<span className="text-brand">duktas</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <UserMenu
              displayName={displayName}
              avatarUrl={avatarUrl}
              userId={user.id}
              isAdmin={isAdmin}
            />
          ) : (
            <>
              <Link
                href="/auth"
                className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-ink transition-colors hover:text-brand sm:px-3"
              >
                Prisijungti
              </Link>
              <Link
                href="/auth?registracija=1"
                className="whitespace-nowrap rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark sm:px-3.5"
              >
                Registruotis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

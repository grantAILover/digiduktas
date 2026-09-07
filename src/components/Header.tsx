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

        {/* Pre-launch: kol platforma neatidaryta, meniu minimalus */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="hidden text-sm font-medium text-muted sm:block">
                {displayName}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-soft"
                >
                  Atsijungti
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

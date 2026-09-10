"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { authenticate, type AuthState } from "./actions";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    authenticate,
    null,
  );

  const isRegister = mode === "register";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <h1 className="text-center text-2xl font-bold tracking-tight">
        {isRegister ? "Sukurkite paskyrą" : "Prisijunkite"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {isRegister
          ? "Registruokitės, kad galėtumėte pirkti ir parduoti."
          : "Sveiki sugrįžę į digiduktas."}
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />

        {isRegister && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Vardas
            <input
              name="display_name"
              type="text"
              placeholder="Kaip jus vadinti?"
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          El. paštas
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vardas@pastas.lt"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Slaptažodis
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Bent 6 simboliai"
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand"
          />
        </label>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.notice && (
          <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            {state.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {pending
            ? "Palaukite…"
            : isRegister
              ? "Registruotis"
              : "Prisijungti"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        {isRegister ? (
          <>
            Jau turite paskyrą?{" "}
            <button
              onClick={() => setMode("login")}
              className="font-medium text-brand hover:text-brand-dark"
            >
              Prisijunkite
            </button>
          </>
        ) : (
          <>
            Neturite paskyros?{" "}
            <button
              onClick={() => setMode("register")}
              className="font-medium text-brand hover:text-brand-dark"
            >
              Registruokitės
            </button>
          </>
        )}
      </div>

      <Link
        href="/"
        className="mt-8 text-center text-xs text-muted hover:text-ink"
      >
        ← Grįžti į pradžią
      </Link>
    </div>
  );
}

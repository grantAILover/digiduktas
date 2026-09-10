"use client";

import { useState, useRef, useEffect } from "react";
import { logout } from "@/app/auth/actions";

export default function UserMenu({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initial = displayName.charAt(0).toUpperCase();

  // Placeholder shortcut'ai — kol kas neveikia (tik vizualiai)
  const items = ["Mano produktai", "Mano pirkiniai", "Nustatymai"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profilio meniu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand text-sm font-bold text-surface ring-offset-2 transition-shadow hover:ring-2 hover:ring-brand/40"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold">{displayName}</p>
          </div>
          <nav className="flex flex-col py-1 text-sm">
            {items.map((label) => (
              <button
                key={label}
                type="button"
                className="px-4 py-2 text-left transition-colors hover:bg-brand-soft"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="border-t border-line">
            <form action={logout}>
              <button
                type="submit"
                className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-brand-soft"
              >
                Atsijungti
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

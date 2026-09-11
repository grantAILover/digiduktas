"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";

export default function UserMenu({
  displayName,
  avatarUrl,
  userId,
  isAdmin,
}: {
  displayName: string;
  avatarUrl: string | null;
  userId: string;
  isAdmin: boolean;
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

  const items = [
    { label: "Mano produktai", href: "/parduoti" },
    { label: "Mano profilis", href: `/kurejas/${userId}` },
    { label: "Nustatymai", href: "/nustatymai" },
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

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
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-left transition-colors hover:bg-brand-soft"
              >
                {item.label}
              </Link>
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

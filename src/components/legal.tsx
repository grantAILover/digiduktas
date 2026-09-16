import Link from "next/link";
import { LEGAL_UPDATED } from "@/lib/legal";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-xs text-muted">Atnaujinta: {LEGAL_UPDATED}</p>
      {intro && <p className="mt-5 text-muted">{intro}</p>}
      <div className="mt-8 flex flex-col gap-8">{children}</div>

      <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm text-muted">
        <Link href="/privatumas" className="hover:text-ink">Privatumo politika</Link>
        <Link href="/taisykles" className="hover:text-ink">Naudojimosi taisyklės</Link>
        <Link href="/grazinimai" className="hover:text-ink">Grąžinimų tvarka</Link>
      </div>
    </div>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight">
        {n}. {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

import Link from "next/link";

export function VerifiedBadge() {
  return (
    <span
      title="Patvirtintas kūrėjas"
      className="inline-grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-surface"
    >
      ✓
    </span>
  );
}

export function eur(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export type ProductCardData = {
  slug: string;
  title: string;
  price_cents: number;
  category: string | null;
  cover_image_url: string | null;
  created_at?: string | null;
  seller: { display_name: string | null; is_verified: boolean } | null;
};

function isNew(created_at?: string | null) {
  if (!created_at) return false;
  return Date.now() - new Date(created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link
      href={`/produktas/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
        {isNew(p.created_at) && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold text-surface">
            Naujas
          </span>
        )}
        {p.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.cover_image_url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🗂️</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <span className="truncate">{p.seller?.display_name ?? "Kūrėjas"}</span>
          {p.seller?.is_verified && <VerifiedBadge />}
        </p>
        <p className="mt-auto pt-3 text-base font-bold text-brand">
          {eur(p.price_cents)}
        </p>
      </div>
    </Link>
  );
}

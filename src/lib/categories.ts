export const CATEGORIES = [
  { slug: "grafika", name: "Grafika ir dizainas" },
  { slug: "sablonai", name: "Šablonai" },
  { slug: "presetai", name: "Presetai ir filtrai" },
  { slug: "e-knygos", name: "E-knygos ir gidai" },
  { slug: "kursai", name: "Kursai" },
  { slug: "muzika", name: "Muzika ir garsai" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryName(slug: string | null): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? "Kita";
}

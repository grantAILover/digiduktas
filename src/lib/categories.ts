export const CATEGORIES = [
  { slug: "grafika", name: "Grafika ir dizainas", emoji: "🎨" },
  { slug: "sablonai", name: "Šablonai", emoji: "📄" },
  { slug: "presetai", name: "Presetai ir filtrai", emoji: "📸" },
  { slug: "e-knygos", name: "E-knygos ir gidai", emoji: "📚" },
  { slug: "kursai", name: "Kursai", emoji: "🎓" },
  { slug: "muzika", name: "Muzika ir garsai", emoji: "🎵" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryName(slug: string | null): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? "Kita";
}

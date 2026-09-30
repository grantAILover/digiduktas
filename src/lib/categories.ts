// Kategorijos. Pagrindinė niša — mokymosi medžiaga (egzaminams ir pamokoms).
//  active   — galima pasirinkti įkeliant, rodoma turguje
//  soon     — rodoma kaip „netrukus", pasirinkti negalima
//  disabled — nebenaudojama (autorių teisių rizika); lieka tik senų produktų pavadinimui
export type CategoryStatus = "active" | "soon" | "disabled";

export const CATEGORIES = [
  { slug: "vbe", name: "Egzaminai", status: "active" },
  { slug: "mokykline", name: "Mokyklinė medžiaga", status: "active" },
  { slug: "sablonai", name: "Šablonai", status: "soon" },
  { slug: "grafika", name: "Grafika ir dizainas", status: "soon" },
  { slug: "presetai", name: "Presetai ir filtrai", status: "soon" },
  { slug: "kursai", name: "Vaizdo kursai", status: "soon" },
  { slug: "e-knygos", name: "E-knygos ir gidai", status: "disabled" },
  { slug: "muzika", name: "Muzika ir garsai", status: "disabled" },
] as const satisfies readonly { slug: string; name: string; status: CategoryStatus }[];

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const ACTIVE_CATEGORIES = CATEGORIES.filter((c) => c.status === "active");
export const SOON_CATEGORIES = CATEGORIES.filter((c) => c.status === "soon");

export function categoryName(slug: string | null): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? "Kita";
}

export function isActiveCategory(slug: string | null | undefined): boolean {
  return ACTIVE_CATEGORIES.some((c) => c.slug === slug);
}

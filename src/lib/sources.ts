// Iš kur atėjo žmogus — vienas aiškus pavadinimas statistikai ir eksportui.
// Be serverio importų.

export type SourceFields = {
  utm_source?: string | null;
  referred_by?: string | null;
  referrer?: string | null;
};

const HOSTS: [RegExp, string][] = [
  [/tiktok\./, "tiktok"],
  [/instagram\./, "instagram"],
  [/(facebook|messenger|fb)\./, "facebook"],
  [/(whatsapp|wa\.me)/, "whatsapp"],
  [/google\./, "google"],
  [/(youtube|youtu\.be)/, "youtube"],
];

/** Prioritetas: UTM žymė → draugo pakvietimas → svetainė, iš kurios atėjo → tiesiogiai. */
export function sourceOf(r: SourceFields): string {
  if (r.utm_source) return r.utm_source.toLowerCase();
  if (r.referred_by) return "pakvietimas";
  if (r.referrer) {
    const host = r.referrer.toLowerCase();
    for (const [re, name] of HOSTS) if (re.test(host)) return name;
    return host.replace(/^www\./, "");
  }
  return "tiesiogiai";
}

export const SELLER_TYPES = [
  { value: "mokytojas", label: "Mokytojas (-a)" },
  { value: "korepetitorius", label: "Korepetitorius (-ė)" },
  { value: "abiturientas", label: "Abiturientas (-ė)" },
  { value: "kita", label: "Kita" },
] as const;

export type SellerType = (typeof SELLER_TYPES)[number]["value"];

export function sellerTypeLabel(v: string | null | undefined) {
  return SELLER_TYPES.find((t) => t.value === v)?.label ?? "";
}

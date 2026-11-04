// Kainų taisyklės. Be serverio importų — naudojama ir formose.

/**
 * Mažiausia kaina — apsauga nuo klaidos (pvz. „0,69" vietoj „69"): Stripe mokestis
 * (~1,5 % + 0,25 € ES kortelei) suvalgytų beveik visą sumą.
 */
export const MIN_PRICE_CENTS = 300;
export const MAX_PRICE_CENTS = 1_000_000; // 10 000 €

export const MIN_PRICE_LABEL = "3,00 €";

/** „9,99" / "9.99" → 999 centų; neteisinga → null. */
export function parsePriceEur(input: string): number | null {
  const s = String(input ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

/** Klaidos tekstas arba null, jei kaina tinkama. */
export function priceError(cents: number | null): string | null {
  if (cents === null) return "Neteisinga kaina. Pvz.: 9,99";
  if (cents < MIN_PRICE_CENTS) return `Mažiausia kaina — ${MIN_PRICE_LABEL}.`;
  if (cents > MAX_PRICE_CENTS) return "Per didelė kaina.";
  return null;
}

/** Neprivaloma kaina (pvz. „Su įdiegimu"): tuščia → null (lygis nesiūlomas). */
export function parseOptionalPrice(input: string | null | undefined): { cents: number | null; error: string | null } {
  if (!String(input ?? "").trim()) return { cents: null, error: null };
  const cents = parsePriceEur(String(input));
  const error = priceError(cents);
  return error ? { cents: null, error: `Kaina su įdiegimu: ${error.toLowerCase()}` } : { cents, error: null };
}

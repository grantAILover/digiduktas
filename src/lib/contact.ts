// Pardavėjo kontaktas: Instagram arba telefonas. Be serverio importų.

/**
 * Suvienodina kontaktą: Instagram nuoroda ar vardas → „@vardas", telefonas → skaitmenys (+ leidžiamas).
 * Neteisingas → null.
 */
export function normalizeContact(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 100) return null;

  const fromUrl = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(s);
  if (fromUrl) return `@${fromUrl[1].toLowerCase()}`;

  const phone = s.replace(/[\s()-]/g, "");
  if (/^\+?\d{8,15}$/.test(phone)) return phone;

  const handle = s.replace(/^@/, "");
  if (/^[A-Za-z0-9._]{2,30}$/.test(handle) && /[A-Za-z]/.test(handle)) return `@${handle.toLowerCase()}`;

  return null;
}

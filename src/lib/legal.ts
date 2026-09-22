// ─────────────────────────────────────────────────────────────
// Operatoriaus (svetainės valdytojo) duomenys — vienoje vietoje.
// Užpildykite laužtinius [ ] laukus savo tikrais duomenimis.
// Šiuos duomenis naudoja visi 3 teisiniai dokumentai.
// ─────────────────────────────────────────────────────────────
export const OPERATOR = {
  // Prekės ženklas / svetainė
  brand: "digiduktas",
  site: "digiduktas.lt",

  // Individuali veikla:
  legalName: "Grantas Liaudanskas",
  activityNo: "1547835",
  // (nebūtina) veiklos adresas korespondencijai:
  address: "[adresas, jei norite nurodyti]",

  // Kontaktai — laikinai asmeninis paštas (kol nesukurta info@digiduktas.lt dėžutė).
  email: "grantas626@gmail.com",

  // Komisija (%)
  commissionPct: 10,
} as const;

// Paskutinio atnaujinimo data (rodoma dokumentų viršuje).
export const LEGAL_UPDATED = "2026 m. rugsėjo 16 d.";

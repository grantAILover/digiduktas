// Šaltinio fiksavimas naršyklėje (UTM žymės, draugo pakvietimas, iš kur atėjo).
// Saugoma tik šiame įrenginyje (localStorage), be slapukų. Tik naršyklei.

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  ref?: string;
};

const KEY = "dd_attr";

export function readAttribution(): Attribution | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

/**
 * Pirmas apsilankymas su šaltiniu laimi („first touch") — kad matytum, kuris kanalas
 * žmogų atvedė pirmą kartą. Draugo kodas įsimenamas, jei dar nebuvo.
 */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(location.search);
    const fresh: Attribution = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign"] as const) {
      const v = params.get(k);
      if (v) fresh[k] = v.trim().toLowerCase().slice(0, 100);
    }
    const ref = params.get("ref");
    if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) fresh.ref = ref.toLowerCase();
    if (document.referrer) {
      const host = new URL(document.referrer).host;
      if (host && host !== location.host) fresh.referrer = host.slice(0, 100);
    }

    const existing = readAttribution();
    if (!existing) {
      if (Object.keys(fresh).length) localStorage.setItem(KEY, JSON.stringify(fresh));
    } else if (fresh.ref && !existing.ref) {
      localStorage.setItem(KEY, JSON.stringify({ ...existing, ref: fresh.ref }));
    }
  } catch {
    // privatus langas / užblokuota saugykla — tiesiog nefiksuojam
  }
}

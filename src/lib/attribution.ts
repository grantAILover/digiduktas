// Iš kur atėjo žmogus — paimama iš dabartinės nuorodos (UTM žymės, draugo kodas)
// ir svetainės, iš kurios atėjo. NIEKO nesaugoma naršyklėje (jokių slapukų ar
// localStorage), todėl sutikimo nereikia. Tik naršyklei.

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  ref?: string;
};

export function attributionFromLocation(): Attribution {
  const out: Attribution = {};
  try {
    const params = new URLSearchParams(location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign"] as const) {
      const v = params.get(k);
      if (v) out[k] = v.trim().toLowerCase().slice(0, 100);
    }
    const ref = params.get("ref");
    if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) out.ref = ref.toLowerCase();
    if (document.referrer) {
      const host = new URL(document.referrer).host;
      if (host && host !== location.host) out.referrer = host.slice(0, 100);
    }
  } catch {
    // nekritinis
  }
  return out;
}

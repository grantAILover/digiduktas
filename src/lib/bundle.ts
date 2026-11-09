// Komplekto užklausos taisyklės. Be serverio importų — naudojama ir formoje.

export type BundleStatus = "naujas" | "atsakyta" | "uzdaryta";

export const BUNDLE_STATUS_LABEL: Record<BundleStatus, string> = {
  naujas: "Nauja",
  atsakyta: "Atsakyta",
  uzdaryta: "Uždaryta",
};

export function isBundleStatus(v: unknown): v is BundleStatus {
  return v === "naujas" || v === "atsakyta" || v === "uzdaryta";
}

export type BundleInput = {
  name: string;
  email: string;
  phone: string | null;
  plugins: string[];
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const clean = (v: unknown, max: number) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};

/**
 * Patikrina užklausą. `allowedPlugins` — šiuo metu paskelbtų pluginų pavadinimai
 * (pažymėti galima tik juos, kad į laišką nepatektų bet koks tekstas).
 */
export function parseBundleForm(
  fd: FormData,
  allowedPlugins: string[],
): { data?: BundleInput; error?: string; spam?: boolean } {
  // Botams skirtas paslėptas laukas — žmogus jo nemato ir nepildo
  if (String(fd.get("website") ?? "").trim()) return { spam: true };

  const name = clean(fd.get("name"), 100);
  if (!name) return { error: "Įrašykite savo vardą." };
  const email = clean(fd.get("email"), 200)?.toLowerCase() ?? null;
  if (!email || !EMAIL_RE.test(email)) return { error: "Įrašykite teisingą el. pašto adresą." };

  const phoneRaw = clean(fd.get("phone"), 30);
  let phone: string | null = null;
  if (phoneRaw) {
    const digits = phoneRaw.replace(/\D/g, "");
    if (!/^\+?[\d\s()-]+$/.test(phoneRaw) || digits.length < 8 || digits.length > 15) {
      return { error: "Neteisingas telefono numeris (galite palikti tuščią)." };
    }
    phone = phoneRaw.startsWith("+") ? `+${digits}` : digits;
  }

  const allowed = new Set(allowedPlugins);
  const plugins = [...new Set(fd.getAll("plugins").map(String))].filter((p) => allowed.has(p));

  const message = clean(fd.get("message"), 2000);
  if (!message || message.length < 10) {
    return { error: "Trumpai aprašykite, kokį darbą norite automatizuoti." };
  }

  return { data: { name, email, phone, plugins, message } };
}

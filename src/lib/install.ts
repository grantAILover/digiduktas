// Diegimo anketos taisyklės. Be serverio importų — naudojama ir formoje.

export type InstallStatus = "naujas" | "suderinta" | "idiegta";
export type InstallOs = "windows" | "mac" | "kita";

export const INSTALL_STATUS_LABEL: Record<InstallStatus, string> = {
  naujas: "Naujas",
  suderinta: "Laikas suderintas",
  idiegta: "Įdiegta",
};

export const OS_LABEL: Record<InstallOs, string> = {
  windows: "Windows",
  mac: "Mac",
  kita: "Kita / nežinau",
};

export function isInstallStatus(v: unknown): v is InstallStatus {
  return v === "naujas" || v === "suderinta" || v === "idiegta";
}

export type InstallInput = {
  phone: string;
  preferred_time: string;
  os: InstallOs;
  tools: string | null;
  notes: string | null;
};

const clean = (v: unknown, max: number) => {
  const s = String(v ?? "").trim().replace(/\s+/g, " ");
  return s ? s.slice(0, max) : null;
};

/** Patikrina anketą. Telefonas: +, skaitmenys, tarpai — 8–15 skaitmenų. */
export function parseInstallForm(fd: FormData): { data?: InstallInput; error?: string } {
  const phoneRaw = clean(fd.get("phone"), 30);
  const digits = (phoneRaw ?? "").replace(/\D/g, "");
  if (!phoneRaw || !/^\+?[\d\s()-]+$/.test(phoneRaw) || digits.length < 8 || digits.length > 15) {
    return { error: "Įrašykite telefono numerį, pvz. +370 600 00000." };
  }
  const preferred_time = clean(fd.get("preferred_time"), 300);
  if (!preferred_time) return { error: "Parašykite, kada jums patogu, pvz. „darbo dienomis po 17 val.“" };
  const os = fd.get("os");
  if (os !== "windows" && os !== "mac" && os !== "kita") return { error: "Pasirinkite kompiuterį." };
  return {
    data: {
      phone: phoneRaw.startsWith("+") ? `+${digits}` : digits,
      preferred_time,
      os,
      tools: clean(fd.get("tools"), 500),
      notes: clean(fd.get("notes"), 1000),
    },
  };
}

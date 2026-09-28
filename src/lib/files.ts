// Failų tipai ir pagalbinės funkcijos. Be serverio importų — naudojama ir naršyklėje.

export type FileKind = "pdf" | "audio" | "video" | "other";

export const MAX_PRODUCT_FILES = 50;
// Supabase Free plano riba vienam failui. Perėjus į Pro — padidinti.
export const MAX_UPLOAD_MB = 50;

// Pasirašytų nuorodų galiojimas (sekundėmis)
export const STREAM_TTL = 10 * 60; // peržiūra/klausymas
export const DOWNLOAD_TTL = 5 * 60; // atsisiuntimas

const EXT: Record<Exclude<FileKind, "other">, string[]> = {
  pdf: ["pdf"],
  audio: ["mp3", "m4a", "aac"],
  video: ["mp4", "webm", "m4v"],
};

function extOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

/** Nustato failo tipą pagal plėtinį (patikimiau nei naršyklės MIME), atsarginis — MIME. */
export function detectKind(fileName: string, mime?: string | null): FileKind {
  const ext = extOf(fileName);
  for (const kind of Object.keys(EXT) as (keyof typeof EXT)[]) {
    if (EXT[kind].includes(ext)) return kind;
  }
  const m = (mime ?? "").toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m === "audio/mpeg" || m === "audio/mp4" || m === "audio/aac" || m === "audio/x-m4a") return "audio";
  if (m === "video/mp4" || m === "video/webm") return "video";
  return "other";
}

/** Ar failą galima atidaryti naršyklėje (viewer). */
export function isViewable(kind: FileKind) {
  return kind !== "other";
}

/**
 * Atsisiuntimą išjungti galima tik tada, kai VISI failai peržiūrimi naršyklėje —
 * kitaip pirkėjas negautų nieko (pvz. ZIP ar presetas be atsisiuntimo).
 */
export function canDisableDownload(kinds: FileKind[]) {
  return kinds.length > 0 && kinds.every(isViewable);
}

export const KIND_LABEL: Record<FileKind, string> = {
  pdf: "PDF",
  audio: "Garso įrašas",
  video: "Vaizdo įrašas",
  other: "Failas",
};

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

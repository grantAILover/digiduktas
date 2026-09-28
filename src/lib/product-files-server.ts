// Produkto failų patikra server action'ams. TIK serveriui.
import { MAX_PRODUCT_FILES, canDisableDownload, detectKind, type FileKind } from "@/lib/files";

export type NewFileInput = {
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
};
export type FileInput = { id: string } | NewFileInput;

export type NewFileRow = {
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: FileKind;
};

export function isExisting(f: FileInput): f is { id: string } {
  return "id" in f;
}

/**
 * Naujo failo patikra. Kelias turi būti pardavėjo aplanke — kitaip būtų galima
 * „prisegti" svetimą failą. Tipą nustatom patys, nepasitikim naršykle.
 */
export function toNewFileRow(userId: string, f: NewFileInput): NewFileRow | null {
  const path = String(f.storagePath ?? "");
  if (!path.startsWith(`${userId}/`) || path.includes("..")) return null;
  const name = String(f.fileName ?? "").trim().slice(0, 200);
  if (!name) return null;
  const mime = typeof f.mimeType === "string" ? f.mimeType.slice(0, 100) : null;
  const size = Number(f.sizeBytes);
  return {
    storage_path: path,
    file_name: name,
    mime_type: mime,
    size_bytes: Number.isFinite(size) && size >= 0 ? Math.round(size) : null,
    kind: detectKind(name, mime),
  };
}

export function checkFileCount(n: number): string | null {
  if (n < 1) return "Įkelkite bent vieną parduodamą failą.";
  if (n > MAX_PRODUCT_FILES) return `Daugiausia ${MAX_PRODUCT_FILES} failų.`;
  return null;
}

/** Atsisiuntimą išjungti galima tik kai visi failai peržiūrimi naršyklėje. */
export function effectiveAllowDownload(requested: boolean, kinds: FileKind[]) {
  return requested || !canDisableDownload(kinds);
}

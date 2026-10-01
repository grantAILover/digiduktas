"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  KIND_LABEL,
  MAX_PRODUCT_FILES,
  MAX_UPLOAD_MB,
  canDisableDownload,
  detectKind,
  formatBytes,
  type FileKind,
} from "@/lib/files";
import type { FileInput } from "@/lib/product-files-server";

export type FileItem = {
  key: string;
  file_name: string;
  kind: FileKind;
  size_bytes: number | null;
  existingId?: string; // jau įkeltas failas
  file?: File; // naujas, dar neįkeltas
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(-80);
}

/** Įkelia naujus failus į privatų bucket'ą; esamiems grąžina id. */
export async function uploadFileItems(
  supabase: SupabaseClient,
  userId: string,
  items: FileItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<FileInput[]> {
  const total = items.filter((i) => i.file).length;
  let done = 0;
  const out: FileInput[] = [];
  for (const item of items) {
    if (item.existingId) {
      out.push({ id: item.existingId });
      continue;
    }
    const f = item.file!;
    onProgress?.(done + 1, total);
    const path = `${userId}/${crypto.randomUUID()}-${safeName(f.name)}`;
    const { error } = await supabase.storage
      .from("product-files")
      .upload(path, f, { contentType: f.type || undefined });
    if (error) throw new Error(`Nepavyko įkelti „${f.name}": ${error.message}`);
    out.push({ storagePath: path, fileName: f.name, mimeType: f.type || null, sizeBytes: f.size });
    done++;
  }
  return out;
}

/** Pardavėjo patvirtinimas dėl teisių į turinį (privalomas įkeliant naujus failus). */
export function RightsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3 text-sm">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
      />
      <span>
        Patvirtinu, kad turinys yra mano sukurtas (arba turiu teisę jį parduoti) ir kad man yra 18 metų.
        <span className="mt-0.5 block text-xs text-muted">
          Svetimų darbų, vadovėlių ar kitų leidinių kopijos draudžiamos.{" "}
          <a href="/taisykles#pazeidimai" target="_blank" className="text-brand hover:underline">
            Taisyklės
          </a>
        </span>
      </span>
    </label>
  );
}

export default function ProductFilesEditor({
  items,
  onChange,
  allowDownload,
  onAllowDownloadChange,
  onError,
}: {
  items: FileItem[];
  onChange: (items: FileItem[]) => void;
  allowDownload: boolean;
  onAllowDownloadChange: (v: boolean) => void;
  onError: (msg: string | null) => void;
}) {
  const lockDownload = items.length > 0 && !canDisableDownload(items.map((i) => i.kind));

  function add(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const tooBig = picked.filter((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024);
    const ok = picked.filter((f) => f.size <= MAX_UPLOAD_MB * 1024 * 1024);
    const room = MAX_PRODUCT_FILES - items.length;
    onError(
      tooBig.length
        ? `Per dideli failai (daugiausia ${MAX_UPLOAD_MB} MB): ${tooBig.map((f) => f.name).join(", ")}`
        : ok.length > room
          ? `Daugiausia ${MAX_PRODUCT_FILES} failų.`
          : null,
    );
    onChange([
      ...items,
      ...ok.slice(0, Math.max(0, room)).map((f) => ({
        key: crypto.randomUUID(),
        file: f,
        file_name: f.name,
        kind: detectKind(f.name, f.type),
        size_bytes: f.size,
      })),
    ]);
  }

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const iconBtn =
    "grid h-7 w-7 place-items-center rounded-md border border-line text-xs transition-colors hover:bg-brand-soft disabled:opacity-30";

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      Parduodami failai
      {items.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <li
              key={it.key}
              className={`flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 ${
                it.file ? "border-brand/40" : "border-line"
              }`}
            >
              <span className="w-5 shrink-0 text-xs text-muted">{i + 1}.</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{it.file_name}</span>
                <span className="text-xs font-normal text-muted">
                  {KIND_LABEL[it.kind]}
                  {it.size_bytes ? ` · ${formatBytes(it.size_bytes)}` : ""}
                  {it.file ? " · naujas" : ""}
                </span>
              </span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={iconBtn} aria-label="Aukštyn">
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className={iconBtn}
                aria-label="Žemyn"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x.key !== it.key))}
                className={iconBtn}
                aria-label="Pašalinti"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
      <input
        type="file"
        multiple
        onChange={add}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
      />
      <span className="text-xs font-normal text-muted">
        Failai privatūs — pirkėjai juos gauna tik po apmokėjimo. Audio knygai įkelkite kelis MP3 —
        pirkėjas matys juos kaip skyrius šia tvarka. Iki {MAX_UPLOAD_MB} MB vienam failui.
      </span>

      <label
        className={`mt-2 flex items-start gap-3 rounded-lg border border-line bg-surface p-3 ${
          lockDownload ? "opacity-70" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={allowDownload || lockDownload}
          disabled={lockDownload}
          onChange={(e) => onAllowDownloadChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span>
          Leisti pirkėjams atsisiųsti failą
          <span className="mt-0.5 block text-xs font-normal text-muted">
            {lockDownload
              ? "Kai kurių failų (pvz. ZIP, presetų) naršyklėje peržiūrėti negalima, todėl atsisiuntimas visada leidžiamas."
              : "Išjungus pirkėjai galės tik peržiūrėti PDF ir klausyti/žiūrėti įrašus naršyklėje."}
          </span>
        </span>
      </label>
    </div>
  );
}

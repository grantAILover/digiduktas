"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { KIND_LABEL, formatBytes, isViewable, type FileKind } from "@/lib/files";
import MediaPlayer from "./MediaPlayer";

// PDF.js veikia tik naršyklėje
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <p className="p-6 text-center text-sm text-muted">Įkeliamas PDF…</p>,
});

export type ViewerFile = {
  id: string;
  file_name: string;
  kind: FileKind;
  size_bytes: number | null;
};

function formatTime(sec: number) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

export default function Viewer({
  files,
  canDownload,
  initialFileId,
  progress: initialProgress,
}: {
  files: ViewerFile[];
  canDownload: boolean;
  initialFileId: string | null;
  progress: Record<string, number>;
}) {
  const [index, setIndex] = useState(() =>
    Math.max(0, files.findIndex((f) => f.id === initialFileId)),
  );
  const [autoPlay, setAutoPlay] = useState(false);
  const [progress, setProgress] = useState(initialProgress);

  const current = files[index];

  const onProgress = useCallback((fileId: string, seconds: number) => {
    setProgress((p) => ({ ...p, [fileId]: seconds }));
  }, []);

  // Skyrius baigėsi → kitas to paties tipo failas
  const onEnded = useCallback(() => {
    const next = files.findIndex((f, i) => i > index && f.kind === files[index].kind);
    if (next !== -1) {
      setAutoPlay(true);
      setIndex(next);
    }
  }, [files, index]);

  function select(i: number) {
    setAutoPlay(false);
    setIndex(i);
  }

  if (!current) {
    return <p className="text-sm text-muted">Šiame produkte failų nėra.</p>;
  }

  const downloadLink = (f: ViewerFile, label = "Atsisiųsti") =>
    canDownload ? (
      <a
        href={`/api/files/${f.id}/download`}
        className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:bg-brand-soft"
      >
        {label}
      </a>
    ) : null;

  return (
    <div className={files.length > 1 ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]" : ""}>
      {/* Peržiūra */}
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="truncate font-semibold">{current.file_name}</h2>
          {downloadLink(current)}
        </div>

        {current.kind === "pdf" && (
          <PdfViewer key={current.id} fileId={current.id} canDownload={canDownload} />
        )}

        {(current.kind === "audio" || current.kind === "video") && (
          <MediaPlayer
            key={current.id}
            fileId={current.id}
            kind={current.kind}
            startAt={progress[current.id] ?? 0}
            canDownload={canDownload}
            autoPlay={autoPlay}
            onProgress={onProgress}
            onEnded={onEnded}
          />
        )}

        {!isViewable(current.kind) && (
          <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="font-medium">Šio failo naršyklėje peržiūrėti negalima</p>
            <p className="mt-1 text-sm text-muted">
              {canDownload
                ? "Atsisiųskite jį ir atidarykite savo įrenginyje."
                : "Pardavėjas neleido atsisiųsti šio failo."}
            </p>
            {canDownload && (
              <a
                href={`/api/files/${current.id}/download`}
                className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
              >
                Atsisiųsti ({formatBytes(current.size_bytes) || "failas"})
              </a>
            )}
          </div>
        )}
      </div>

      {/* Failų / skyrių sąrašas */}
      {files.length > 1 && (
        <aside>
          <h3 className="text-sm font-semibold text-muted">Turinys ({files.length})</h3>
          <ol className="mt-3 flex flex-col gap-1.5">
            {files.map((f, i) => {
              const pos = progress[f.id] ?? 0;
              const active = i === index;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => select(i)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-surface hover:border-brand/50"
                    }`}
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold text-muted">
                      {i + 1}.
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{f.file_name}</span>
                      <span className="text-xs text-muted">
                        {KIND_LABEL[f.kind]}
                        {pos > 0 && (f.kind === "audio" || f.kind === "video")
                          ? ` · tęsti nuo ${formatTime(pos)}`
                          : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      )}
    </div>
  );
}

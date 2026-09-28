"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useSignedSource } from "./useSignedSource";

// Worker turi būti nustatytas TAME PAČIAME modulyje, kur naudojami <Document>/<Page>.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

function readPage(fileId: string) {
  try {
    return Number(localStorage.getItem(`pdf-page:${fileId}`)) || 1;
  } catch {
    return 1;
  }
}

/** Gauna trumpą nuorodą ir atvaizduoja PDF. */
export default function PdfViewer({ fileId, canDownload }: { fileId: string; canDownload: boolean }) {
  const { source, error, refresh } = useSignedSource(fileId);
  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }
  if (!source) return <p className="p-6 text-center text-sm text-muted">Įkeliama…</p>;
  return (
    <PdfDocument fileId={fileId} url={source.url} canDownload={canDownload} onExpired={refresh} />
  );
}

/** PDF atvaizdavimas iš konkrečios nuorodos (be atsisiuntimo/spausdinimo mygtukų). */
export function PdfDocument({
  fileId,
  url,
  canDownload,
  onExpired,
}: {
  fileId: string;
  url: string;
  canDownload: boolean;
  onExpired?: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(() => readPage(fileId));
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const retried = useRef(false);

  // Plotis matuojamas TIK keičiantis lango dydžiui (ne ResizeObserver'iu). Kitaip
  // susidaro grįžtamasis ryšys: puslapis perpiešiamas → atsiranda/dingsta slankjuostė →
  // konteinerio plotis → vėl perpiešimas… ir PDF mirga. Slankjuostė `resize` nesukelia.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    // setTimeout (ne requestAnimationFrame) — veikia ir fone atidarytame skirtuke
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const measure = (delay = 0) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const cs = getComputedStyle(el);
        const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (w > 0) {
          tries = 0;
          setWidth(Math.round(w));
        } else if (tries++ < 20) {
          measure(100); // dar nematomas — bandom vėliau
        }
      }, delay);
    };
    const onResize = () => measure(100); // sutraukiam dažnus resize įvykius
    measure();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Įsimenam puslapį (tik šiame įrenginyje)
  useEffect(() => {
    try {
      localStorage.setItem(`pdf-page:${fileId}`, String(page));
    } catch {}
  }, [fileId, page]);

  const go = useCallback(
    (delta: number) => setPage((p) => Math.min(Math.max(1, p + delta), numPages || 1)),
    [numPages],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Stabilus objektas — kitaip react-pdf perkrauna dokumentą kiekvieno render'io metu
  const file = useMemo(() => ({ url }), [url]);

  function onLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n);
    setPage((p) => Math.min(p, n));
    setLoadError(null);
  }

  // Jei nuoroda spėjo pasibaigti — vieną kartą bandom su nauja
  function onLoadError() {
    if (!retried.current && onExpired) {
      retried.current = true;
      onExpired();
      return;
    }
    setLoadError("Nepavyko atidaryti PDF. Perkraukite puslapį.");
  }

  // −20 px atsarga: jei vėliau atsiras puslapio slankjuostė, PDF vis tiek tilps
  const pageWidth = width ? Math.round(Math.min(width - 20, 900) * scale) : undefined;
  const btn =
    "rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:bg-brand-soft disabled:opacity-40";

  if (loadError) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Įrankių juosta — be atsisiuntimo/spausdinimo mygtukų */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={page <= 1} className={btn}>
            ‹ Atgal
          </button>
          <span className="min-w-20 text-center text-sm text-muted">
            {numPages ? `${page} / ${numPages}` : "…"}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!numPages || page >= numPages}
            className={btn}
          >
            Pirmyn ›
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.25).toFixed(2)))}
            disabled={scale <= MIN_SCALE}
            className={btn}
            aria-label="Mažinti"
          >
            −
          </button>
          <span className="w-12 text-center text-sm text-muted">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.25).toFixed(2)))}
            disabled={scale >= MAX_SCALE}
            className={btn}
            aria-label="Didinti"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={wrap}
        className={`overflow-auto rounded-xl border border-line bg-canvas p-2 ${
          canDownload ? "" : "no-print select-none"
        }`}
        onContextMenu={canDownload ? undefined : (e) => e.preventDefault()}
      >
        {/* suspense={false}: be jo react-pdf naudoja React Suspense ir kiekvieno
            perpiešimo metu paslepia VISĄ viewer'į (mirgėjimas „Įkeliama…") */}
        <Document
          file={file}
          suspense={false}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={<p className="p-6 text-center text-sm text-muted">Įkeliamas PDF…</p>}
          error={<p className="p-6 text-center text-sm text-red-700">Nepavyko atidaryti PDF.</p>}
        >
          <Page
            pageNumber={page}
            width={pageWidth}
            suspense={false}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<p className="p-6 text-center text-sm text-muted">Įkeliamas puslapis…</p>}
            className="mx-auto w-fit shadow-sm"
          />
        </Document>
      </div>
    </div>
  );
}

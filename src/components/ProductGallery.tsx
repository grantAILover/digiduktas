"use client";

import { useCallback, useEffect, useState } from "react";
import { CoverPlaceholder } from "./ProductCard";

export default function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const imgs = images.filter(Boolean);
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);

  const count = imgs.length;
  const go = useCallback(
    (d: number) => setI((p) => (count ? (p + d + count) % count : 0)),
    [count],
  );

  // Jei paveikslėlių sąrašas pasikeičia (pvz. formoje), nenukrypti už ribų
  useEffect(() => {
    if (i > count - 1) setI(0);
  }, [count, i]);

  // Klaviatūra padidinimo režime
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, go]);

  if (count === 0) {
    return (
      <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border border-line bg-brand-soft">
        <CoverPlaceholder />
      </div>
    );
  }

  const current = imgs[Math.min(i, count - 1)];

  return (
    <div>
      {/* Pagrindinis paveikslėlis */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-brand-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={title}
          className="h-full w-full cursor-zoom-in object-contain"
          onClick={() => setZoom(true)}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Ankstesnis"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-surface"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Kitas"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-surface"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded-md bg-ink/70 px-2 py-0.5 text-xs font-medium text-surface">
              {i + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Miniatiūros */}
      {count > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {imgs.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                idx === i ? "border-brand" : "border-line hover:border-brand/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Padidinimas (lightbox) */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            aria-label="Uždaryti"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-lg text-ink"
            onClick={() => setZoom(false)}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={title}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Ankstesnis"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-xl text-ink"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Kitas"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-xl text-ink"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

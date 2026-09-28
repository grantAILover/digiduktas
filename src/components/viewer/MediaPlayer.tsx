"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSignedSource } from "./useSignedSource";

const SAVE_EVERY_MS = 10_000;
const RATES = [0.75, 1, 1.25, 1.5, 2];

type Props = {
  fileId: string;
  kind: "audio" | "video";
  startAt: number; // sekundės, nuo kur tęsti
  canDownload: boolean;
  autoPlay?: boolean;
  onProgress?: (fileId: string, seconds: number) => void;
  onEnded?: () => void;
};

export default function MediaPlayer({
  fileId,
  kind,
  startAt,
  canDownload,
  autoPlay,
  onProgress,
  onEnded,
}: Props) {
  const { source, error, refresh } = useSignedSource(fileId);
  const ref = useRef<HTMLMediaElement | null>(null);

  // Kol laukiam, kol bus atstatyta pozicija — nesaugom (kitaip įrašytume 0).
  const pendingSeek = useRef<number | null>(startAt);
  const resumeAfterLoad = useRef(!!autoPlay);
  const playing = useRef(false);
  const lastTime = useRef(startAt);
  const lastSaved = useRef(0);
  const refreshes = useRef<number[]>([]);
  const [rate, setRate] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);

  const save = useCallback(
    (seconds: number, beacon = false) => {
      const payload = JSON.stringify({ productFileId: fileId, positionSeconds: seconds });
      lastSaved.current = Date.now();
      onProgress?.(fileId, seconds);
      if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/progress", new Blob([payload], { type: "application/json" }));
        return;
      }
      fetch("/api/progress", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    },
    [fileId, onProgress],
  );

  // Uždarant/paslepiant puslapį ar perjungiant failą — išsaugom paskutinę vietą.
  useEffect(() => {
    const flush = () => {
      if (pendingSeek.current === null && lastTime.current > 0) save(lastTime.current, true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [save]);

  function handleLoadedMetadata() {
    const el = ref.current;
    if (!el) return;
    el.playbackRate = rate;
    if (pendingSeek.current !== null) {
      const t = pendingSeek.current;
      const max = Number.isFinite(el.duration) ? Math.max(0, el.duration - 1) : t;
      if (t > 0) el.currentTime = Math.min(t, max);
      pendingSeek.current = null;
    }
    if (resumeAfterLoad.current) {
      resumeAfterLoad.current = false;
      el.play().catch(() => {});
    }
  }

  function handleTimeUpdate() {
    const el = ref.current;
    if (!el || pendingSeek.current !== null) return;
    lastTime.current = el.currentTime;
    if (Date.now() - lastSaved.current > SAVE_EVERY_MS) save(el.currentTime);
  }

  function handlePause() {
    playing.current = false;
    const el = ref.current;
    if (!el || pendingSeek.current !== null || el.ended) return;
    save(el.currentTime);
  }

  function handleEnded() {
    playing.current = false;
    lastTime.current = 0;
    save(0); // skyrius baigtas — kitą kartą nuo pradžios
    onEnded?.();
  }

  // Nuoroda galioja ribotai. Kai ji pasibaigia, naršyklės Range užklausa nepavyksta —
  // tyliai paimam naują nuorodą ir tęsiam nuo tos pačios vietos.
  async function handleError() {
    const now = Date.now();
    refreshes.current = refreshes.current.filter((t) => now - t < 60_000);
    if (refreshes.current.length >= 3) {
      setNotice("Nepavyko paleisti failo. Perkraukite puslapį.");
      return;
    }
    refreshes.current.push(now);
    pendingSeek.current = lastTime.current;
    resumeAfterLoad.current = playing.current;
    await refresh();
  }

  function skip(delta: number) {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime + delta);
  }

  function changeRate(r: number) {
    setRate(r);
    if (ref.current) ref.current.playbackRate = r;
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  const common = {
    src: source?.url,
    controls: true,
    preload: "metadata" as const,
    controlsList: canDownload ? undefined : "nodownload",
    onContextMenu: canDownload ? undefined : (e: React.MouseEvent) => e.preventDefault(),
    onLoadedMetadata: handleLoadedMetadata,
    onTimeUpdate: handleTimeUpdate,
    onPlay: () => {
      playing.current = true;
    },
    onPause: handlePause,
    onEnded: handleEnded,
    onError: source ? handleError : undefined,
  };

  return (
    <div className="flex flex-col gap-3">
      {kind === "video" ? (
        <video
          {...common}
          ref={(el) => {
            ref.current = el;
          }}
          playsInline
          className="aspect-video w-full rounded-xl bg-ink"
        />
      ) : (
        <audio
          {...common}
          ref={(el) => {
            ref.current = el;
          }}
          className="w-full"
        />
      )}

      {!source && <p className="text-sm text-muted">Įkeliama…</p>}
      {notice && <p className="text-sm text-red-700">{notice}</p>}

      {kind === "audio" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => skip(-15)}
            className="rounded-lg border border-line px-3 py-1.5 transition-colors hover:bg-brand-soft"
          >
            −15 s
          </button>
          <button
            type="button"
            onClick={() => skip(15)}
            className="rounded-lg border border-line px-3 py-1.5 transition-colors hover:bg-brand-soft"
          >
            +15 s
          </button>
          <span className="ml-2 text-muted">Greitis:</span>
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => changeRate(r)}
              className={`rounded-lg border px-2.5 py-1.5 transition-colors ${
                rate === r ? "border-brand bg-brand text-surface" : "border-line hover:bg-brand-soft"
              }`}
            >
              {String(r).replace(".", ",")}×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

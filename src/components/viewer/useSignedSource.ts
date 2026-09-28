"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SignedSource = {
  type: "file" | "hls";
  url: string;
  expiresAt: string;
};

type Result = { source: SignedSource } | { error: string };

async function fetchSource(fileId: string): Promise<Result> {
  try {
    const res = await fetch(`/api/files/${fileId}/stream`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error ?? "Nepavyko atidaryti failo." };
    return { source: json as SignedSource };
  } catch {
    return { error: "Nepavyko prisijungti. Patikrinkite internetą." };
  }
}

/**
 * Gauna trumpai galiojančią nuorodą iš /api/files/[id]/stream.
 * `refresh()` — paimti naują, kai senoji pasibaigė (pvz. ilgai klausantis).
 */
export function useSignedSource(fileId: string) {
  const [source, setSource] = useState<SignedSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const apply = useCallback((id: number, r: Result) => {
    if (id !== requestId.current) return; // pasenęs atsakymas
    if ("error" in r) {
      setError(r.error);
    } else {
      setError(null);
      setSource(r.source);
    }
  }, []);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    apply(id, await fetchSource(fileId));
  }, [fileId, apply]);

  useEffect(() => {
    const id = ++requestId.current;
    fetchSource(fileId).then((r) => apply(id, r));
  }, [fileId, apply]);

  return { source, error, refresh };
}

"use client";

import { useState } from "react";

const isPhone = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function ShareLinks({ url, text }: { url: string; text: string }) {
  const [notice, setNotice] = useState<string | null>(null);
  const message = `${text} ${url}`;

  async function copy(hint: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice(hint);
    } catch {
      setNotice("Nepavyko nukopijuoti — pažymėk nuorodą žemiau ir nukopijuok ranka.");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // atšaukė — nieko
      }
    } else {
      copy("Nuoroda nukopijuota — įklijuok ją, kur nori.");
    }
  }

  function messenger() {
    if (isPhone()) {
      location.href = `fb-messenger://share/?link=${encodeURIComponent(url)}`;
    } else {
      copy("Nuoroda nukopijuota — įklijuok ją į Messenger pokalbį.");
    }
  }

  const btn =
    "flex items-center justify-center rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={nativeShare}
        className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
      >
        Pasidalinti nuoroda
      </button>
      <div className="grid grid-cols-3 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
        >
          WhatsApp
        </a>
        <button type="button" onClick={messenger} className={btn}>
          Messenger
        </button>
        <button
          type="button"
          onClick={() => copy("Nuoroda nukopijuota — įklijuok ją į Instagram Story (nuorodos lipdukas) ar žinutę.")}
          className={btn}
        >
          Instagram
        </button>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-muted"
        />
        <button type="button" onClick={() => copy("Nuoroda nukopijuota.")} className={btn}>
          Kopijuoti
        </button>
      </div>
      {notice && <p className="text-sm text-green-700">{notice}</p>}
    </div>
  );
}

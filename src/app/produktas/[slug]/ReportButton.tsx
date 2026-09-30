"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { reportProduct, type ReportState } from "./actions";
import { OPERATOR } from "@/lib/legal";

const reasons = [
  "Netinkamas turinys",
  "Autorių teisių pažeidimas",
  "Sukčiavimas ar apgaulė",
  "Neveikia / ne tai, kas aprašyta",
  "Kita",
];

const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand";

export default function ReportButton({
  productId,
  isLoggedIn,
}: {
  productId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(
    reportProduct,
    null,
  );

  if (state?.ok) {
    return (
      <p className="mt-6 text-xs text-muted">
        Ačiū — pranešimas gautas, peržiūrėsime.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 text-xs text-muted underline hover:text-ink"
      >
        Pranešti apie produktą
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-6 flex flex-col gap-2 rounded-lg border border-line bg-surface p-4"
    >
      <input type="hidden" name="productId" value={productId} />
      {!isLoggedIn ? (
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <p>
            Prisijunkite, kad galėtumėte pranešti.{" "}
            <Link href="/auth" className="font-medium text-brand hover:text-brand-dark">
              Prisijungti
            </Link>
          </p>
          <p className="text-xs">
            Esate autorius ir neturite paskyros? Rašykite{" "}
            <a href={`mailto:${OPERATOR.email}`} className="text-brand hover:underline">
              {OPERATOR.email}
            </a>{" "}
            —{" "}
            <Link href="/taisykles#pazeidimai" className="text-brand hover:underline">
              pranešimų tvarka
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <span className="text-sm font-medium">Kodėl pranešate?</span>
          <select name="reason" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Pasirinkite…
            </option>
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            name="details"
            rows={2}
            placeholder="Daugiau informacijos (nebūtina)"
            className={inputCls}
          />
          {state?.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "Siunčiama…" : "Išsiųsti"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-brand-soft"
            >
              Atšaukti
            </button>
          </div>
        </>
      )}
    </form>
  );
}

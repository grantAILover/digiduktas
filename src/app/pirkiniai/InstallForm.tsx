"use client";

import { useActionState } from "react";
import { submitInstallRequest, type InstallFormState } from "./actions";
import { INSTALL_STATUS_LABEL, OS_LABEL, type InstallOs, type InstallStatus } from "@/lib/install";

export type ExistingInstall = {
  phone: string;
  preferred_time: string;
  os: InstallOs;
  tools: string | null;
  notes: string | null;
  status: InstallStatus;
};

const inputCls =
  "rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-brand";

function Fields({ orderId, v }: { orderId: string; v: ExistingInstall | null }) {
  const [state, action, pending] = useActionState<InstallFormState, FormData>(submitInstallRequest, null);
  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Telefonas
        <input name="phone" type="tel" required defaultValue={v?.phone} placeholder="+370 600 00000" className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Kompiuteris
        <select name="os" required defaultValue={v?.os ?? ""} className={inputCls}>
          <option value="" disabled>
            Pasirinkite…
          </option>
          {(Object.keys(OS_LABEL) as InstallOs[]).map((k) => (
            <option key={k} value={k}>
              {OS_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Kada jums patogu?
        <input
          name="preferred_time"
          required
          defaultValue={v?.preferred_time}
          placeholder="Pvz. darbo dienomis po 17 val. arba šeštadienį"
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Kokias programas naudojate? (nebūtina)
        <input
          name="tools"
          defaultValue={v?.tools ?? ""}
          placeholder="Pvz. Swedbank, SEB, „Rivilė“, Excel"
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Pastabos (nebūtina)
        <textarea name="notes" rows={2} defaultValue={v?.notes ?? ""} className={inputCls} />
      </label>
      {state?.error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success sm:col-span-2">
          Ačiū! Anketa gauta — susisieksime dėl diegimo laiko.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Siunčiama…" : v ? "Atnaujinti anketą" : "Siųsti anketą"}
      </button>
    </form>
  );
}

// „Su įdiegimu" pirkėjui: anketa (jei dar nepildyta) arba diegimo būsena
export default function InstallForm({ orderId, existing }: { orderId: string; existing: ExistingInstall | null }) {
  if (!existing) {
    return (
      <div className="mt-3 rounded-lg border border-brand/40 bg-brand-soft p-3">
        <p className="text-sm font-semibold text-brand-dark">Užpildykite diegimo anketą</p>
        <p className="mt-0.5 text-xs text-muted">
          Prisijungsime nuotoliniu būdu, įdiegsime ir pritaikysime pluginą. Parašykite, kaip ir kada su jumis susisiekti.
        </p>
        <Fields orderId={orderId} v={null} />
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-canvas p-3 text-sm">
      <p>
        <span className="text-muted">Diegimas:</span>{" "}
        <span className="font-semibold">{INSTALL_STATUS_LABEL[existing.status]}</span>
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {existing.status === "idiegta"
          ? "Pluginas įdiegtas. Jei kas neveikia — atsakykite į mūsų laišką."
          : `Susisieksime telefonu ${existing.phone}. Patogus laikas: ${existing.preferred_time}.`}
      </p>
      {existing.status !== "idiegta" && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-brand hover:text-brand-dark">
            Pakeisti anketą
          </summary>
          <Fields orderId={orderId} v={existing} />
        </details>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "./actions";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(-60);
}

const inputCls =
  "rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand";

export default function SettingsForm({
  displayName,
  bio,
  avatarUrl,
}: {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);

  const initial = displayName.charAt(0).toUpperCase() || "?";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get("displayName") ?? "");
      const bioVal = String(fd.get("bio") ?? "");
      const avatarFile = fd.get("avatar") as File | null;

      let newAvatarUrl: string | null = null;
      if (avatarFile && avatarFile.size > 0) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sesija baigėsi. Prisijunkite iš naujo.");
        const path = `${user.id}/avatar-${crypto.randomUUID()}-${safeName(avatarFile.name)}`;
        const { error } = await supabase.storage.from("covers").upload(path, avatarFile);
        if (error) throw new Error("Nepavyko įkelti nuotraukos.");
        newAvatarUrl = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      }

      const res = await updateProfile({
        displayName: name,
        bio: bioVal,
        avatarUrl: newAvatarUrl,
      });
      if (res?.error) throw new Error(res.error);
      setMsg({ ok: true });
      router.refresh();
    } catch (err) {
      setMsg({ error: err instanceof Error ? err.message : "Įvyko klaida." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      {/* Avataras */}
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-2xl font-bold text-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Profilio nuotrauka
          <input
            name="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-dark"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Vardas (arba prekės ženklas)
        <input
          name="displayName"
          type="text"
          required
          defaultValue={displayName}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Apie tave
        <textarea
          name="bio"
          rows={4}
          defaultValue={bio}
          placeholder="Trumpai apie save ir savo kūrybą — matysis tavo profilyje."
          className={inputCls}
        />
      </label>

      {msg?.ok && (
        <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
          Išsaugota! ✓
        </p>
      )}
      {msg?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {msg.error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Saugoma…" : "Išsaugoti"}
      </button>
    </form>
  );
}

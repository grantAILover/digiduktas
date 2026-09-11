"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SettingsState = { ok?: boolean; error?: string };

export async function updateProfile(input: {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prisijunkite iš naujo." };

  const displayName = input.displayName.trim();
  if (!displayName) return { error: "Įrašykite vardą." };

  const patch: Record<string, unknown> = {
    display_name: displayName,
    bio: input.bio.trim() || null,
  };
  if (input.avatarUrl) patch.avatar_url = input.avatarUrl;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };

  revalidatePath("/nustatymai");
  revalidatePath("/", "layout"); // atnaujina header avatarą/vardą
  return { ok: true };
}

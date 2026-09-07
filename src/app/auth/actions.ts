"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AuthState = { error?: string; notice?: string } | null;

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Neteisingas el. paštas arba slaptažodis.";
  if (m.includes("user already registered")) return "Su šiuo el. paštu jau užsiregistruota.";
  if (m.includes("password should be at least")) return "Slaptažodis per trumpas (min. 6 simboliai).";
  if (m.includes("unable to validate email")) return "Neteisingas el. pašto formatas.";
  if (m.includes("email not confirmed")) return "El. paštas dar nepatvirtintas. Patikrink pašto dėžutę.";
  return message;
}

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = String(formData.get("mode"));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Įvesk el. paštą ir slaptažodį." };

  const supabase = await createClient();

  if (mode === "register") {
    const displayName = String(formData.get("display_name") ?? "").trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });
    if (error) return { error: translate(error.message) };
    // Jei įjungtas el. pašto patvirtinimas — sesijos dar nėra.
    if (!data.session) {
      return { notice: "Beveik! Patvirtink registraciją per nuorodą, atsiųstą į el. paštą." };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translate(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

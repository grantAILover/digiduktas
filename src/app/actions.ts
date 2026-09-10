"use server";

import { createClient } from "@/lib/supabase/server";

export type WaitlistState = { ok?: boolean; error?: string } | null;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    return { error: "Įveskite teisingą el. pašto adresą." };
  }

  const role = String(formData.get("role") ?? "").trim();
  const allowedRoles = ["seller", "buyer", "both"];
  if (!allowedRoles.includes(role)) {
    return { error: "Pasirinkite, ar norite pirkti, ar parduoti." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({ email, role });

  if (error) {
    // 23505 = unikalumo pažeidimas → jau užsiregistravęs, laikom sėkme
    if (error.code === "23505") return { ok: true };
    return { error: "Nepavyko užregistruoti. Pabandykite dar kartą." };
  }

  return { ok: true };
}

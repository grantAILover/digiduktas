"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SELLER_TYPES } from "@/lib/sources";
import { claimFoundingSlot } from "@/lib/founding-server";

export type WaitlistState = { error?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_RE = /^[a-z0-9]{4,16}$/;

function clean(v: FormDataEntryValue | null, max: number): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function newCode() {
  return randomBytes(4).toString("hex"); // 8 simboliai, pvz. „a3f09c1e"
}

function thanks(code: string, role: string): never {
  redirect(`/aciu?kodas=${code}&r=${role === "seller" ? "seller" : "buyer"}`);
}

// Registracija į laukiančiųjų sąrašą. Viskas tikrinama serveryje; įrašoma service-role
// klientu (lentelė pasiekiama tik per šį veiksmą). Sėkmės atveju → /aciu.
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { error: "Įvesk teisingą el. pašto adresą." };
  }

  const role = String(formData.get("role") ?? "");
  if (role !== "seller" && role !== "buyer") {
    return { error: "Pasirink, ar nori parduoti, ar pirkti." };
  }

  const sellerType = clean(formData.get("seller_type"), 30);
  if (role === "seller" && !SELLER_TYPES.some((t) => t.value === sellerType)) {
    return { error: "Pasirink, kas tu esi (mokytojas, korepetitorius, abiturientas ar kita)." };
  }

  const ref = clean(formData.get("referred_by"), 16)?.toLowerCase() ?? null;
  const row = {
    email,
    role,
    seller_type: role === "seller" ? sellerType : null,
    wants_to_sell: role === "seller" ? clean(formData.get("wants_to_sell"), 500) : null,
    referred_by: ref && CODE_RE.test(ref) ? ref : null,
    utm_source: clean(formData.get("utm_source"), 100),
    utm_medium: clean(formData.get("utm_medium"), 100),
    utm_campaign: clean(formData.get("utm_campaign"), 100),
    referrer: clean(formData.get("referrer"), 100),
  };

  const db = createAdminClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { error } = await db.from("waitlist").insert({ ...row, ref_code: code });
    if (!error) {
      if (role === "seller") await claimFoundingSlot(email, null, db);
      thanks(code, role);
    }
    if (error.code !== "23505") break;

    // Unikalumo klaida: arba el. paštas jau sąraše, arba (labai retai) kodas sutapo
    const { data: existing } = await db
      .from("waitlist")
      .select("id, role, ref_code")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      const becameSeller = role === "seller" && existing.role !== "seller";
      const patch: Record<string, unknown> = {};
      if (becameSeller) {
        patch.role = "seller";
        patch.seller_type = row.seller_type;
        patch.wants_to_sell = row.wants_to_sell;
      }
      const existingCode = existing.ref_code ?? code;
      if (!existing.ref_code) patch.ref_code = existingCode;
      if (Object.keys(patch).length) await db.from("waitlist").update(patch).eq("id", existing.id);
      if (becameSeller) await claimFoundingSlot(email, null, db);
      thanks(existingCode, becameSeller ? "seller" : existing.role);
    }
    // kitaip — kodo sutapimas, bandom su nauju
  }

  return { error: "Nepavyko užregistruoti. Pabandyk dar kartą." };
}

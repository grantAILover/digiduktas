import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase el. pašto patvirtinimo nuoroda nukreipia čia. Palaikomi abu formatai:
//  • ?code=...                  — standartinis Supabase laiškas (PKCE)
//  • ?token_hash=...&type=...   — savas laiško šablonas
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));

  // Nuoroda pasibaigusi ar jau panaudota (Supabase grąžina klaidą parametruose)
  if (searchParams.get("error") || searchParams.get("error_code")) return to("/auth?klaida=nuoroda");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return to(next);
    // Supabase el. paštą patvirtina PRIEŠ nukreipdamas čia, bet sesijos sukurti nepavyksta,
    // jei nuoroda atidaryta kitoje naršyklėje/įrenginyje — tada tiesiog prašom prisijungti.
    return to("/auth?patvirtinta=1");
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return to(next);
  }

  return to("/auth?klaida=nuoroda");
}

// Tik vidiniai keliai (apsauga nuo nukreipimo į svetimą svetainę)
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

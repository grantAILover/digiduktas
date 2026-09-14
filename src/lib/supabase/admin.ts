import { createClient } from "@supabase/supabase-js";

// Service-role klientas serveriui (webhook, atsisiuntimai). Apeina RLS —
// naudoti TIK serveryje, niekada naršyklėje.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

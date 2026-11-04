import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Prisijungęs adminas (pluginų savininkas) arba null.
 * Produktus kuria ir valdo tik adminas — kitų pardavėjų nebėra.
 */
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { supabase, user };
}

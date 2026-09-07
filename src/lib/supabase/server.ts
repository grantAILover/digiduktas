import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase klientas serverio pusei (Server Components, Route Handlers, Server Actions).
 * cookies() Next.js 16 yra async — todėl funkcija async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Iškviesta iš Server Component — cookies rašyti negalima.
            // Saugu ignoruoti, jei middleware atnaujina sesiją.
          }
        },
      },
    },
  );
}

// Svetainės adresas iš realios užklausos (produkcijoje — https://digiduktas.lt,
// lokaliai — http://localhost:3001). TIK serveriui (server actions, route handlers).
import { headers } from "next/headers";

const FALLBACK = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";

export async function requestOrigin(): Promise<string> {
  try {
    const h = await headers();
    // Server action'ams Next.js pats patikrina, ar Origin sutampa su Host (CSRF apsauga)
    const origin = h.get("origin");
    if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  } catch {
    // ne užklausos kontekste
  }
  return FALLBACK;
}

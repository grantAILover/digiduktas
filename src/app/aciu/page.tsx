import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ShareLinks from "./ShareLinks";
import { FOUNDING_LIMIT, FOUNDING_UNTIL_LABEL } from "@/lib/founding";

export const metadata = { title: "Ačiū!", robots: { index: false } };
export const dynamic = "force-dynamic";

const CODE_RE = /^[a-z0-9]{4,16}$/;

export default async function AciuPage({ searchParams }: PageProps<"/aciu">) {
  const sp = await searchParams;
  const code = typeof sp.kodas === "string" && CODE_RE.test(sp.kodas) ? sp.kodas : null;
  const isSeller = sp.r === "seller";

  // Kiek žmonių užsiregistravo per šio žmogaus nuorodą (motyvacija dalintis)
  // ir ar pardavėjui rezervuota viena iš pirmųjų 20 vietų (0 % komisijos)
  let invited = 0;
  let slotNumber: number | null = null;
  if (code) {
    const db = createAdminClient();
    const [{ count }, { data: me }] = await Promise.all([
      db.from("waitlist").select("id", { count: "exact", head: true }).eq("referred_by", code),
      db.from("waitlist").select("email").eq("ref_code", code).maybeSingle(),
    ]);
    invited = count ?? 0;
    if (isSeller && me?.email) {
      const { data: slot } = await db
        .from("founding_slots")
        .select("id")
        .eq("email", me.email.toLowerCase())
        .maybeSingle();
      if (slot) {
        const { count: before } = await db
          .from("founding_slots")
          .select("id", { count: "exact", head: true })
          .lte("id", slot.id);
        slotNumber = before ?? null;
      }
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";
  const shareUrl = code ? `${site}/?ref=${code}` : site;
  const shareText = isSeller
    ? `Radau vietą, kur mokytojai, korepetitoriai ir abiturientai gali parduoti savo konspektus ir mokymosi medžiagą. Pirmiems ${FOUNDING_LIMIT} pardavėjų — be komisijos:`
    : "Netrukus atsidaro vieta, kur rasi konspektų ir medžiagos egzaminams nuo tų, kurie jau išlaikė:";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-100 text-xl font-bold text-green-700">
          ✓
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Ačiū! Tu sąraše.</h1>
        <p className="mt-3 text-muted">
          {isSeller
            ? "Netrukus susisieksime asmeniškai ir padėsime įkelti pirmą medžiagą."
            : "Pranešime, kai atsiras pirmieji konspektai ir sprendimai."}
        </p>
        {isSeller && slotNumber !== null && (
          <p className="mx-auto mt-4 w-fit rounded-lg border border-brand/30 bg-brand-soft px-4 py-2.5 text-sm text-brand-dark">
            Tau rezervuota vieta <strong>Nr. {slotNumber}</strong> iš {FOUNDING_LIMIT}: 0 % komisijos iki{" "}
            {FOUNDING_UNTIL_LABEL}.
          </p>
        )}
      </div>

      <section className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold">Pakviesk draugą</h2>
        <p className="mt-1 text-sm text-muted">
          {isSeller
            ? "Žinai mokytoją, korepetitorių ar abiturientą su gerais konspektais? Pasidalink savo nuoroda."
            : "Pasidalink su klasiokais — kuo daugiau žmonių, tuo daugiau medžiagos atsiras."}
        </p>
        {invited > 0 && (
          <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            Per tavo nuorodą jau užsiregistravo: <strong>{invited}</strong>
          </p>
        )}
        <div className="mt-5">
          <ShareLinks url={shareUrl} text={shareText} />
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted hover:text-brand">
          ← Grįžti į pradžią
        </Link>
      </div>
    </div>
  );
}

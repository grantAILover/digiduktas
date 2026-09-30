import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ShareLinks from "./ShareLinks";

export const metadata = { title: "Ačiū!", robots: { index: false } };
export const dynamic = "force-dynamic";

const CODE_RE = /^[a-z0-9]{4,16}$/;

export default async function AciuPage({ searchParams }: PageProps<"/aciu">) {
  const sp = await searchParams;
  const code = typeof sp.kodas === "string" && CODE_RE.test(sp.kodas) ? sp.kodas : null;
  const isSeller = sp.r === "seller";

  // Kiek žmonių užsiregistravo per šio žmogaus nuorodą (motyvacija dalintis)
  let invited = 0;
  if (code) {
    const { count } = await createAdminClient()
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", code);
    invited = count ?? 0;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";
  const shareUrl = code ? `${site}/?ref=${code}` : site;
  const shareText = isSeller
    ? "Radau vietą, kur mokytojai, korepetitoriai ir abiturientai gali parduoti savo konspektus ir mokymosi medžiagą. Pirmą savaitę — be komisijos:"
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
            ? "Netrukus susisieksime asmeniškai ir padėsime įkelti pirmą medžiagą. Pirmą savaitę — 0 % komisijos."
            : "Pranešime, kai atsiras pirmieji konspektai ir sprendimai."}
        </p>
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

import { Resend } from "resend";
import { TIER_LABEL, type Tier } from "@/lib/tiers";

const FROM = process.env.EMAIL_FROM || "digiduktas <onboarding@resend.dev>";
// Kur nukeliauja pirkėjo atsakymai (siuntimo domenas dar neturi dėžutės).
const REPLY_TO = process.env.EMAIL_REPLY_TO;

// Pirkėjo patvirtinimo laiškas. Jei RESEND_API_KEY nenustatytas — tyliai praleidžia
// (kad nesulaužytų webhook'o). Klaidos irgi nekritinės.
export async function sendOrderConfirmation(opts: {
  to: string | null | undefined;
  productTitle: string;
  priceCents: number;
  tier?: Tier;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";
  const price = (opts.priceCents / 100).toFixed(2).replace(".", ",") + " €";
  const tier = opts.tier ?? "self";
  const installNote =
    tier === "install"
      ? `<p style="background:#fbf1ea;border-radius:8px;padding:12px;margin:0 0 16px;color:#7a3d16">
          Pasirinkote diegimą — netrukus susisieksime dėl patogaus laiko nuotoliniam prisijungimui.
        </p>`
      : "";

  const html = `
  <div style="font-family:system-ui,-apple-system,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
    <div style="font-size:20px;font-weight:800;color:#1c1917;padding:8px 0">
      digi<span style="color:#b5612c">duktas</span>
    </div>
    <div style="border:1px solid #e7e5e4;border-radius:12px;padding:24px;background:#ffffff">
      <p style="font-size:16px;margin:0 0 8px">Ačiū už pirkinį!</p>
      <p style="color:#78716c;margin:0 0 16px">Jūsų apmokėjimas gautas. Pirkinį rasite savo paskyroje.</p>
      ${installNote}
      <table style="width:100%;border-collapse:collapse;margin:8px 0 20px">
        <tr>
          <td style="padding:8px 0;color:#78716c">Pluginas</td>
          <td style="padding:8px 0;text-align:right;font-weight:600">${opts.productTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#78716c">Lygis</td>
          <td style="padding:8px 0;text-align:right">${TIER_LABEL[tier]}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#78716c">Suma</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:#b5612c">${price}</td>
        </tr>
      </table>
      <a href="${site}/pirkiniai" style="display:inline-block;background:#b5612c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">
        Atidaryti pirkinį
      </a>
      <p style="color:#a8a29e;font-size:12px;line-height:1.5;margin:20px 0 0">
        Prieš apmokėdami sutikote, kad skaitmeninis turinys būtų pateiktas iš karto, todėl
        14 dienų atsisakymo teisė netaikoma. Jei failas sugadintas ar neatitinka aprašymo —
        <a href="${site}/grazinimai" style="color:#a8a29e">grąžinimų tvarka</a>.
      </p>
    </div>
    <p style="color:#a8a29e;font-size:12px;margin:16px 0 0">© digiduktas · Sukurta Lietuvoje</p>
  </div>`;

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to: opts.to,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      subject: `Ačiū už pirkinį — ${opts.productTitle}`,
      html,
    });
  } catch {
    // nekritinis — nesulaužyti apmokėjimo apdorojimo
  }
}

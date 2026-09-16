import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "digiduktas <onboarding@resend.dev>";

// Pirkėjo patvirtinimo laiškas. Jei RESEND_API_KEY nenustatytas — tyliai praleidžia
// (kad nesulaužytų webhook'o). Klaidos irgi nekritinės.
export async function sendOrderConfirmation(opts: {
  to: string | null | undefined;
  productTitle: string;
  priceCents: number;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";
  const price = (opts.priceCents / 100).toFixed(2).replace(".", ",") + " €";

  const html = `
  <div style="font-family:system-ui,-apple-system,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
    <div style="font-size:20px;font-weight:800;color:#1c1917;padding:8px 0">
      digi<span style="color:#f97316">duktas</span>
    </div>
    <div style="border:1px solid #e7e5e4;border-radius:12px;padding:24px;background:#ffffff">
      <p style="font-size:16px;margin:0 0 8px">Ačiū už pirkinį!</p>
      <p style="color:#78716c;margin:0 0 16px">Jūsų apmokėjimas gautas. Pirkinį rasite savo paskyroje.</p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 20px">
        <tr>
          <td style="padding:8px 0;color:#78716c">Produktas</td>
          <td style="padding:8px 0;text-align:right;font-weight:600">${opts.productTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#78716c">Suma</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:#f97316">${price}</td>
        </tr>
      </table>
      <a href="${site}/pirkiniai" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">
        Peržiūrėti ir atsisiųsti
      </a>
    </div>
    <p style="color:#a8a29e;font-size:12px;margin:16px 0 0">© digiduktas · Sukurta Lietuvoje</p>
  </div>`;

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to: opts.to,
      subject: `Ačiū už pirkinį — ${opts.productTitle}`,
      html,
    });
  } catch {
    // nekritinis — nesulaužyti apmokėjimo apdorojimo
  }
}

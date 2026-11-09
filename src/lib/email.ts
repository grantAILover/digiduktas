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
          Pasirinkote diegimą. Skiltyje „Mano pirkiniai" užpildykite trumpą diegimo anketą —
          susisieksime ir suderinsime patogų laiką nuotoliniam prisijungimui.
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

/** Kliento įvestą tekstą laiške rodom kaip tekstą, ne HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Pranešimas savininkui: nauja komplekto užklausa. Atsakyti — tiesiai klientui (replyTo). Nekritinis.
export async function sendBundleRequestNotice(r: {
  name: string;
  email: string;
  phone: string | null;
  plugins: string[];
  message: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL || REPLY_TO;
  if (!key || !to) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";
  const row = (label: string, value: string | null) =>
    `<tr><td style="padding:6px 0;color:#78716c;vertical-align:top;width:140px">${label}</td>
     <td style="padding:6px 0;white-space:pre-line">${value ? escapeHtml(value) : "—"}</td></tr>`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1917">
    <p style="font-size:16px;font-weight:600;margin:0 0 12px">Nauja komplekto užklausa</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row("Vardas", r.name)}
      ${row("El. paštas", r.email)}
      ${row("Telefonas", r.phone)}
      ${row("Pluginai", r.plugins.join(", ") || null)}
      ${row("Ką automatizuoti", r.message)}
    </table>
    <a href="${site}/admin#uzklausos" style="display:inline-block;margin-top:16px;background:#b5612c;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:8px">
      Atidaryti admin
    </a>
  </div>`;

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to,
      replyTo: r.email,
      subject: `Komplekto užklausa — ${r.name}`,
      html,
    });
  } catch {
    // nekritinis — užklausa jau išsaugota
  }
}

// Pranešimas savininkui: nauja (ar atnaujinta) diegimo anketa. Nekritinis.
export async function sendInstallRequestNotice(r: {
  productTitle: string;
  email: string | null;
  phone: string;
  preferredTime: string;
  os: string;
  tools: string | null;
  notes: string | null;
  updated: boolean;
}) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL || REPLY_TO;
  if (!key || !to) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://digiduktas.lt";
  const row = (label: string, value: string | null) =>
    `<tr><td style="padding:6px 0;color:#78716c;vertical-align:top;width:140px">${label}</td>
     <td style="padding:6px 0">${value ? escapeHtml(value) : "—"}</td></tr>`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1917">
    <p style="font-size:16px;font-weight:600;margin:0 0 12px">
      ${r.updated ? "Atnaujinta" : "Nauja"} diegimo anketa — ${escapeHtml(r.productTitle)}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row("El. paštas", r.email)}
      ${row("Telefonas", r.phone)}
      ${row("Patogus laikas", r.preferredTime)}
      ${row("Kompiuteris", r.os)}
      ${row("Programos", r.tools)}
      ${row("Pastabos", r.notes)}
    </table>
    <a href="${site}/admin#diegimai" style="display:inline-block;margin-top:16px;background:#b5612c;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:8px">
      Atidaryti admin
    </a>
  </div>`;

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to,
      ...(r.email ? { replyTo: r.email } : {}),
      subject: `${r.updated ? "Atnaujinta" : "Nauja"} diegimo anketa — ${r.productTitle}`,
      html,
    });
  } catch {
    // nekritinis — anketa jau išsaugota
  }
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sourceOf, sellerTypeLabel } from "@/lib/sources";

export const runtime = "nodejs";

// CSV su kabliataškiais + BOM — lietuviškas Excel atidaro teisingai (ą, č, ę...)
function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not found", { status: 404 });
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return new Response("Not found", { status: 404 });

  const { data: rows } = await createAdminClient()
    .from("waitlist")
    .select("*")
    .order("created_at", { ascending: false });
  const list = rows ?? [];

  // Kiek kiekvienas pakvietė
  const invited = new Map<string, number>();
  for (const r of list) if (r.referred_by) invited.set(r.referred_by, (invited.get(r.referred_by) ?? 0) + 1);

  const header = [
    "data", "el_pastas", "role", "kas", "ka_parduotu", "saltinis",
    "utm_medium", "utm_campaign", "atejo_is", "pakviete_kodas", "ref_kodas", "pakvieste_zmoniu",
  ];
  const lines = list.map((r) =>
    [
      new Date(r.created_at).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius" }),
      r.email,
      r.role === "seller" ? "pardavėjas" : r.role === "buyer" ? "pirkėjas" : r.role ?? "",
      sellerTypeLabel(r.seller_type),
      r.wants_to_sell,
      sourceOf(r),
      r.utm_medium,
      r.utm_campaign,
      r.referrer,
      r.referred_by,
      r.ref_code,
      r.ref_code ? invited.get(r.ref_code) ?? 0 : 0,
    ]
      .map(csvCell)
      .join(";"),
  );

  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laukiantieji-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

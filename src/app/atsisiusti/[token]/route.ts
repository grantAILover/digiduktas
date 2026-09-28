import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Senos atsisiuntimo nuorodos (downloads.token). Failo tiesiogiai nebeatiduoda —
// nukreipia į pirkinio puslapį, kuris pats tikrina prieigą ir allow_download.
export async function GET(req: NextRequest, ctx: RouteContext<"/atsisiusti/[token]">) {
  const { token } = await ctx.params;

  const { data: dl } = await createAdminClient()
    .from("downloads")
    .select("orders(product_id)")
    .eq("token", token)
    .maybeSingle();

  const order = dl && (Array.isArray(dl.orders) ? dl.orders[0] : dl.orders);
  if (!order?.product_id) {
    return NextResponse.redirect(new URL("/pirkiniai?klaida=nerasta", req.url));
  }
  return NextResponse.redirect(new URL(`/pirkiniai/${order.product_id}`, req.url));
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth", req.url));

  const admin = createAdminClient();
  const { data: dl } = await admin
    .from("downloads")
    .select("id, expires_at, download_count, orders(buyer_id, status, product_id)")
    .eq("token", token)
    .maybeSingle();
  if (!dl) return NextResponse.redirect(new URL("/pirkiniai?klaida=nerasta", req.url));

  const order = Array.isArray(dl.orders) ? dl.orders[0] : dl.orders;
  if (!order || order.buyer_id !== user.id || order.status !== "paid") {
    return NextResponse.redirect(new URL("/pirkiniai?klaida=prieiga", req.url));
  }
  if (new Date(dl.expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/pirkiniai?klaida=galiojimas", req.url));
  }

  const { data: product } = await admin
    .from("products")
    .select("file_path")
    .eq("id", order.product_id)
    .single();
  if (!product?.file_path) {
    return NextResponse.redirect(new URL("/pirkiniai?klaida=failas", req.url));
  }

  const { data: signed } = await admin.storage
    .from("product-files")
    .createSignedUrl(product.file_path, 120, { download: true });
  if (!signed?.signedUrl) {
    return NextResponse.redirect(new URL("/pirkiniai?klaida=failas", req.url));
  }

  await admin
    .from("downloads")
    .update({ download_count: dl.download_count + 1 })
    .eq("id", dl.id);

  return NextResponse.redirect(signed.signedUrl);
}

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import EditProductForm from "./EditProductForm";

export const metadata = { title: "Redaguoti pluginą" };

export default async function RedaguotiPage({
  params,
}: PageProps<"/parduoti/[id]/redaguoti">) {
  const { id } = await params;
  const admin = await requireAdmin();
  if (!admin) redirect("/");
  const { supabase, user } = admin;

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, title, description, price_cents, install_price_cents, cover_image_url, preview_images, allow_download, seller_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();
  if (product.seller_id !== user.id) redirect("/parduoti");

  // RLS: product_files mato tik savininkas
  const { data: files } = await supabase
    .from("product_files")
    .select("id, file_name, kind, size_bytes")
    .eq("product_id", id)
    .order("position", { ascending: true });

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link href="/parduoti" className="text-sm text-muted hover:text-ink">
        ← Atgal
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Redaguoti pluginą</h1>
      <EditProductForm product={product} files={files ?? []} />
    </div>
  );
}

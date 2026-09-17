import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProductForm from "./EditProductForm";

export const metadata = { title: "Redaguoti produktą" };

export default async function RedaguotiPage({
  params,
}: PageProps<"/parduoti/[id]/redaguoti">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: product } = await supabase
    .from("products")
    .select("id, title, description, price_cents, category, cover_image_url, preview_images, seller_id")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();
  if (product.seller_id !== user.id) redirect("/parduoti");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link href="/parduoti" className="text-sm text-muted hover:text-ink">
        ← Atgal
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Redaguoti produktą</h1>
      <EditProductForm product={product} />
    </div>
  );
}

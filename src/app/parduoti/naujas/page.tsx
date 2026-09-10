import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "./ProductForm";

export default async function NaujasProduktasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_seller")
    .eq("id", user.id)
    .single();
  if (!profile?.is_seller) redirect("/parduoti");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Naujas produktas</h1>
      <p className="mt-2 text-sm text-muted">
        Įkelkite failą, aprašymą ir kainą. Peržiūrėsime ir paskelbsime.
      </p>
      <ProductForm />
    </div>
  );
}

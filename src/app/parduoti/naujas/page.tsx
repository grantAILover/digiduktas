import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import ProductForm from "./ProductForm";

export const metadata = { title: "Naujas pluginas" };

export default async function NaujasPluginasPage() {
  if (!(await requireAdmin())) redirect("/");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link href="/parduoti" className="text-sm text-muted hover:text-ink">
        ← Atgal
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Naujas pluginas</h1>
      <p className="mt-2 text-sm text-muted">
        Įkelkite plugino failus, aprašymą ir kainą. Pluginas paskelbiamas iškart.
      </p>
      <ProductForm />
    </div>
  );
}

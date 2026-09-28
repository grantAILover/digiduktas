import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProductAccess } from "@/lib/access";
import { loadProgress } from "@/lib/progress";
import { isViewable } from "@/lib/files";
import Viewer, { type ViewerFile } from "@/components/viewer/Viewer";

export const metadata = { title: "Pirkinys", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PirkinysPage({ params }: PageProps<"/pirkiniai/[productId]">) {
  const { productId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const access = await getProductAccess(user.id, productId);
  if (!access.ok) {
    if (access.status === 404) notFound();
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Nėra prieigos</h1>
        <p className="mt-3 text-muted">Šį produktą galite atidaryti tik jį nusipirkę.</p>
        <Link
          href="/pirkiniai"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-surface transition-colors hover:bg-brand-dark"
        >
          Mano pirkiniai
        </Link>
      </div>
    );
  }

  const { product, files, canDownload, role } = access;
  const rows = await loadProgress(supabase, user.id, productId);
  const progress = Object.fromEntries(rows.map((r) => [r.product_file_id, r.position_seconds]));

  // Į naršyklę — tik saugūs laukai (storage_path lieka serveryje)
  const viewerFiles: ViewerFile[] = files.map((f) => ({
    id: f.id,
    file_name: f.file_name,
    kind: f.kind,
    size_bytes: f.size_bytes,
  }));

  // Atidarom paskutinį klausytą failą, kitaip — pirmą peržiūrimą
  const lastListened = rows.find((r) => files.some((f) => f.id === r.product_file_id));
  const initialFileId =
    lastListened?.product_file_id ?? files.find((f) => isViewable(f.kind))?.id ?? files[0]?.id ?? null;

  const back = {
    buyer: { href: "/pirkiniai", label: "Mano pirkiniai" },
    owner: { href: "/parduoti", label: "Mano produktai" },
    admin: { href: "/admin", label: "Admin" },
  }[role];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href={back.href} className="text-sm text-muted hover:text-ink">
        ← {back.label}
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">{product.title}</h1>

      {role !== "buyer" && (
        <p className="mt-3 rounded-lg border border-line bg-brand-soft px-4 py-2.5 text-sm text-brand-dark">
          Peržiūrite kaip {role === "owner" ? "pardavėjas" : "adminas"}.
          {!product.allow_download && " Pirkėjai šio produkto atsisiųsti negalės — tik peržiūrėti."}
        </p>
      )}

      <div className="mt-6">
        <Viewer
          files={viewerFiles}
          canDownload={canDownload}
          initialFileId={initialFileId}
          progress={progress}
        />
      </div>
    </div>
  );
}

// Prieigos prie nupirktų failų kontrolė. TIK serveriui (naudoja service-role klientą).
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FileKind } from "@/lib/files";

export type Role = "owner" | "admin" | "buyer";

export type ProductFile = {
  id: string;
  product_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: FileKind;
  position: number;
  duration_seconds: number | null;
  stream_provider: "bunny" | "cloudflare" | null;
  stream_ref: string | null;
};

export type AccessProduct = {
  id: string;
  title: string;
  seller_id: string;
  allow_download: boolean;
};

export type Denied = { ok: false; status: 401 | 403 | 404 };

export type FileAccess =
  | { ok: true; role: Role; product: AccessProduct; file: ProductFile; canDownload: boolean }
  | Denied;

export type ProductAccess =
  | { ok: true; role: Role; product: AccessProduct; files: ProductFile[]; canDownload: boolean }
  | Denied;

export const FILE_COLS =
  "id, product_id, storage_path, file_name, mime_type, size_bytes, kind, position, duration_seconds, stream_provider, stream_ref";
const PRODUCT_COLS = "id, title, seller_id, allow_download";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Grynos sprendimo funkcijos (be DB) ───────────────────────

/**
 * Kas turi prieigą: savininkas, adminas arba pirkėjas su APMOKĖTU užsakymu.
 * Grąžintas (refunded) ar neapmokėtas užsakymas prieigos nesuteikia.
 */
export function decideRole(i: {
  userId: string;
  sellerId: string;
  isAdmin: boolean;
  hasPaidOrder: boolean;
}): Role | null {
  if (i.userId === i.sellerId) return "owner";
  if (i.isAdmin) return "admin";
  if (i.hasPaidOrder) return "buyer";
  return null;
}

/** Pirkėjui atsisiųsti leidžia tik pardavėjo nustatymas. Savininkas ir adminas — visada. */
export function mayDownload(role: Role, allowDownload: boolean) {
  return role !== "buyer" || allowDownload;
}

// ── DB užklausos ─────────────────────────────────────────────

async function resolveRole(
  db: SupabaseClient,
  userId: string,
  product: AccessProduct,
): Promise<Role | null> {
  if (userId === product.seller_id) return "owner";
  const [{ data: profile }, { count }] = await Promise.all([
    db.from("profiles").select("is_admin").eq("id", userId).maybeSingle(),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .eq("product_id", product.id)
      .eq("status", "paid"),
  ]);
  return decideRole({
    userId,
    sellerId: product.seller_id,
    isAdmin: !!profile?.is_admin,
    hasPaidOrder: (count ?? 0) > 0,
  });
}

/** Ar vartotojas gali pasiekti konkretų failą. */
export async function getFileAccess(
  userId: string | null,
  fileId: string,
  db: SupabaseClient = createAdminClient(),
): Promise<FileAccess> {
  if (!userId) return { ok: false, status: 401 };
  if (!UUID_RE.test(fileId)) return { ok: false, status: 404 };

  const { data } = await db
    .from("product_files")
    .select(`${FILE_COLS}, products(${PRODUCT_COLS})`)
    .eq("id", fileId)
    .maybeSingle();
  if (!data) return { ok: false, status: 404 };

  const { products, ...file } = data as ProductFile & {
    products: AccessProduct | AccessProduct[] | null;
  };
  const product = Array.isArray(products) ? products[0] : products;
  if (!product) return { ok: false, status: 404 };

  const role = await resolveRole(db, userId, product);
  if (!role) return { ok: false, status: 403 };

  return {
    ok: true,
    role,
    product,
    file: file as ProductFile,
    canDownload: mayDownload(role, product.allow_download),
  };
}

/** Ar vartotojas gali pasiekti produktą (viewer puslapiui) + jo failų sąrašas. */
export async function getProductAccess(
  userId: string | null,
  productId: string,
  db: SupabaseClient = createAdminClient(),
): Promise<ProductAccess> {
  if (!userId) return { ok: false, status: 401 };
  if (!UUID_RE.test(productId)) return { ok: false, status: 404 };

  const { data: product } = await db
    .from("products")
    .select(PRODUCT_COLS)
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, status: 404 };

  const role = await resolveRole(db, userId, product as AccessProduct);
  if (!role) return { ok: false, status: 403 };

  const { data: files } = await db
    .from("product_files")
    .select(FILE_COLS)
    .eq("product_id", productId)
    .order("position", { ascending: true });

  return {
    ok: true,
    role,
    product: product as AccessProduct,
    files: (files ?? []) as ProductFile[],
    canDownload: mayDownload(role, (product as AccessProduct).allow_download),
  };
}

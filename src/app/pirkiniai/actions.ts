"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseInstallForm, OS_LABEL } from "@/lib/install";
import { sendInstallRequestNotice } from "@/lib/email";

export type InstallFormState = { ok?: boolean; error?: string } | null;

// Diegimo anketa. Lentelė pasiekiama tik service-role klientu — todėl čia patys tikrinam,
// kad užsakymas priklauso šiam pirkėjui, apmokėtas ir pirktas „Su įdiegimu".
export async function submitInstallRequest(
  _prev: InstallFormState,
  formData: FormData,
): Promise<InstallFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Prisijunkite iš naujo." };

  const orderId = String(formData.get("orderId") ?? "");
  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, buyer_id, status, tier, products(title)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.buyer_id !== user.id || order.status !== "paid" || order.tier !== "install") {
    return { error: "Užsakymas nerastas." };
  }

  const parsed = parseInstallForm(formData);
  if (!parsed.data) return { error: parsed.error };

  const { data: existing } = await db
    .from("install_requests")
    .select("id, status")
    .eq("order_id", order.id)
    .maybeSingle();
  // Kai jau įdiegta — anketos nebekeičiam
  if (existing?.status === "idiegta") return { error: "Diegimas jau atliktas." };

  const { error } = await db.from("install_requests").upsert(
    {
      order_id: order.id,
      user_id: user.id,
      email: user.email ?? null,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "order_id" },
  );
  if (error) return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };

  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  await sendInstallRequestNotice({
    productTitle: (product as { title?: string } | null)?.title ?? "Pluginas",
    email: user.email ?? null,
    phone: parsed.data.phone,
    preferredTime: parsed.data.preferred_time,
    os: OS_LABEL[parsed.data.os],
    tools: parsed.data.tools,
    notes: parsed.data.notes,
    updated: !!existing,
  });

  revalidatePath("/pirkiniai");
  return { ok: true };
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "Nustatymai" };

export default async function NustatymaiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Nustatymai</h1>
      <p className="mt-1 text-sm text-muted">
        Tavo profilis matomas pirkėjams produktų ir kūrėjo puslapiuose.
      </p>
      <SettingsForm
        displayName={profile?.display_name ?? ""}
        bio={profile?.bio ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}

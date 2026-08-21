import { redirect } from "next/navigation";
import { AdminReports } from "@/components/AdminReports";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { HobbyAdminButton } from "@/components/HobbyAdminButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase, profile, configured } = await getSessionUser();
  if (!configured) return <SetupEnvPage />;
  if (!supabase || !profile || !isAdmin(profile)) redirect("/");
  const { data } = await supabase.from("reports").select("*").eq("status", "pending").order("created_at", { ascending: false });
  return (
    <main className="mx-auto max-w-4xl">
      <div className="flex justify-end mb-6">
        <HobbyAdminButton />
      </div>
      <AdminReports reports={data ?? []} />
    </main>
  );
}

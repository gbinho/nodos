import SetupEnvPage from "@/components/SetupEnvPage";
import { AccountSettings } from "@/components/AccountSettings";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user, profile, configured } = await getSessionUser();

  if (!configured) return <SetupEnvPage />;
  if (!user || !profile) return null;

  return <AccountSettings profile={profile} authEmail={user.email ?? null} />;
}
import SetupEnvPage from "@/components/SetupEnvPage";
import { SearchExplorer } from "@/components/SearchExplorer";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const { supabase, user, configured } = await getSessionUser();
  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;

  const [{ data: follows }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
  ]);
  return <SearchExplorer initialUsers={[]} initialFollowing={(follows ?? []).map((follow) => follow.following_id)} currentUserId={user.id} />;
}
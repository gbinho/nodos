import { AddCheckInButton } from "@/components/AddCheckInButton";
import { FeedTabs } from "@/components/FeedTabs";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import type { CheckinWithProfile } from "@/lib/checkins";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user, profile, configured } = await getSessionUser();

  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;

  const { data: followRows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const followingIds = (followRows ?? []).map((follow) => follow.following_id);
  const globalQuery = supabase
    .from("checkins")
    .select("*, profiles(username, avatar_url, email)")
    .order("created_at", { ascending: false });
  const followingQuery = followingIds.length
    ? supabase.from("checkins").select("*, profiles(username, avatar_url, email)").in("user_id", followingIds).order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });
  const [{ data: globalData, error: globalError }, { data: followingData, error: followingError }] = await Promise.all([globalQuery, followingQuery]);
  const globalCheckins = (globalData ?? []) as CheckinWithProfile[];
  const followingCheckins = (followingData ?? []) as CheckinWithProfile[];

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Feed</h1>
        <p className="mt-1 text-sm text-gray-400">Check-ins da jornada</p>
      </div>

      <AddCheckInButton userId={user.id} currentXp={profile?.total_xp ?? 0} />

      <FeedTabs
        globalCheckins={globalCheckins}
        followingCheckins={followingCheckins}
        currentUserId={user.id}
        error={followsError?.message ?? globalError?.message ?? followingError?.message ?? null}
      />
    </main>
  );
}

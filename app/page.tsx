import { AddCheckInButton } from "@/components/AddCheckInButton";
import { FeedTabs } from "@/components/FeedTabs";
import SetupEnvPage from "@/components/SetupEnvPage";
import { HobbyRequestButton } from "@/components/hobby-request/HobbyRequestButton";
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
    <main className="mx-auto flex max-w-6xl flex-col gap-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#71737c]">Nodos / comunidade</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#111114]">Home</h1>
          <p className="mt-2 text-sm text-[#71737c]">Acompanhe o progresso que está acontecendo agora.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[#e4e5e9] bg-white px-4 py-2 text-xs text-[#71737c] sm:flex">
          <span className="h-2 w-2 rounded-full bg-[#111114]" />
          Feed atualizado
        </div>
      </div>

      <AddCheckInButton userId={user.id} currentXp={profile?.total_xp ?? 0} />

      <div className="flex justify-center">
        <HobbyRequestButton />
      </div>

      <FeedTabs
        globalCheckins={globalCheckins}
        followingCheckins={followingCheckins}
        currentUserId={user.id}
        globalError={globalError?.message ?? null}
        followingError={followsError?.message ?? followingError?.message ?? null}
      />
    </main>
  );
}

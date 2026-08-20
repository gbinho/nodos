import SetupEnvPage from "@/components/SetupEnvPage";
import { NodesExplorer } from "@/components/NodesExplorer";
import { getSessionUser } from "@/lib/auth";
import { HOBBY_TAGS } from "@/lib/constants";
import type { CheckinWithProfile } from "@/lib/checkins";

export const dynamic = "force-dynamic";

export default async function NodesPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { supabase, user, configured } = await getSessionUser();

  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;
  const { tag } = await searchParams;

  const { data, error } = await supabase
    .from("checkins")
    .select("*, profiles(username, avatar_url, email)")
    .order("created_at", { ascending: false });

  return (
    <NodesExplorer
      currentUserId={user.id}
      initialCheckins={(data ?? []) as CheckinWithProfile[]}
      initialError={error?.message ?? null}
      tags={HOBBY_TAGS}
      initialTag={tag ?? "Todos"}
    />
  );
}
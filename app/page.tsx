import { AddCheckInButton } from "@/components/AddCheckInButton";
import { CheckinCard } from "@/components/CheckinCard";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import type { CheckinWithProfile } from "@/lib/checkins";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user, profile, configured } = await getSessionUser();

  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;

  const { data, error } = await supabase
    .from("checkins")
    .select("*, profiles(username, avatar_url, email)")
    .order("created_at", { ascending: false });

  const checkins = (data ?? []) as CheckinWithProfile[];

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Feed</h1>
        <p className="mt-1 text-sm text-gray-400">Check-ins da jornada</p>
      </div>

      <AddCheckInButton userId={user.id} currentXp={profile?.total_xp ?? 0} />

      {error ? (
        <p className="text-sm text-gray-400">Não foi possível carregar o feed.</p>
      ) : checkins.length === 0 ? (
        <div className="border border-gray-800 px-6 py-16 text-center text-sm text-gray-400">
          Nenhum check-in ainda
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {checkins.map((checkin) => (
            <CheckinCard key={checkin.id} checkin={checkin} />
          ))}
        </div>
      )}
    </main>
  );
}

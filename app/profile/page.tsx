import { User } from "lucide-react";
import { CheckinCard } from "@/components/CheckinCard";
import { SetupEnvPage } from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import { displayName, type CheckinWithProfile } from "@/lib/checkins";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user, profile, configured } = await getSessionUser();

  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;

  const { data, error } = await supabase
    .from("checkins")
    .select("*, profiles(username, avatar_url, email)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const checkins = (data ?? []) as CheckinWithProfile[];
  const name = displayName(profile);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8">
      <header className="flex items-center gap-5">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-20 w-20 rounded-full border border-gray-800 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-800">
            <User className="h-8 w-8 text-gray-400" strokeWidth={1.25} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-gray-400">{profile?.email}</p>
          <p className="mt-3 text-sm text-gray-400">{profile?.total_xp ?? 0} XP • Nível 1</p>
        </div>
      </header>

      <section>
        <p className="mb-4 text-xs tracking-[0.18em] text-gray-400">MEUS CHECK-INS</p>
        {error ? (
          <p className="text-sm text-gray-400">Não foi possível carregar seus check-ins.</p>
        ) : checkins.length === 0 ? (
          <div className="border border-gray-800 px-6 py-16 text-center text-sm text-gray-400">
            Você ainda não registrou nenhum check-in
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {checkins.map((checkin) => (
              <CheckinCard key={checkin.id} checkin={checkin} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

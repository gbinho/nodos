import { Activity, Clock3, Crown, Mail, Music2, User } from "lucide-react";
import { CheckinCard } from "@/components/CheckinCard";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import { displayName, formatMinutes, type CheckinWithProfile } from "@/lib/checkins";

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
  const totalXp = profile?.total_xp ?? 0;
  const level = Math.floor(totalXp / 100) + 1;
  const rank = level <= 3 ? "Aprendiz" : level <= 10 ? "Praticante" : "Veterano";
  const totalMinutes = checkins.reduce(
    (total, checkin) => total + checkin.time_invested_minutes,
    0,
  );
  const totalHours = totalMinutes / 60;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.22em] text-gray-500">PERFIL</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">Seu percurso</h1>
        </div>
        <p className="hidden text-right text-sm text-gray-500 sm:block">Progresso pessoal</p>
      </header>

      <section aria-label="Resumo do perfil" className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <article className="border border-gray-800 bg-gray-950 p-6 md:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-700 bg-gray-900">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-gray-400" strokeWidth={1.25} />
              )}
            </div>
            <span className="text-xs text-gray-500">IDENTIDADE</span>
          </div>
          <h2 className="mt-8 text-2xl font-medium">{name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
            {profile?.email ?? "E-mail não informado"}
          </p>
        </article>

        <article className="border border-gray-800 bg-gray-900 p-6 md:col-span-3">
          <div className="flex items-start justify-between">
            <span className="text-xs text-gray-500">GAMIFICAÇÃO</span>
            <Crown className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
          </div>
          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-medium tracking-tight">{totalXp}</p>
              <p className="mt-1 text-sm text-gray-400">XP acumulado</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Nível {level}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-500">{rank}</p>
            </div>
          </div>
          <div className="mt-6 h-1 bg-gray-800" aria-label={`${totalXp % 100}% para o próximo nível`}>
            <div className="h-full bg-white" style={{ width: `${totalXp % 100 || (totalXp ? 100 : 0)}%` }} />
          </div>
        </article>

        <article className="border border-gray-800 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">TEMPO TOTAL</span>
            <Clock3 className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="mt-8 text-3xl font-medium">{totalHours.toFixed(1)}h</p>
          <p className="mt-1 text-sm text-gray-500">{formatMinutes(totalMinutes)} investidos</p>
        </article>

        <article className="border border-gray-800 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">ATIVIDADE</span>
            <Activity className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="mt-8 text-3xl font-medium">{checkins.length}</p>
          <p className="mt-1 text-sm text-gray-500">check-ins registrados</p>
        </article>

        <article className="flex min-h-40 flex-col border border-gray-800 bg-gray-950 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">MÚSICA TEMA</span>
            <Music2 className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 border-t border-gray-800 pt-4">
            <p className="text-sm text-gray-400">Nenhuma faixa conectada</p>
            <span className="text-xs text-gray-600">SPOTIFY</span>
          </div>
        </article>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-gray-500">HISTÓRICO PESSOAL</p>
            <h2 className="mt-2 text-xl font-medium">Meus check-ins</h2>
          </div>
          <span className="text-sm text-gray-500">{checkins.length} registros</span>
        </div>
        {error ? (
          <div className="border border-gray-800 p-6 text-sm text-gray-400">
            Não foi possível carregar seus check-ins agora.
          </div>
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

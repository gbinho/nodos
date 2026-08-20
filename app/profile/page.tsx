import { Activity, Clock3, Crown, Flame, Mail, Music2, User } from "lucide-react";
import { CheckinCard } from "@/components/CheckinCard";
import { BadgesGrid } from "@/components/BadgesGrid";
import { EditProfileButton } from "@/components/EditProfileButton";
import { HobbyHeatmap } from "@/components/HobbyHeatmap";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import { displayName, formatMinutes, type CheckinWithProfile } from "@/lib/checkins";
import { getSpotifyEmbedUrl } from "@/lib/spotify";

export const dynamic = "force-dynamic";

function getSafeBackgroundUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString().replace(/"/g, "%22");
  } catch {
    return null;
  }
}

const hobbyColors: Record<string, { color: string; background: string }> = {
  "Programação": { color: "#60a5fa", background: "#172554" },
  Homelab: { color: "#c084fc", background: "#3b0764" },
  "Impressão 3D": { color: "#fb923c", background: "#431407" },
  Ciclismo: { color: "#4ade80", background: "#052e16" },
  Leitura: { color: "#facc15", background: "#422006" },
};

const defaultHobbyColor = { color: "#d4d4d8", background: "#27272a" };

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentStreak(checkins: CheckinWithProfile[]) {
  const activeDays = new Set(checkins.map((checkin) => dateKey(new Date(checkin.created_at))));
  const today = new Date();
  let streak = 0;
  const startOffset = activeDays.has(dateKey(today)) ? 0 : -1;

  for (let offset = startOffset; activeDays.has(dateKey(addDays(today, offset))); offset -= 1) {
    streak += 1;
  }

  return streak;
}

export default async function ProfilePage() {
  const { supabase, user, profile, configured } = await getSessionUser();

  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;

  await checkAndAwardBadges(user.id);

  const { data, error } = await supabase
    .from("checkins")
    .select("*, profiles(username, avatar_url, email)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const checkins = (data ?? []) as CheckinWithProfile[];
  const featuredCheckins = checkins.filter((checkin) => checkin.is_featured);
  const featuredCount = featuredCheckins.length;
  const name = displayName(profile);
  const totalXp = profile?.total_xp ?? 0;
  const level = Math.floor(totalXp / 100) + 1;
  const rank = level <= 3 ? "Aprendiz" : level <= 10 ? "Praticante" : "Veterano";
  const totalMinutes = checkins.reduce(
    (total, checkin) => total + checkin.time_invested_minutes,
    0,
  );
  const totalHours = totalMinutes / 60;
  const topicTotals = new Map<string, { minutes: number; checkins: number }>();
  for (const checkin of checkins) {
    const tag = checkin.hobby_tag ?? "Outros";
    const current = topicTotals.get(tag) ?? { minutes: 0, checkins: 0 };
    current.minutes += checkin.time_invested_minutes;
    current.checkins += 1;
    topicTotals.set(tag, current);
  }
  const topics = [...topicTotals.entries()].sort(([, left], [, right]) => right.minutes - left.minutes);
  const dominantTopic = topics[0]?.[0] ?? null;
  const dominantColor = hobbyColors[dominantTopic ?? ""] ?? defaultHobbyColor;
  const currentStreak = getCurrentStreak(checkins);
  const spotifyEmbedUrl = getSpotifyEmbedUrl(profile?.spotify_url);
  const backgroundUrl = getSafeBackgroundUrl(profile?.bg_gif_url);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#71737c]">PERFIL</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-[#111114]">Seu percurso</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden text-right text-sm text-[#71737c] sm:block">Progresso pessoal</p>
          {profile ? <EditProfileButton profile={profile} /> : null}
        </div>
      </header>

      <section aria-label="Tópicos ativos e sequência" className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex-1 rounded-2xl border border-[#e4e5e9] bg-[#111114] p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">TÓPICOS ATIVOS</p>
              <p className="mt-2 text-sm text-gray-300">Seus hobbies mais praticados</p>
            </div>
            <span className="text-xs text-gray-500">{topics.length} tópicos</span>
          </div>
          {topics.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {topics.map(([topic, totals]) => {
                const topicColor = hobbyColors[topic] ?? defaultHobbyColor;
                return (
                  <span key={topic} className="inline-flex items-center gap-2 rounded-full border bg-zinc-900/80 px-3 py-1.5 text-xs" style={{ borderColor: `${topicColor.color}99`, color: topicColor.color }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: topicColor.color }} />
                    {topic}
                    <span className="opacity-60">{totals.checkins}</span>
                  </span>
                );
              })}
            </div>
          ) : <p className="mt-5 text-sm text-gray-500">Registre um check-in para ativar seus tópicos.</p>}
        </div>
        <div className="flex min-w-64 items-center gap-4 rounded-2xl border p-5" style={{ borderColor: `${dominantColor.color}99`, backgroundColor: dominantColor.background, color: dominantColor.color }}>
          <Flame className="h-8 w-8 shrink-0" fill="currentColor" strokeWidth={1.5} />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">SEQUÊNCIA ATUAL</p>
            <p className="mt-1 text-2xl font-semibold">{currentStreak} dias</p>
            <p className="mt-1 text-xs opacity-70">{dominantTopic ? `Foco: ${dominantTopic}` : "Comece seu ritmo"}</p>
          </div>
        </div>
      </section>

      <section aria-label="Resumo do perfil" className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <article
          className="relative overflow-hidden border border-gray-800 bg-gray-950 p-6 md:col-span-3"
          style={
            backgroundUrl
              ? { backgroundImage: `url("${backgroundUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backgroundUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          {backgroundUrl ? <div className="absolute inset-0 bg-black/35" aria-hidden="true" /> : null}
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-700 bg-gray-900">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-gray-400" strokeWidth={1.25} />
                )}
              </div>
              <span className="text-xs text-gray-300">IDENTIDADE</span>
            </div>
            <h2 className="mt-8 text-2xl font-medium text-white">{name}</h2>
            {profile?.email_public && profile.email ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {profile.email}
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-[#e4e5e9] bg-[#111114] p-6 text-white md:col-span-3">
          <div className="flex items-start justify-between">
            <span className="text-xs text-gray-500">RANKING</span>
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

        <article className="rounded-2xl border border-[#e4e5e9] bg-white p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">TEMPO TOTAL</span>
            <Clock3 className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="mt-8 text-3xl font-medium">{totalHours.toFixed(1)}h</p>
          <p className="mt-1 text-sm text-gray-500">{formatMinutes(totalMinutes)} investidos</p>
        </article>

        <article className="rounded-2xl border border-[#e4e5e9] bg-white p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">ATIVIDADE</span>
            <Activity className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="mt-8 text-3xl font-medium">{checkins.length}</p>
          <p className="mt-1 text-sm text-gray-500">check-ins registrados</p>
        </article>

        <article className="flex min-h-40 flex-col rounded-2xl border border-[#e4e5e9] bg-white p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">MÚSICA TEMA</span>
            <Music2 className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          </div>
          {spotifyEmbedUrl ? (
            <iframe
              title="Música tema do perfil"
              src={spotifyEmbedUrl}
              className="mt-4 h-20 w-full rounded"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          ) : (
            <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#ececf0] pt-4">
              <p className="text-sm text-[#71737c]">Nenhuma faixa conectada</p>
              <span className="text-xs text-[#a0a1a8]">SPOTIFY</span>
            </div>
          )}
        </article>
      </section>

      <HobbyHeatmap userId={user.id} />

      <BadgesGrid userId={user.id} />

      {featuredCheckins.length ? (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#71737c]">⭐ DESTAQUES</p>
              <h2 className="mt-2 text-xl font-medium text-[#111114]">Mural em destaque</h2>
            </div>
            <span className="text-xs text-[#71737c]">{featuredCount}/3 fixados</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {featuredCheckins.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} currentUserId={user.id} showPin featuredCount={featuredCount} />)}
          </div>
        </section>
      ) : null}

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {checkins.map((checkin) => (
              <CheckinCard key={checkin.id} checkin={checkin} currentUserId={user.id} gallery showPin featuredCount={featuredCount} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

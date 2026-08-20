import { Activity, ArrowLeft, Clock3, Crown, Flame, Mail, Music2, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckinCard } from "@/components/CheckinCard";
import { BadgesGrid } from "@/components/BadgesGrid";
import { HobbyHeatmap } from "@/components/HobbyHeatmap";
import { PublicProfileActions } from "@/components/PublicProfileActions";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import { formatMinutes, type CheckinWithProfile } from "@/lib/checkins";
import type { ProfileRow } from "@/lib/database.types";
import { getSpotifyEmbedUrl } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export default async function PublicUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, configured } = await getSessionUser();
  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;
  const { id } = await params;

  const [{ data: profile }, { data: checkins }, { data: follow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("checkins").select("*, profiles(username, avatar_url, email)").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", id).maybeSingle(),
  ]);
  if (!profile) notFound();

  const publicProfile = profile as ProfileRow;
  const publicCheckins = (checkins ?? []) as CheckinWithProfile[];
  const totalMinutes = publicCheckins.reduce((total, checkin) => total + checkin.time_invested_minutes, 0);
  const totalXp = publicProfile.total_xp ?? 0;
  const level = Math.floor(totalXp / 100) + 1;
  const rank = level <= 3 ? "Aprendiz" : level <= 10 ? "Praticante" : "Veterano";
  const spotifyEmbedUrl = getSpotifyEmbedUrl(publicProfile.spotify_url);
  const backgroundUrl = publicProfile.bg_gif_url?.replace(/"/g, "%22") ?? null;
  const topics = [...publicCheckins.reduce((map, checkin) => {
    const tag = checkin.hobby_tag ?? "Outros";
    map.set(tag, (map.get(tag) ?? 0) + 1);
    return map;
  }, new Map<string, number>())].sort(([, left], [, right]) => right - left);
  const activeDays = new Set(publicCheckins.map((checkin) => new Date(checkin.created_at).toISOString().slice(0, 10)));
  const today = new Date();
  let streak = 0;
  const streakDate = new Date(today);
  if (!activeDays.has(streakDate.toISOString().slice(0, 10))) streakDate.setUTCDate(streakDate.getUTCDate() - 1);
  while (activeDays.has(streakDate.toISOString().slice(0, 10))) {
    streak += 1;
    streakDate.setUTCDate(streakDate.getUTCDate() - 1);
  }
  const featured = publicCheckins.filter((checkin) => checkin.is_featured);
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10">
      <Link href="/search" className="flex w-fit items-center gap-2 text-sm text-gray-500 hover:text-white"><ArrowLeft className="h-4 w-4" strokeWidth={1.5} />Voltar para busca</Link>
      <header className="relative overflow-hidden border border-gray-800 bg-gray-950 p-6" style={backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        {backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {backgroundUrl ? <div className="absolute inset-0 bg-black/35" aria-hidden="true" /> : null}
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-900">{publicProfile.avatar_url ? <><span className="sr-only">Avatar de {publicProfile.username ?? "usuário"}</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={publicProfile.avatar_url} alt="" className="h-full w-full object-cover" /></> : <User className="h-8 w-8 text-gray-500" strokeWidth={1.25} />}</div>
            <div><h1 className="text-2xl font-medium text-white">@{publicProfile.username ?? "usuário"}</h1>{publicProfile.email_public && publicProfile.email ? <p className="mt-2 flex items-center gap-2 text-sm text-gray-300"><Mail className="h-3.5 w-3.5" strokeWidth={1.5} />{publicProfile.email}</p> : null}<p className="mt-2 text-sm text-gray-400">{totalXp} XP</p></div>
          </div>
          {user.id !== id ? <PublicProfileActions currentUserId={user.id} profileId={id} initiallyFollowing={Boolean(follow)} /> : <Link href="/profile" className="text-sm text-gray-400 hover:text-white">Ver meu perfil</Link>}
        </div>
      </header>
      <section className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 rounded-2xl border border-[#e4e5e9] bg-[#111114] p-5 text-white"><p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">TÓPICOS ATIVOS</p><div className="mt-4 flex flex-wrap gap-2">{topics.length ? topics.map(([topic, count]) => <span key={topic} className="rounded-full border border-gray-600 bg-zinc-900/80 px-3 py-1.5 text-xs text-gray-200">{topic} <span className="text-gray-500">{count}</span></span>) : <span className="text-sm text-gray-500">Sem tópicos ainda</span>}</div></div>
        <div className="flex min-w-56 items-center gap-3 rounded-2xl border border-gray-700 bg-zinc-900 p-5 text-white"><Flame className="h-7 w-7" fill="currentColor" /><div><p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">SEQUÊNCIA</p><p className="mt-1 text-2xl font-semibold">{streak} dias</p><p className="text-xs text-gray-500">ritmo atual</p></div></div>
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-gray-800 bg-gray-900 p-5 text-white md:col-span-2"><div className="flex items-center gap-2 text-xs tracking-[0.16em] text-gray-500"><Crown className="h-4 w-4" strokeWidth={1.5} />RANKING</div><div className="mt-5 flex items-end justify-between"><p className="text-3xl font-medium">Nível {level}</p><p className="text-sm text-gray-400">{rank}</p></div><p className="mt-2 text-sm text-gray-500">{totalXp} XP acumulado</p></article>
        <article className="border border-gray-800 p-5"><div className="flex items-center gap-2 text-xs tracking-[0.16em] text-gray-500"><Clock3 className="h-4 w-4" strokeWidth={1.5} />TEMPO</div><p className="mt-5 text-3xl font-medium">{(totalMinutes / 60).toFixed(1)}h</p><p className="mt-1 text-sm text-gray-500">{formatMinutes(totalMinutes)}</p></article>
        <article className="border border-gray-800 p-5"><div className="flex items-center gap-2 text-xs tracking-[0.16em] text-gray-500"><Activity className="h-4 w-4" strokeWidth={1.5} />ATIVIDADE</div><p className="mt-5 text-3xl font-medium">{publicCheckins.length}</p><p className="mt-1 text-sm text-gray-500">check-ins</p></article>
      </section>
      {spotifyEmbedUrl ? <section className="border border-gray-800 bg-gray-950 p-6"><div className="flex items-center gap-2 text-xs tracking-[0.18em] text-gray-500"><Music2 className="h-4 w-4" strokeWidth={1.5} />MÚSICA TEMA</div><iframe title="Música tema do perfil" src={spotifyEmbedUrl} className="mt-4 h-20 w-full rounded" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" /></section> : null}
      <HobbyHeatmap userId={id} />
      <BadgesGrid userId={id} />
      {featured.length ? <section><p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">⭐ DESTAQUES</p><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{featured.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} currentUserId={user.id} />)}</div></section> : null}
      <section><p className="text-xs tracking-[0.18em] text-gray-500">ATIVIDADE PÚBLICA</p><h2 className="mt-2 text-xl font-medium">Mural de check-ins</h2>{publicCheckins.length ? <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{publicCheckins.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} currentUserId={user.id} gallery />)}</div> : <div className="mt-5 border border-gray-800 px-6 py-14 text-center text-sm text-gray-500">Nenhum check-in publicado ainda.</div>}</section>
    </main>
  );
}
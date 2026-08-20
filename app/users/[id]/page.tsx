import { ArrowLeft, Mail, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckinCard } from "@/components/CheckinCard";
import SetupEnvPage from "@/components/SetupEnvPage";
import { getSessionUser } from "@/lib/auth";
import type { CheckinWithProfile } from "@/lib/checkins";
import type { ProfileRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function PublicUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, configured } = await getSessionUser();
  if (!configured) return <SetupEnvPage />;
  if (!user || !supabase) return null;
  const { id } = await params;

  const [{ data: profile }, { data: checkins }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("checkins").select("*, profiles(username, avatar_url, email)").eq("user_id", id).order("created_at", { ascending: false }),
  ]);
  if (!profile) notFound();

  const publicProfile = profile as ProfileRow;
  const publicCheckins = (checkins ?? []) as CheckinWithProfile[];
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/search" className="flex w-fit items-center gap-2 text-sm text-gray-500 hover:text-white"><ArrowLeft className="h-4 w-4" strokeWidth={1.5} />Voltar para busca</Link>
      <header className="border border-gray-800 bg-gray-950 p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-800 bg-gray-900">{publicProfile.avatar_url ? <div role="img" aria-label={`Avatar de ${publicProfile.username ?? "usuário"}`} className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${publicProfile.avatar_url.replace(/"/g, "%22")}")` }} /> : <User className="h-8 w-8 text-gray-500" strokeWidth={1.25} />}</div>
          <div><h1 className="text-2xl font-medium">@{publicProfile.username ?? "usuário"}</h1>{publicProfile.email_public && publicProfile.email ? <p className="mt-2 flex items-center gap-2 text-sm text-gray-500"><Mail className="h-3.5 w-3.5" strokeWidth={1.5} />{publicProfile.email}</p> : null}<p className="mt-2 text-sm text-gray-400">{publicProfile.total_xp} XP</p></div>
        </div>
      </header>
      <section><p className="text-xs tracking-[0.18em] text-gray-500">ATIVIDADE PÚBLICA</p><h2 className="mt-2 text-xl font-medium">Check-ins</h2>{publicCheckins.length ? <div className="mt-5 flex flex-col gap-4">{publicCheckins.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} currentUserId={user.id} />)}</div> : <div className="mt-5 border border-gray-800 px-6 py-14 text-center text-sm text-gray-500">Nenhum check-in publicado ainda.</div>}</section>
    </main>
  );
}
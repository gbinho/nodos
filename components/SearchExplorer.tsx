"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, UserRound, UsersRound } from "lucide-react";
import type { ProfileRow } from "@/lib/database.types";
import { createSupabaseClient } from "@/lib/supabase";

type SearchUser = Pick<ProfileRow, "id" | "username" | "avatar_url" | "total_xp">;
type TagResult = { tag: string; checkins: number; minutes: number };

function followErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    if (code === "42P01") return "A tabela follows ainda não existe. Execute a migration 20260820210000_follows.sql no Supabase.";
    if (code === "42501") return "O Supabase bloqueou o follow. Verifique a policy follows_insert_own.";
    if (code === "23505") return "Você já segue este usuário.";
  }
  return error instanceof Error ? error.message : "Não foi possível atualizar o follow.";
}

export function SearchExplorer({ initialUsers, initialFollowing, currentUserId }: { initialUsers: SearchUser[]; initialFollowing: string[]; currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"users" | "tags">("users");
  const [users, setUsers] = useState<SearchUser[]>(initialUsers);
  const [tags, setTags] = useState<TagResult[]>([]);
  const [following, setFollowing] = useState(new Set(initialFollowing));
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 5) {
      setUsers([]);
      setTags([]);
      setError(null);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      async function search() {
        setLoading(true);
        setError(null);
        try {
          const supabase = createSupabaseClient();
          if (tab === "users") {
            const { data, error: searchError } = await supabase
              .from("profiles")
              .select("id, username, avatar_url, total_xp")
              .ilike("username", `%${term}%`)
              .order("username", { ascending: true })
              .limit(30);
            if (searchError) throw searchError;
            if (active) setUsers((data ?? []) as SearchUser[]);
          } else {
            const { data, error: searchError } = await supabase
              .from("checkins")
              .select("hobby_tag, time_invested_minutes")
              .ilike("hobby_tag", `%${term}%`);
            if (searchError) throw searchError;
            const grouped = new Map<string, TagResult>();
            for (const item of data ?? []) {
              if (!item.hobby_tag) continue;
              const current = grouped.get(item.hobby_tag) ?? { tag: item.hobby_tag, checkins: 0, minutes: 0 };
              current.checkins += 1;
              current.minutes += item.time_invested_minutes;
              grouped.set(item.hobby_tag, current);
            }
            if (active) setTags([...grouped.values()].sort((a, b) => b.checkins - a.checkins));
          }
        } catch (searchError) {
          if (active) setError(searchError instanceof Error ? searchError.message : "Não foi possível pesquisar.");
        } finally {
          if (active) setLoading(false);
        }
      }
      void search();
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [initialUsers, query, tab]);

  async function toggleFollow(userId: string) {
    setWorkingId(userId);
    setError(null);
    const wasFollowing = following.has(userId);
    try {
      const supabase = createSupabaseClient();
      const request = wasFollowing
        ? supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId)
        : supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
      const { error: followError } = await request;
      if (followError) throw followError;
      setFollowing((current) => {
        const next = new Set(current);
        if (wasFollowing) next.delete(userId); else next.add(userId);
        return next;
      });
    } catch (followError) {
      setError(followErrorMessage(followError));
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8">
      <header><p className="text-xs tracking-[0.22em] text-gray-500">EXPLORAR</p><h1 className="mt-3 text-3xl font-medium tracking-tight">Buscar na rede</h1><p className="mt-2 text-sm text-gray-400">Encontre pessoas e interesses para acompanhar.</p></header>
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" strokeWidth={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar username ou hobby..." className="w-full border border-gray-800 bg-black py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gray-500" /></div>
      <div className="flex gap-1 border-b border-gray-800"><button type="button" onClick={() => setTab("users")} className={`border-b-2 px-4 py-3 text-sm ${tab === "users" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-white"}`}><UsersRound className="mr-2 inline h-4 w-4" strokeWidth={1.5} />Usuários</button><button type="button" onClick={() => setTab("tags")} className={`border-b-2 px-4 py-3 text-sm ${tab === "tags" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-white"}`}><Search className="mr-2 inline h-4 w-4" strokeWidth={1.5} />Tags/Hobbies</button></div>
      {error ? <p role="alert" className="text-sm text-gray-400">{error}</p> : null}
      {query.trim().length < 5 ? <p className="text-sm text-gray-500">Digite pelo menos 5 caracteres para pesquisar.</p> : null}
      {loading ? <p className="text-sm text-gray-500">Pesquisando...</p> : tab === "users" ? (
        users.length ? <div className="flex flex-col gap-3">{users.map((result) => <article key={result.id} className="flex items-center gap-4 border border-gray-800 bg-gray-950 p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-800 bg-gray-900">{result.avatar_url ? <div aria-label={`Avatar de ${result.username ?? "usuário"}`} role="img" className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${result.avatar_url.replace(/"/g, "%22")}")` }} /> : <UserRound className="h-5 w-5 text-gray-500" strokeWidth={1.5} />}</div><div className="min-w-0 flex-1"><Link href={`/users/${result.id}`} className="truncate text-sm text-white hover:underline">@{result.username ?? "usuário"}</Link><p className="text-xs text-gray-500">{result.total_xp} XP</p></div>{result.id !== currentUserId ? <button type="button" onClick={() => void toggleFollow(result.id)} disabled={workingId !== null} className={`flex items-center gap-1.5 border px-3 py-2 text-xs ${following.has(result.id) ? "border-gray-800 text-gray-400 hover:border-gray-500 hover:text-white" : "border-white bg-white text-black hover:bg-gray-200"}`}>{following.has(result.id) ? "Seguindo" : <><UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />Seguir</>}</button> : <span className="text-xs text-gray-600">Você</span>}</article>)}</div> : <div className="border border-gray-800 px-6 py-14 text-center text-sm text-gray-500">Nenhum usuário encontrado.</div>
      ) : tags.length ? <div className="grid gap-3 sm:grid-cols-2">{tags.map((tag) => <article key={tag.tag} className="border border-gray-800 bg-gray-950 p-5"><p className="text-lg font-medium">#{tag.tag}</p><p className="mt-2 text-sm text-gray-500">{tag.checkins} check-ins · {(tag.minutes / 60).toFixed(1)}h investidas</p></article>)}</div> : <div className="border border-gray-800 px-6 py-14 text-center text-sm text-gray-500">Nenhum hobby encontrado.</div>}
    </main>
  );
}
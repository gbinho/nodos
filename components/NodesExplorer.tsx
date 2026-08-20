"use client";

import { useEffect, useState } from "react";
import { Activity, Clock3, LoaderCircle, Users } from "lucide-react";
import { CheckinCard } from "@/components/CheckinCard";
import { formatMinutes, type CheckinWithProfile } from "@/lib/checkins";
import { createSupabaseClient } from "@/lib/supabase";

type NodesExplorerProps = {
  initialCheckins: CheckinWithProfile[];
  initialError: string | null;
  tags: readonly string[];
};

export function NodesExplorer({ initialCheckins, initialError, tags }: NodesExplorerProps) {
  const [selectedTag, setSelectedTag] = useState("Todos");
  const [checkins, setCheckins] = useState(initialCheckins);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTag === "Todos") {
      setCheckins(initialCheckins);
      setError(initialError);
      return;
    }

    let active = true;

    async function loadNode() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseClient();
        const { data, error: queryError } = await supabase
          .from("checkins")
          .select("*, profiles(username, avatar_url, email)")
          .eq("hobby_tag", selectedTag)
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        if (active) setCheckins((data ?? []) as CheckinWithProfile[]);
      } catch (loadError) {
        if (active) {
          setCheckins([]);
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar este Node.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNode();
    return () => {
      active = false;
    };
  }, [initialCheckins, initialError, selectedTag]);

  const totalMinutes = checkins.reduce(
    (total, checkin) => total + checkin.time_invested_minutes,
    0,
  );
  const totalHours = totalMinutes / 60;
  const currentNode = selectedTag === "Todos" ? "Todos os Nodes" : selectedTag;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8">
      <header>
        <p className="text-xs tracking-[0.22em] text-gray-500">EXPLORAR</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Nodes</h1>
            <p className="mt-2 text-sm text-gray-400">Encontre progresso acontecendo nos seus nichos.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" strokeWidth={1.5} />
            Comunidade aberta
          </div>
        </div>
      </header>

      <nav aria-label="Filtrar Nodes" className="flex flex-wrap gap-2 border-y border-gray-800 py-4">
        {["Todos", ...tags].map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={selectedTag === tag}
            onClick={() => setSelectedTag(tag)}
            className={`border px-3 py-2 text-xs transition-colors ${
              selectedTag === tag
                ? "border-white bg-white text-black"
                : "border-gray-800 text-gray-400 hover:border-gray-500 hover:text-white"
            }`}
          >
            {tag}
          </button>
        ))}
      </nav>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Estatísticas do Node">
        <article className="border border-gray-800 bg-gray-950 p-5 sm:col-span-2">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-gray-500">
            <Activity className="h-4 w-4" strokeWidth={1.5} />
            NODE ATUAL
          </div>
          <h2 className="mt-5 text-2xl font-medium">{currentNode}</h2>
          <p className="mt-2 text-sm text-gray-400">{checkins.length} check-ins compartilhados pela comunidade</p>
        </article>
        <article className="border border-gray-800 p-5">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-gray-500">
            <Clock3 className="h-4 w-4" strokeWidth={1.5} />
            TEMPO ACUMULADO
          </div>
          <p className="mt-5 text-3xl font-medium">{totalHours.toFixed(1)}h</p>
          <p className="mt-1 text-sm text-gray-500">{formatMinutes(totalMinutes)} em todos os registros</p>
        </article>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-gray-500">FEED DO NODE</p>
            <h2 className="mt-2 text-xl font-medium">Atividade recente</h2>
          </div>
          {loading ? <LoaderCircle className="h-5 w-5 animate-spin text-gray-400" /> : null}
        </div>
        {error ? (
          <div className="border border-gray-800 p-6 text-sm text-gray-400">Não foi possível carregar este Node.</div>
        ) : checkins.length === 0 ? (
          <div className="border border-gray-800 px-6 py-16 text-center text-sm text-gray-400">
            Ainda não há check-ins neste Node.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {checkins.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} />)}
          </div>
        )}
      </section>
    </main>
  );
}
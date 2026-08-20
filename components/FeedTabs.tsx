"use client";

import { useEffect, useState } from "react";
import { CheckinCard } from "@/components/CheckinCard";
import type { CheckinWithProfile } from "@/lib/checkins";

type FeedTabsProps = {
  globalCheckins: CheckinWithProfile[];
  followingCheckins: CheckinWithProfile[];
  currentUserId: string;
  globalError: string | null;
  followingError: string | null;
};

export function FeedTabs({ globalCheckins, followingCheckins, currentUserId, globalError, followingError }: FeedTabsProps) {
  const [view, setView] = useState<"global" | "following">("global");
  const [currentGlobalCheckins, setCurrentGlobalCheckins] = useState(globalCheckins);
  const [currentFollowingCheckins, setCurrentFollowingCheckins] = useState(followingCheckins);

  useEffect(() => {
    setCurrentGlobalCheckins(globalCheckins);
    setCurrentFollowingCheckins(followingCheckins);
  }, [globalCheckins, followingCheckins]);

  const checkins = view === "global" ? currentGlobalCheckins : currentFollowingCheckins;
  const error = view === "global" ? globalError : followingError;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex rounded-xl border border-[#e4e5e9] bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setView("global")} className={`rounded-lg px-4 py-2 text-sm transition ${view === "global" ? "bg-[#111114] text-white" : "text-[#71737c] hover:text-[#111114]"}`}>Global</button>
          <button type="button" onClick={() => setView("following")} className={`rounded-lg px-4 py-2 text-sm transition ${view === "following" ? "bg-[#111114] text-white" : "text-[#71737c] hover:text-[#111114]"}`}>Seguindo</button>
        </div>
        <span className="text-xs text-[#8b8d96]">{checkins.length} registros</span>
      </div>
      {error ? <p className="rounded-2xl border border-[#e4e5e9] bg-white p-8 text-sm text-[#71737c]">Não foi possível carregar o feed.</p> : checkins.length === 0 ? <div className="rounded-2xl border border-[#e4e5e9] bg-white px-6 py-16 text-center text-sm text-[#71737c]">{view === "following" ? "Você ainda não segue ninguém com check-ins." : "Nenhum check-in ainda"}</div> : <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{checkins.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} currentUserId={currentUserId} />)}</div>}
    </section>
  );
}
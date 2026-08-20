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
      <div className="mb-5 flex items-center justify-between border-b border-gray-800">
        <div className="flex gap-5">
          <button type="button" onClick={() => setView("global")} className={`border-b-2 px-1 pb-3 text-sm ${view === "global" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-white"}`}>Global</button>
          <button type="button" onClick={() => setView("following")} className={`border-b-2 px-1 pb-3 text-sm ${view === "following" ? "border-white text-white" : "border-transparent text-gray-500 hover:text-white"}`}>Seguindo</button>
        </div>
        <span className="pb-3 text-xs text-gray-600">{checkins.length} registros</span>
      </div>
      {error ? <p className="text-sm text-gray-400">Não foi possível carregar o feed.</p> : checkins.length === 0 ? <div className="border border-gray-800 px-6 py-16 text-center text-sm text-gray-500">{view === "following" ? "Você ainda não segue ninguém com check-ins." : "Nenhum check-in ainda"}</div> : <div className="flex flex-col gap-4">{checkins.map((checkin) => <CheckinCard key={checkin.id} checkin={checkin} currentUserId={currentUserId} />)}</div>}
    </section>
  );
}
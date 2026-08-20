"use client";

import { useEffect, useState } from "react";
import { Radio, UsersRound } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

type OnlineUsersProps = {
  userId: string;
};

export function OnlineUsers({ userId }: OnlineUsersProps) {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const channel = supabase.channel("nodos-online-users", {
      config: { presence: { key: userId } },
    });

    function updateCount() {
      const presenceState = channel.presenceState<{ user_id: string }>();
      setOnlineCount(Object.keys(presenceState).length);
    }

    channel.on("presence", { event: "sync" }, updateCount);
    channel.on("presence", { event: "join" }, updateCount);
    channel.on("presence", { event: "leave" }, updateCount);

    void channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.track({ user_id: userId });
      updateCount();
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={onlineCount === null ? "Conectando aos usuários online" : `${onlineCount} usuários online`}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 border border-gray-700 bg-black/90 px-3 py-2 text-xs text-gray-300 shadow-2xl backdrop-blur"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
      <UsersRound className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
      <span>{onlineCount ?? "..."}</span>
      <span className="text-gray-500">online</span>
      <Radio className="ml-1 h-3 w-3 text-green-400" strokeWidth={1.5} />
    </div>
  );
}
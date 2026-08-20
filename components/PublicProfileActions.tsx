"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

type PublicProfileActionsProps = {
  currentUserId: string;
  profileId: string;
  initiallyFollowing: boolean;
};

function followErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    const message = "message" in error ? String(error.message) : "";
    if (code === "42P01") return "A tabela follows não existe. Execute a migration 20260820210000_follows.sql no Supabase.";
    if (code === "42501") return "O Supabase bloqueou o follow. Verifique a policy follows_insert_own.";
    if (code === "23505") return "Você já segue este perfil.";
    return `Supabase ${code}: ${message || "não foi possível atualizar o follow."}`;
  }
  return error instanceof Error ? error.message : "Não foi possível atualizar o follow.";
}

export function PublicProfileActions({ currentUserId, profileId, initiallyFollowing }: PublicProfileActionsProps) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const query = following
        ? supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profileId)
        : supabase.from("follows").insert({ follower_id: currentUserId, following_id: profileId });
      const { error: followError } = await query;
      if (followError) throw followError;
      setFollowing((current) => !current);
    } catch (followError) {
      setError(followErrorMessage(followError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={() => void toggleFollow()} disabled={loading} className={`flex items-center gap-2 border px-4 py-2 text-sm ${following ? "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white" : "border-white bg-white text-black hover:bg-gray-200"}`}>
        <UserPlus className="h-4 w-4" strokeWidth={1.5} />
        {loading ? "..." : following ? "Seguindo" : "Seguir"}
      </button>
      {error ? <p className="text-xs text-gray-500">{error}</p> : null}
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LoaderCircle, MessageCircle, Send } from "lucide-react";
import { displayName, formatMinutes, formatWhen, type CheckinWithProfile } from "@/lib/checkins";
import type { CommentRow, ProfileRow, ReactionRow } from "@/lib/database.types";
import { createSupabaseClient } from "@/lib/supabase";
import { ShareCardModal } from "@/components/ShareCardModal";

type ReactionType = ReactionRow["reaction_type"];
type ReactionCount = Record<ReactionType, number>;
type CommentWithProfile = CommentRow & { profile: Pick<ProfileRow, "username" | "avatar_url" | "email"> | null };

const reactionOptions: Array<{ type: ReactionType; label: string; emoji: string }> = [
  { type: "inspired", label: "Inspirador", emoji: "💡" },
  { type: "respect", label: "Respeito", emoji: "🫡" },
  { type: "fire", label: "Foco", emoji: "🔥" },
];
const emptyCounts: ReactionCount = { inspired: 0, respect: 0, fire: 0 };

export function CheckinCard({ checkin, currentUserId }: { checkin: CheckinWithProfile; currentUserId: string }) {
  const name = displayName(checkin.profiles);
  const [counts, setCounts] = useState<ReactionCount>(emptyCounts);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [reactionLoading, setReactionLoading] = useState<ReactionType | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const loadEngagement = useCallback(async () => {
    const supabase = createSupabaseClient();
    const [{ data: reactionData, error: reactionError }, { data: commentData, error: commentError }] = await Promise.all([
      supabase.from("reactions").select("*").eq("checkin_id", checkin.id),
      supabase.from("comments").select("*").eq("checkin_id", checkin.id).order("created_at", { ascending: true }),
    ]);
    if (reactionError) throw reactionError;
    if (commentError) throw commentError;

    const nextCounts: ReactionCount = { ...emptyCounts };
    let nextMyReaction: ReactionType | null = null;
    for (const reaction of (reactionData ?? []) as ReactionRow[]) {
      nextCounts[reaction.reaction_type] += 1;
      if (reaction.user_id === currentUserId) nextMyReaction = reaction.reaction_type;
    }

    const rawComments = (commentData ?? []) as CommentRow[];
    const userIds = [...new Set(rawComments.map((comment) => comment.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from("profiles").select("id, username, avatar_url, email").in("id", userIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    setCounts(nextCounts);
    setMyReaction(nextMyReaction);
    setComments(rawComments.map((comment) => ({ ...comment, profile: profileById.get(comment.user_id) ?? null })));
  }, [checkin.id, currentUserId]);

  useEffect(() => {
    let active = true;
    void loadEngagement().catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o engajamento.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadEngagement]);

  async function toggleReaction(type: ReactionType) {
    setError(null);
    setReactionLoading(type);
    try {
      const supabase = createSupabaseClient();
      const { error: deleteError } = await supabase.from("reactions").delete().eq("checkin_id", checkin.id).eq("user_id", currentUserId);
      if (deleteError) throw deleteError;
      if (myReaction !== type) {
        const { error: insertError } = await supabase.from("reactions").insert({ checkin_id: checkin.id, user_id: currentUserId, reaction_type: type });
        if (insertError) throw insertError;
      }
      await loadEngagement();
    } catch (reactionError) {
      setError(reactionError instanceof Error ? reactionError.message : "Não foi possível atualizar a reação.");
    } finally {
      setReactionLoading(null);
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = commentText.trim();
    if (!content || commentLoading) return;
    setError(null);
    setCommentLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error: insertError } = await supabase.from("comments").insert({ checkin_id: checkin.id, user_id: currentUserId, content });
      if (insertError) throw insertError;
      setCommentText("");
      await loadEngagement();
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Não foi possível enviar o comentário.");
    } finally {
      setCommentLoading(false);
    }
  }

  return (
    <article className="border border-gray-800">
      {checkin.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={checkin.image_url} alt="" className="max-h-80 w-full object-cover" />
      ) : null}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3"><p className="text-sm text-white">{name}</p><p className="text-xs text-gray-400">{formatWhen(checkin.created_at)}</p></div>
        <p className="mt-2 text-xs text-gray-400">{checkin.hobby_tag ?? "Hobby"} · {formatMinutes(checkin.time_invested_minutes)}</p>
        {checkin.description ? <p className="mt-3 text-sm text-gray-400">{checkin.description}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-800 pt-4">
          {reactionOptions.map(({ type, label, emoji }) => <button key={type} type="button" onClick={() => void toggleReaction(type)} disabled={loading || reactionLoading !== null} aria-pressed={myReaction === type} className={`border px-2.5 py-1.5 text-xs transition-colors ${myReaction === type ? "border-white bg-white text-black" : "border-gray-800 text-gray-400 hover:border-gray-500 hover:text-white"}`}>{reactionLoading === type ? "..." : `${emoji} ${label} ${counts[type]}`}</button>)}
          <button type="button" onClick={() => setCommentsOpen((open) => !open)} className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />Comentários ({comments.length})</button>
          <button type="button" onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><Send className="h-3.5 w-3.5" strokeWidth={1.5} />Compartilhar</button>
        </div>
        {commentsOpen ? <div className="mt-4 border-t border-gray-800 pt-4">
          {loading ? <LoaderCircle className="mx-auto h-4 w-4 animate-spin text-gray-500" /> : comments.length === 0 ? <p className="text-sm text-gray-500">Nenhum comentário ainda.</p> : <div className="flex flex-col gap-3">{comments.map((comment) => <div key={comment.id} className="flex gap-2.5"><div className="h-7 w-7 shrink-0 rounded-full border border-gray-800" /><div className="min-w-0"><p className="text-xs text-gray-400">{displayName(comment.profile)}</p><p className="mt-0.5 break-words text-sm text-gray-200">{comment.content}</p></div></div>)}</div>}
          <form onSubmit={submitComment} className="mt-4 flex gap-2"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={500} placeholder="Escreva um comentário..." className="min-w-0 flex-1 border border-gray-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gray-500" /><button type="submit" disabled={commentLoading || !commentText.trim()} className="border border-white px-3 py-2 text-xs text-white hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-500">{commentLoading ? "..." : "Enviar"}</button></form>
        </div> : null}
        {error ? <p className="mt-3 text-xs text-gray-500">Não foi possível atualizar o engajamento.</p> : null}
      </div>
      {shareOpen ? <ShareCardModal checkin={checkin} onClose={() => setShareOpen(false)} /> : null}
    </article>
  );
}

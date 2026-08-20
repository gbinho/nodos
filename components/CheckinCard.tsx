"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowBigDown, ArrowBigUp, Heart, LoaderCircle, MessageCircle, Pencil, Send, Trash2 } from "lucide-react";
import { displayName, formatMinutes, formatWhen, type CheckinWithProfile } from "@/lib/checkins";
import type { CheckinVoteRow, CommentReactionRow, CommentRow, ProfileRow, ReactionRow } from "@/lib/database.types";
import { createSupabaseClient } from "@/lib/supabase";
import { ShareCardModal } from "@/components/ShareCardModal";

type ReactionType = ReactionRow["reaction_type"];
type ReactionCount = Record<ReactionType, number>;
type CommentWithProfile = CommentRow & { profile: Pick<ProfileRow, "username" | "avatar_url" | "email"> | null };
type VoteType = CheckinVoteRow["vote_type"];

const reactionOptions: Array<{ type: ReactionType; label: string; emoji: string }> = [
  { type: "inspired", label: "Inspirador", emoji: "💡" },
  { type: "respect", label: "Respeito", emoji: "🫡" },
  { type: "fire", label: "Foco", emoji: "🔥" },
];
const emptyCounts: ReactionCount = { inspired: 0, respect: 0, fire: 0 };

function engagementErrorMessage(error: unknown, action: "comment" | "load") {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    const message = "message" in error ? String(error.message) : "";
    if (code === "42P01") {
      return "A tabela de engajamento ainda não existe. Execute a migration 20260820180000_checkin_engagement.sql no Supabase.";
    }
    if (code === "42501") {
      return `O Supabase bloqueou ${action === "comment" ? "este comentário" : "o engajamento"}. Verifique a policy comments_insert_own.`;
    }
    if (code === "401") {
      return "Sua sessão expirou. Entre novamente para comentar.";
    }
    return `Supabase ${code}: ${message || "erro ao atualizar o engajamento."}`;
  }

  if (error instanceof Error && error.message) return error.message;
  return action === "comment" ? "Não foi possível enviar o comentário." : "Não foi possível carregar o engajamento.";
}

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
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState(new Set<string>());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [voteCounts, setVoteCounts] = useState({ up: 0, down: 0 });
  const [myVote, setMyVote] = useState<VoteType | null>(null);

  const loadEngagement = useCallback(async () => {
    const supabase = createSupabaseClient();
    const [{ data: reactionData, error: reactionError }, { data: commentData, error: commentError }, { data: voteData, error: voteError }] = await Promise.all([
      supabase.from("reactions").select("*").eq("checkin_id", checkin.id),
      supabase.from("comments").select("*").eq("checkin_id", checkin.id).order("created_at", { ascending: true }),
      supabase.from("checkin_votes").select("*").eq("checkin_id", checkin.id),
    ]);
    if (reactionError) throw reactionError;
    if (commentError) throw commentError;
    if (voteError) throw voteError;

    const nextCounts: ReactionCount = { ...emptyCounts };
    let nextMyReaction: ReactionType | null = null;
    for (const reaction of (reactionData ?? []) as ReactionRow[]) {
      nextCounts[reaction.reaction_type] += 1;
      if (reaction.user_id === currentUserId) nextMyReaction = reaction.reaction_type;
    }

    const rawComments = (commentData ?? []) as CommentRow[];
    const commentIds = rawComments.map((comment) => comment.id);
    const { data: commentReactionData, error: commentReactionError } = commentIds.length
      ? await supabase.from("comment_reactions").select("*").in("comment_id", commentIds)
      : { data: [], error: null };
    if (commentReactionError) throw commentReactionError;
    const userIds = [...new Set(rawComments.map((comment) => comment.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from("profiles").select("id, username, avatar_url, email").in("id", userIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const nextCommentLikes: Record<string, number> = {};
    const nextLikedComments = new Set<string>();
    for (const like of (commentReactionData ?? []) as (CommentReactionRow & { comment_id: string })[]) {
      nextCommentLikes[like.comment_id] = (nextCommentLikes[like.comment_id] ?? 0) + 1;
      if (like.user_id === currentUserId) nextLikedComments.add(like.comment_id);
    }
    const nextVoteCounts = { up: 0, down: 0 };
    let nextMyVote: VoteType | null = null;
    for (const vote of (voteData ?? []) as CheckinVoteRow[]) {
      nextVoteCounts[vote.vote_type] += 1;
      if (vote.user_id === currentUserId) nextMyVote = vote.vote_type;
    }
    setCounts(nextCounts);
    setMyReaction(nextMyReaction);
    setComments(rawComments.map((comment) => ({ ...comment, profile: profileById.get(comment.user_id) ?? null })));
    setCommentLikes(nextCommentLikes);
    setLikedComments(nextLikedComments);
    setVoteCounts(nextVoteCounts);
    setMyVote(nextMyVote);
  }, [checkin.id, currentUserId]);

  useEffect(() => {
    let active = true;
    void loadEngagement().catch((loadError) => {
      if (active) setError(engagementErrorMessage(loadError, "load"));
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
      const { data: insertedComment, error: insertError } = await supabase
        .from("comments")
        .insert({ checkin_id: checkin.id, user_id: currentUserId, content })
        .select("*")
        .single();
      if (insertError) throw insertError;
      setCommentText("");
      if (insertedComment) {
        setComments((current) => [
          ...current,
          { ...(insertedComment as CommentRow), profile: null },
        ]);
      }
      try {
        await loadEngagement();
      } catch (reloadError) {
        setError(engagementErrorMessage(reloadError, "load"));
      }
    } catch (commentError) {
      setError(engagementErrorMessage(commentError, "comment"));
    } finally {
      setCommentLoading(false);
    }
  }

  async function votePost(type: VoteType) {
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const { error: deleteError } = await supabase.from("checkin_votes").delete().eq("checkin_id", checkin.id).eq("user_id", currentUserId);
      if (deleteError) throw deleteError;
      if (myVote !== type) {
        const { error: insertError } = await supabase.from("checkin_votes").insert({ checkin_id: checkin.id, user_id: currentUserId, vote_type: type });
        if (insertError) throw insertError;
      }
      await loadEngagement();
    } catch (voteError) {
      setError(engagementErrorMessage(voteError, "load"));
    }
  }

  async function toggleCommentLike(commentId: string) {
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const isLiked = likedComments.has(commentId);
      const request = isLiked
        ? supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", currentUserId)
        : supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: currentUserId, reaction_type: "like" });
      const { error: reactionError } = await request;
      if (reactionError) throw reactionError;
      await loadEngagement();
    } catch (likeError) {
      setError(engagementErrorMessage(likeError, "load"));
    }
  }

  async function saveCommentEdit(commentId: string) {
    const content = editingText.trim();
    if (!content) return;
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const { error: updateError } = await supabase.from("comments").update({ content, edited_at: new Date().toISOString(), edit_count: 1 }).eq("id", commentId).eq("user_id", currentUserId).eq("edit_count", 0);
      if (updateError) throw updateError;
      setEditingCommentId(null);
      setEditingText("");
      await loadEngagement();
    } catch (editError) {
      setError(engagementErrorMessage(editError, "comment"));
    }
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Excluir este comentário?")) return;
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", currentUserId);
      if (deleteError) throw deleteError;
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      await loadEngagement();
    } catch (deleteError) {
      setError(engagementErrorMessage(deleteError, "comment"));
    }
  }

  return (
    <article className="border border-gray-800">
      {checkin.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={checkin.image_url} alt="" className="max-h-80 w-full object-cover" />
      ) : null}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3"><Link href={checkin.user_id ? `/users/${checkin.user_id}` : "#"} className="text-sm text-white hover:underline">@{name}</Link><p className="text-xs text-gray-400">{formatWhen(checkin.created_at)}</p></div>
        <p className="mt-2 text-xs text-gray-400">{checkin.hobby_tag ?? "Hobby"} · {formatMinutes(checkin.time_invested_minutes)}</p>
        {checkin.description ? <p className="mt-3 text-sm text-gray-400">{checkin.description}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-800 pt-4">
          <button type="button" onClick={() => void votePost("up")} className={`flex items-center gap-1 text-xs ${myVote === "up" ? "text-white" : "text-gray-500 hover:text-white"}`}><ArrowBigUp className="h-4 w-4" fill={myVote === "up" ? "currentColor" : "none"} strokeWidth={1.5} />{voteCounts.up}</button>
          <button type="button" onClick={() => void votePost("down")} className={`flex items-center gap-1 text-xs ${myVote === "down" ? "text-white" : "text-gray-500 hover:text-white"}`}><ArrowBigDown className="h-4 w-4" fill={myVote === "down" ? "currentColor" : "none"} strokeWidth={1.5} />{voteCounts.down}</button>
          {reactionOptions.map(({ type, label, emoji }) => <button key={type} type="button" onClick={() => void toggleReaction(type)} disabled={loading || reactionLoading !== null} aria-pressed={myReaction === type} className={`border px-2.5 py-1.5 text-xs transition-colors ${myReaction === type ? "border-white bg-white text-black" : "border-gray-800 text-gray-400 hover:border-gray-500 hover:text-white"}`}>{reactionLoading === type ? "..." : `${emoji} ${label} ${counts[type]}`}</button>)}
          <button type="button" onClick={() => setCommentsOpen((open) => !open)} className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />Comentários ({comments.length})</button>
          <button type="button" onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><Send className="h-3.5 w-3.5" strokeWidth={1.5} />Compartilhar</button>
        </div>
        {commentsOpen ? <div className="mt-4 border-t border-gray-800 pt-4">
          {loading ? <LoaderCircle className="mx-auto h-4 w-4 animate-spin text-gray-500" /> : comments.length === 0 ? <p className="text-sm text-gray-500">Nenhum comentário ainda.</p> : <div className="flex flex-col gap-3">{comments.map((comment) => <div key={comment.id} className="flex gap-2.5"><Link href={`/users/${comment.user_id}`} className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-800 bg-gray-900">{comment.profile?.avatar_url ? <span role="img" aria-label={`Avatar de ${displayName(comment.profile)}`} className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${comment.profile.avatar_url.replace(/"/g, "%22")}")` }} /> : null}</Link><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Link href={`/users/${comment.user_id}`} className="text-xs text-gray-400 hover:text-white hover:underline">@{displayName(comment.profile)}</Link>{comment.edited_at ? <span className="text-[10px] text-gray-600">editado</span> : null}</div>{editingCommentId === comment.id ? <div className="mt-1 flex gap-2"><input value={editingText} onChange={(event) => setEditingText(event.target.value)} maxLength={500} className="min-w-0 flex-1 border border-gray-800 bg-black px-2 py-1 text-sm text-white" /><button type="button" onClick={() => void saveCommentEdit(comment.id)} className="text-xs text-white">Salvar</button></div> : <p className="mt-0.5 break-words text-sm text-gray-200">{comment.content}</p>}<div className="mt-1 flex items-center gap-3"><button type="button" onClick={() => void toggleCommentLike(comment.id)} className={`flex items-center gap-1 text-xs ${likedComments.has(comment.id) ? "text-white" : "text-gray-600 hover:text-white"}`}><Heart className="h-3 w-3" fill={likedComments.has(comment.id) ? "currentColor" : "none"} />{commentLikes[comment.id] ?? 0}</button>{comment.user_id === currentUserId && !editingCommentId && comment.edit_count < 1 ? <button type="button" onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.content); }} className="text-xs text-gray-600 hover:text-white"><Pencil className="inline h-3 w-3" /> editar</button> : null}{comment.user_id === currentUserId ? <button type="button" onClick={() => void deleteComment(comment.id)} className="text-xs text-gray-600 hover:text-white"><Trash2 className="inline h-3 w-3" /> excluir</button> : null}</div></div></div>)}</div>}
          <form onSubmit={submitComment} className="mt-4 flex gap-2"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={500} placeholder="Escreva um comentário..." className="min-w-0 flex-1 border border-gray-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gray-500" /><button type="submit" disabled={commentLoading || !commentText.trim()} className="border border-white px-3 py-2 text-xs text-white hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-500">{commentLoading ? "..." : "Enviar"}</button></form>
        </div> : null}
        {error ? <p role="alert" className="mt-3 text-xs text-gray-500">{error}</p> : null}
      </div>
      {shareOpen ? <ShareCardModal checkin={checkin} onClose={() => setShareOpen(false)} /> : null}
    </article>
  );
}

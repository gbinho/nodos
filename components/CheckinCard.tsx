"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBigDown, ArrowBigUp, Heart, LoaderCircle, MessageCircle, Pencil, Pin, Share2, Trash2 } from "lucide-react";
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

type CheckinCardProps = {
  checkin: CheckinWithProfile;
  currentUserId: string;
  gallery?: boolean;
  showPin?: boolean;
  featuredCount?: number;
};

export function CheckinCard({ checkin, currentUserId, gallery = false, showPin = false, featuredCount = 0 }: CheckinCardProps) {
  const router = useRouter();
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
  const [featured, setFeatured] = useState(checkin.is_featured);
  const [pinLoading, setPinLoading] = useState(false);
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
        const { data: authorProfile } = await supabase
          .from("profiles")
          .select("username, avatar_url, email")
          .eq("id", currentUserId)
          .maybeSingle();
        setComments((current) => [
          ...current,
          { ...(insertedComment as CommentRow), profile: authorProfile },
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

  async function toggleFeatured() {
    setPinLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const { error: updateError } = await supabase.from("checkins").update({ is_featured: !featured }).eq("id", checkin.id).eq("user_id", currentUserId);
      if (updateError) throw updateError;
      setFeatured((current) => !current);
      router.refresh();
    } catch (pinError) {
      const message = pinError instanceof Error ? pinError.message : "Não foi possível atualizar o destaque.";
      setError(message.includes("featured_checkins_limit_reached") ? "Você já tem 3 destaques. Desfixe um para destacar este." : message);
    } finally {
      setPinLoading(false);
    }
  }

  return (
    <article className={`feed-card overflow-hidden rounded-2xl border bg-white shadow-[0_8px_30px_rgba(22,22,28,0.06)] ${featured ? "border-[#111114]" : "border-[#e4e5e9]"}`}>
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/nodes?tag=${encodeURIComponent(checkin.hobby_tag ?? "")}`} className="text-base font-semibold text-[#111114] hover:underline">
              #{checkin.hobby_tag ?? "Hobby"}
            </Link>
            {checkin.description ? <p className="mt-1 line-clamp-2 text-sm font-medium text-[#555760]">{checkin.description}</p> : null}
          </div>
          <span className="shrink-0 text-xs text-[#8b8d96]">{formatMinutes(checkin.time_invested_minutes)}</span>
        </div>
      </div>
      {checkin.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <div className={`mt-4 flex items-center justify-center overflow-hidden bg-black/5 ${gallery ? "h-52" : "max-h-[450px] min-h-40"}`}>
          <img src={checkin.image_url} alt="" className={`${gallery ? "h-full" : "max-h-[450px]"} w-full object-contain transition-transform duration-500 hover:scale-[1.01]`} />
        </div>
      ) : null}
      <div className={gallery ? "p-4" : "p-5"}>
        <div className="flex items-baseline justify-between gap-3"><Link href={checkin.user_id ? `/users/${checkin.user_id}` : "#"} className="text-sm font-medium text-[#111114] hover:underline">@{name}</Link><p className="text-xs text-[#8b8d96]">{formatWhen(checkin.created_at)}</p></div>
        {showPin ? <button type="button" onClick={() => void toggleFeatured()} disabled={pinLoading || (!featured && featuredCount >= 3)} className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all active:scale-95 ${featured ? "border-[#111114] bg-[#111114] text-white" : "border-[#d7d8dd] text-[#111114] hover:border-[#111114]"}`}><Pin className="h-3.5 w-3.5" fill={featured ? "currentColor" : "none"} />{pinLoading ? "..." : featured ? "Desfixar" : "Fixar"}</button> : null}
        {gallery ? <div className="mt-3 flex items-center justify-between border-t border-[#ececf0] pt-3 text-xs text-[#71737c]"><span>{checkin.description ? checkin.description.slice(0, 48) : "Progresso registrado"}</span>{featured ? <Pin className="h-3.5 w-3.5 text-[#111114]" fill="currentColor" /> : null}</div> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#ececf0] pt-4">
          <button type="button" onClick={() => void votePost("up")} className={`inline-flex min-w-12 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-200 active:scale-95 ${myVote === "up" ? "border-red-500 bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)]" : "border-[#d7d8dd] text-[#111114] hover:border-red-400 hover:text-red-500"}`}><ArrowBigUp className="h-4 w-4" fill={myVote === "up" ? "currentColor" : "none"} strokeWidth={1.8} />{voteCounts.up}</button>
          <button type="button" onClick={() => void votePost("down")} className={`inline-flex min-w-12 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-200 active:scale-95 ${myVote === "down" ? "border-[#111114] bg-[#111114] text-white" : "border-[#d7d8dd] text-[#111114] hover:border-[#111114]"}`}><ArrowBigDown className="h-4 w-4" fill={myVote === "down" ? "currentColor" : "none"} strokeWidth={1.8} />{voteCounts.down}</button>
          {reactionOptions.map(({ type, label, emoji }) => <button key={type} type="button" title={label} aria-label={`${label}: ${counts[type]}`} onClick={() => void toggleReaction(type)} disabled={loading || reactionLoading !== null} aria-pressed={myReaction === type} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-90 ${myReaction === type ? "border-[#111114] bg-[#111114]" : "border-[#d7d8dd] hover:border-[#111114]"}`}>{reactionLoading === type ? "..." : emoji}</button>)}
          <button type="button" title="Comentários" aria-label={`Comentários: ${comments.length}`} onClick={() => setCommentsOpen((open) => !open)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#111114] px-2.5 text-xs text-[#111114] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"><MessageCircle className="h-4 w-4" strokeWidth={1.7} />{comments.length}</button>
          <button type="button" title="Compartilhar" aria-label="Compartilhar" onClick={() => setShareOpen(true)} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#111114] text-[#111114] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"><Share2 className="h-4 w-4" strokeWidth={1.7} /></button>
        </div>
        {commentsOpen ? <div className="mt-4 border-t border-gray-800 pt-4">
          {loading ? <LoaderCircle className="mx-auto h-4 w-4 animate-spin text-gray-500" /> : comments.length === 0 ? <p className="text-sm text-gray-500">Nenhum comentário ainda.</p> : <div className="flex flex-col gap-3">{comments.map((comment) => <div key={comment.id} className="flex gap-2.5"><Link href={`/users/${comment.user_id}`} className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-300 bg-gray-100">{comment.profile?.avatar_url ? <><span className="sr-only">Avatar de {displayName(comment.profile)}</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={comment.profile.avatar_url} alt="" className="h-full w-full object-cover" /></> : null}</Link><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Link href={`/users/${comment.user_id}`} className="text-xs text-[#555760] hover:text-[#111114] hover:underline">@{displayName(comment.profile)}</Link>{comment.edited_at ? <span className="text-[10px] text-gray-500">editado</span> : null}</div>{editingCommentId === comment.id ? <div className="mt-1 flex gap-2"><input value={editingText} onChange={(event) => setEditingText(event.target.value)} maxLength={500} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-[#111114]" /><button type="button" onClick={() => void saveCommentEdit(comment.id)} className="rounded-lg bg-[#111114] px-2.5 py-1 text-xs text-white transition-transform active:scale-95">Salvar</button></div> : <p className="mt-0.5 break-words text-sm text-[#111114]">{comment.content}</p>}<div className="mt-1 flex items-center gap-3"><button type="button" onClick={() => void toggleCommentLike(comment.id)} className={`flex items-center gap-1 text-xs transition-colors ${likedComments.has(comment.id) ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}><Heart className="h-3 w-3" fill={likedComments.has(comment.id) ? "currentColor" : "none"} />{commentLikes[comment.id] ?? 0}</button>{comment.user_id === currentUserId && !editingCommentId && comment.edit_count < 1 ? <button type="button" onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.content); }} className="text-xs text-gray-500 transition-colors hover:text-[#111114]"><Pencil className="inline h-3 w-3" /> editar</button> : null}{comment.user_id === currentUserId ? <button type="button" onClick={() => void deleteComment(comment.id)} className="text-xs text-gray-500 transition-colors hover:text-red-500"><Trash2 className="inline h-3 w-3" /> excluir</button> : null}</div></div></div>)}</div>}
          <form onSubmit={submitComment} className="mt-4 flex gap-2"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={500} placeholder="Escreva um comentário..." className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#111114] outline-none placeholder:text-gray-400 focus:border-[#111114]" /><button type="submit" disabled={commentLoading || !commentText.trim()} className="rounded-lg bg-[#111114] px-3 py-2 text-xs text-white transition-all duration-200 hover:bg-[#2a2b31] active:scale-95 disabled:bg-gray-200 disabled:text-gray-500">{commentLoading ? "..." : "Enviar"}</button></form>
        </div> : null}
        {error ? <p role="alert" className="mt-3 text-xs text-gray-500">{error}</p> : null}
      </div>
      {shareOpen ? <ShareCardModal checkin={checkin} onClose={() => setShareOpen(false)} /> : null}
    </article>
  );
}

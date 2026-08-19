"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKIN_BUCKET, HOBBY_TAGS, TIME_MAX, TIME_MIN } from "@/lib/constants";
import { createSupabaseClient } from "@/lib/supabase";

type CheckInModalProps = {
  userId: string;
  currentXp: number;
  onClose: () => void;
};

export function CheckInModal({ userId, currentXp, onClose }: CheckInModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [hobbyTag, setHobbyTag] = useState<(typeof HOBBY_TAGS)[number]>(HOBBY_TAGS[0]);
  const [minutes, setMinutes] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      let imageUrl: string | null = null;

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Imagem deve ter no máximo 5 MB.");
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(CHECKIN_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(CHECKIN_BUCKET).getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase.from("checkins").insert({
        user_id: userId,
        hobby_tag: hobbyTag,
        description: description.trim() || null,
        image_url: imageUrl,
        time_invested_minutes: minutes,
      });

      if (insertError) throw insertError;

      const { error: xpError } = await supabase
        .from("profiles")
        .update({ total_xp: currentXp + minutes })
        .eq("id", userId);

      if (xpError) throw xpError;

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o check-in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md border border-gray-800 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium">Novo check-in</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-400 hover:text-white">
            Fechar
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-gray-400">Imagem</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-400 file:mr-3 file:border file:border-gray-800 file:bg-black file:px-3 file:py-1 file:text-sm file:text-white"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-gray-400">Descrição</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
              placeholder="O que você fez hoje?"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-gray-400">Hobby</span>
            <select
              value={hobbyTag}
              onChange={(e) => setHobbyTag(e.target.value as (typeof HOBBY_TAGS)[number])}
              className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
            >
              {HOBBY_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="flex justify-between text-gray-400">
              Tempo investido
              <span className="text-white">{minutes} min</span>
            </span>
            <input
              type="range"
              min={TIME_MIN}
              max={TIME_MAX}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="accent-white"
            />
          </label>

          {error ? <p className="text-sm text-gray-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="border border-white px-3 py-2 text-sm hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-400"
          >
            {loading ? "Salvando…" : "Salvar check-in"}
          </button>
        </form>
      </div>
    </div>
  );
}

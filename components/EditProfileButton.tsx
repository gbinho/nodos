"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ProfileRow } from "@/lib/database.types";
import { createSupabaseClient } from "@/lib/supabase";
import { isSpotifyUrl } from "@/lib/spotify";

type EditProfileButtonProps = {
  profile: ProfileRow;
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isDirectGifUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.pathname.toLowerCase().endsWith(".gif");
  } catch {
    return false;
  }
}

function getSaveErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    if (code === "42703") {
      return "As colunas de personalização ainda não existem no Supabase. Execute a migration 20260820170000_profile_personalization.sql.";
    }
    if (code === "42501") {
      return "O Supabase bloqueou a alteração. Verifique a policy profiles_update_own para o usuário logado.";
    }
    if (code === "23505") return "Este username já está em uso. Escolha outro.";
  }

  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível salvar o perfil.";
}

export function EditProfileButton({ profile }: EditProfileButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState(profile.spotify_url ?? "");
  const [bgGifUrl, setBgGifUrl] = useState(profile.bg_gif_url ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close() {
    if (saving) return;
    setOpen(false);
    setError(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanSpotifyUrl = spotifyUrl.trim();
    const cleanBgGifUrl = bgGifUrl.trim();
    const cleanUsername = username.trim().replace(/^@+/, "").toLowerCase();
    const cleanAvatarUrl = avatarUrl.trim();
    if (!cleanUsername) {
      setError("Informe um username.");
      return;
    }
    if (!isSpotifyUrl(cleanSpotifyUrl)) {
      setError("Cole um link de música, playlist, álbum, episódio ou show do Spotify.");
      return;
    }
    if (!isDirectGifUrl(cleanBgGifUrl)) {
      setError("Use o link direto do arquivo GIF, terminando em .gif. Links de páginas do Giphy/Tenor não funcionam como imagem.");
      return;
    }
    if (cleanAvatarUrl && !isHttpUrl(cleanAvatarUrl)) {
      setError("Informe uma URL válida para a foto de perfil.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          avatar_url: cleanAvatarUrl || null,
          spotify_url: cleanSpotifyUrl || null,
          bg_gif_url: cleanBgGifUrl || null,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(getSaveErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-800 px-3 py-2 text-xs text-gray-400 hover:border-gray-500 hover:text-white"
      >
        <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
        Editar perfil
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" className="w-full max-w-md border border-gray-800 bg-black p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="edit-profile-title" className="text-lg font-medium">Editar perfil</h2>
              <button type="button" onClick={close} aria-label="Fechar" className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={save} className="flex flex-col gap-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-400">Nome de usuário</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} maxLength={40} placeholder="seu_nome" className="border border-gray-800 bg-black px-3 py-2 text-white outline-none placeholder:text-gray-600 focus:border-gray-400" />
                <span className="text-xs text-gray-600">Será exibido como @{username.replace(/^@+/, "") || "seu_nome"}.</span>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-400">Foto de perfil (URL)</span>
                <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://.../avatar.jpg" className="border border-gray-800 bg-black px-3 py-2 text-white outline-none placeholder:text-gray-600 focus:border-gray-400" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-400">URL do Spotify</span>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(event) => setSpotifyUrl(event.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="border border-gray-800 bg-black px-3 py-2 text-white outline-none placeholder:text-gray-600 focus:border-gray-400"
                />
                <span className="text-xs text-gray-600">Aceita músicas, playlists, álbuns, episódios e shows.</span>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-gray-400">URL do GIF de fundo</span>
                <input
                  type="url"
                  value={bgGifUrl}
                  onChange={(event) => setBgGifUrl(event.target.value)}
                  placeholder="https://media.giphy.com/.../arquivo.gif"
                  className="border border-gray-800 bg-black px-3 py-2 text-white outline-none placeholder:text-gray-600 focus:border-gray-400"
                />
                <span className="text-xs text-gray-600">Use uma URL direta terminada em .gif, não o link da página do Giphy/Tenor.</span>
              </label>
              {error ? <p className="text-sm text-gray-400">{error}</p> : null}
              <button type="submit" disabled={saving} className="border border-white px-3 py-2 text-sm hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-500">
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
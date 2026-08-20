"use client";

import { useState } from "react";
import { AlertTriangle, Download, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ProfileRow } from "@/lib/database.types";
import { createSupabaseClient } from "@/lib/supabase";

type AccountSettingsProps = {
  profile: ProfileRow;
  authEmail: string | null;
};

function validUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function AccountSettings({ profile, authEmail }: AccountSettingsProps) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [emailPublic, setEmailPublic] = useState(profile.email_public);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    const cleanUsername = username.trim();
    const cleanAvatarUrl = avatarUrl.trim();
    if (!cleanUsername) {
      setError("Informe um username.");
      return;
    }
    if (!validUrl(cleanAvatarUrl)) {
      setError("Informe uma URL válida para o avatar.");
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
          email_public: emailPublic,
        })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      setStatus("Configurações salvas.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    setExporting(true);
    setStatus(null);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const [{ data: profileData, error: profileError }, { data: checkins, error: checkinsError }, { data: comments, error: commentsError }, { data: userBadges, error: badgesError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profile.id).single(),
        supabase.from("checkins").select("*").eq("user_id", profile.id).order("created_at", { ascending: true }),
        supabase.from("comments").select("*").eq("user_id", profile.id).order("created_at", { ascending: true }),
        supabase.from("user_badges").select("*").eq("user_id", profile.id).order("unlocked_at", { ascending: true }),
      ]);
      const queryError = profileError ?? checkinsError ?? commentsError ?? badgesError;
      if (queryError) throw queryError;

      const exportPayload = {
        exported_at: new Date().toISOString(),
        user_id: profile.id,
        profile: profileData,
        checkins: checkins ?? [],
        comments: comments ?? [],
        user_badges: userBadges ?? [],
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "meus-dados-hobbies.json";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Seus dados foram exportados.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Não foi possível exportar seus dados.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (deleteText !== "DELETAR") return;
    setDeleting(true);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const { error: deleteError } = await supabase.from("profiles").delete().eq("id", profile.id);
      if (deleteError) throw deleteError;
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir sua conta.");
      setDeleting(false);
    }
  }

  return (
    <>
      <main className="mx-auto flex max-w-3xl flex-col gap-10">
        <header>
          <p className="text-xs tracking-[0.22em] text-gray-500">CONTA</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">Configurações</h1>
          <p className="mt-2 text-sm text-gray-400">Gerencie seus dados, identidade e privacidade.</p>
        </header>

        <section className="border border-gray-800 bg-gray-950 p-6">
          <div className="mb-6"><p className="text-xs tracking-[0.18em] text-gray-500">PERFIL</p><h2 className="mt-2 text-xl font-medium">Sua identidade</h2></div>
          <form onSubmit={saveProfile} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm"><span className="text-gray-400">Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} maxLength={40} className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-500" /></label>
            <label className="flex flex-col gap-2 text-sm"><span className="text-gray-400">URL do avatar</span><input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." className="border border-gray-800 bg-black px-3 py-2 text-white outline-none placeholder:text-gray-600 focus:border-gray-500" /></label>
            <div className="border-t border-gray-800 pt-5"><p className="text-sm text-gray-300">E-mail da conta</p><p className="mt-1 text-sm text-gray-500">{authEmail ?? "E-mail não informado"}</p><label className="mt-4 flex items-start gap-3 text-sm text-gray-400"><input type="checkbox" checked={emailPublic} onChange={(event) => setEmailPublic(event.target.checked)} className="mt-0.5 accent-white" />Mostrar meu e-mail no perfil público</label></div>
            <button type="submit" disabled={saving} className="flex w-fit items-center gap-2 border border-white px-4 py-2.5 text-sm hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-500"><Save className="h-4 w-4" strokeWidth={1.5} />{saving ? "Salvando..." : "Salvar alterações"}</button>
          </form>
        </section>

        <section className="border border-gray-800 p-6"><p className="text-xs tracking-[0.18em] text-gray-500">PRIVACIDADE</p><h2 className="mt-2 text-xl font-medium">Seus dados</h2><p className="mt-2 max-w-xl text-sm text-gray-400">Baixe uma cópia dos dados associados à sua conta em um arquivo JSON.</p><button type="button" onClick={() => void exportData()} disabled={exporting} className="mt-5 flex items-center gap-2 border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:border-gray-400 hover:text-white disabled:text-gray-600"><Download className="h-4 w-4" strokeWidth={1.5} />{exporting ? "Preparando arquivo..." : "Exportar meus dados (JSON)"}</button></section>

        {status ? <p role="status" className="text-sm text-gray-400">{status}</p> : null}
        {error ? <p role="alert" className="text-sm text-gray-400">{error}</p> : null}

        <section className="border border-red-950 bg-red-950/10 p-6"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" strokeWidth={1.5} /><div><p className="text-xs tracking-[0.18em] text-red-300/70">ZONA PERIGOSA</p><h2 className="mt-2 text-xl font-medium text-red-100">Excluir conta</h2><p className="mt-2 text-sm text-red-100/60">Essa ação remove seu perfil e os dados relacionados. Não pode ser desfeita.</p><button type="button" onClick={() => setDeleteOpen(true)} className="mt-5 flex items-center gap-2 border border-red-900 px-4 py-2.5 text-sm text-red-200 hover:border-red-400 hover:text-white"><Trash2 className="h-4 w-4" strokeWidth={1.5} />Excluir minha conta</button></div></div></section>
      </main>

      {deleteOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"><div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md border border-red-900 bg-black p-6"><h2 id="delete-title" className="text-lg font-medium text-red-100">Confirmar exclusão</h2><p className="mt-3 text-sm text-gray-400">Digite <strong className="text-white">DELETAR</strong> para confirmar a exclusão da conta.</p><input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoFocus className="mt-5 w-full border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-red-700" /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setDeleteOpen(false); setDeleteText(""); }} disabled={deleting} className="border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button><button type="button" onClick={() => void deleteAccount()} disabled={deleting || deleteText !== "DELETAR"} className="border border-red-800 px-3 py-2 text-sm text-red-200 hover:bg-red-950 disabled:border-gray-800 disabled:text-gray-600">{deleting ? "Excluindo..." : "Confirmar exclusão"}</button></div></div></div> : null}
    </>
  );
}
"use client";

import { useRef, useState } from "react";
import { Download, Image as ImageIcon, Link2, X } from "lucide-react";
import { toBlob, toPng } from "html-to-image";
import { displayName, type CheckinWithProfile } from "@/lib/checkins";
import { xpForMinutes } from "@/lib/constants";

type ShareCardModalProps = {
  checkin: CheckinWithProfile;
  onClose: () => void;
};

function formatStoryMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m investidos`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${rest ? ` ${rest}m` : ""} investidos`;
}

export function ShareCardModal({ checkin, onClose }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const name = displayName(checkin.profiles);
  const xp = xpForMinutes(checkin.time_invested_minutes);

  async function renderPng() {
    if (!cardRef.current) throw new Error("Card indisponível.");
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, width: 540, height: 960 });
  }

  async function downloadImage() {
    setBusy("download");
    setMessage(null);
    try {
      const dataUrl = await renderPng();
      const link = document.createElement("a");
      link.download = `nodos-checkin-${checkin.id}.png`;
      link.href = dataUrl;
      link.click();
      setMessage("Imagem baixada.");
    } catch {
      setMessage("Não foi possível gerar a imagem. Verifique se a foto permite compartilhamento.");
    } finally {
      setBusy(null);
    }
  }

  async function copyImage() {
    setBusy("copy");
    setMessage(null);
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard de imagem indisponível.");
      }
      if (!cardRef.current) throw new Error("Card indisponível.");
      const blob = await toBlob(cardRef.current, { cacheBust: true, pixelRatio: 2, width: 540, height: 960 });
      if (!blob) throw new Error("Não foi possível criar a imagem.");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setMessage("Imagem copiada para a área de transferência.");
    } catch {
      setMessage("Não foi possível copiar. Tente baixar a imagem.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-5 py-4">
        <div className="flex w-full items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-gray-500">COMPARTILHAR</p>
            <h2 className="mt-1 text-lg font-medium">Card para Stories</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div
          ref={cardRef}
          className="relative flex aspect-[9/16] w-[min(76vw,270px)] flex-col overflow-hidden border border-gray-800 bg-black text-white"
        >
          {checkin.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={checkin.image_url} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/70 to-black" />
          <div className="relative flex h-full flex-col p-6">
            <div className="flex items-center justify-between text-[10px] tracking-[0.2em] text-gray-400">
              <span>NODOS</span>
              <span>CHECK-IN</span>
            </div>
            <div className="mt-auto">
              <p className="text-xs text-gray-400">{name}</p>
              <h3 className="mt-3 break-words text-2xl font-medium leading-tight">#{checkin.hobby_tag ?? "Hobby"}</h3>
              <p className="mt-5 text-xl font-medium">{formatStoryMinutes(checkin.time_invested_minutes)}</p>
              {checkin.description ? <p className="mt-4 max-h-24 overflow-hidden text-sm leading-relaxed text-gray-300">{checkin.description}</p> : null}
              <div className="mt-6 inline-flex items-center gap-2 border border-gray-500 px-3 py-2 text-xs text-gray-200">
                <span>+{xp} XP</span>
                <span className="text-gray-500">/</span>
                <span>progresso registrado</span>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-gray-700 pt-4 text-[9px] tracking-[0.16em] text-gray-500">
              <span>TRACK YOUR CRAFT</span>
              <span>nodos.app</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-2">
          <button type="button" onClick={() => void downloadImage()} disabled={busy !== null} className="flex items-center gap-2 border border-white px-4 py-2.5 text-sm hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-500">
            <Download className="h-4 w-4" strokeWidth={1.5} />
            {busy === "download" ? "Gerando..." : "Baixar imagem"}
          </button>
          <button type="button" onClick={() => void copyImage()} disabled={busy !== null} className="flex items-center gap-2 border border-gray-800 px-4 py-2.5 text-sm text-gray-300 hover:border-gray-500 hover:text-white disabled:text-gray-600">
            <Link2 className="h-4 w-4" strokeWidth={1.5} />
            {busy === "copy" ? "Copiando..." : "Copiar imagem"}
          </button>
        </div>
        {message ? <p role="status" className="flex items-center gap-2 text-xs text-gray-400"><ImageIcon className="h-3.5 w-3.5" />{message}</p> : null}
      </div>
    </div>
  );
}
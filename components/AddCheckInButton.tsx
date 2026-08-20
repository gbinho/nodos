"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInModal } from "@/components/CheckInModal";

export function AddCheckInButton({ userId, currentXp, className, compact = false }: { userId: string; currentXp: number; className?: string; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function handleSaved(xpGained: number) {
    setToast(`Check-in salvo. +${xpGained} XP`);
    router.refresh();
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "w-full rounded-xl border border-[#111114] bg-[#111114] py-3.5 text-sm font-medium tracking-wide text-white transition hover:bg-[#2a2b31]"}
      >
        {compact ? "+" : "[+ Adicionar Check-in]"}
      </button>
      {open ? (
        <CheckInModal
          userId={userId}
          currentXp={currentXp}
          onClose={() => setOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
      {toast ? (
        <div role="status" className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#111114] bg-[#111114] px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </>
  );
}

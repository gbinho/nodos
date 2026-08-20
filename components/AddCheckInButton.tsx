"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInModal } from "@/components/CheckInModal";

export function AddCheckInButton({ userId, currentXp }: { userId: string; currentXp: number }) {
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
        className="w-full border border-white py-4 text-sm tracking-wide hover:bg-white hover:text-black"
      >
        [+ Adicionar Check-in]
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
        <div role="status" className="fixed bottom-6 right-6 z-50 border border-white bg-black px-4 py-3 text-sm text-white">
          {toast}
        </div>
      ) : null}
    </>
  );
}

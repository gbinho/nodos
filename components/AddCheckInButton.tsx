"use client";

import { useState } from "react";
import { CheckInModal } from "@/components/CheckInModal";

export function AddCheckInButton({ userId, currentXp }: { userId: string; currentXp: number }) {
  const [open, setOpen] = useState(false);

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
        <CheckInModal userId={userId} currentXp={currentXp} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

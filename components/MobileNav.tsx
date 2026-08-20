"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Search, User } from "lucide-react";
import { AddCheckInButton } from "@/components/AddCheckInButton";

export function MobileNav({ userId, currentXp }: { userId: string; currentXp: number }) {
  const pathname = usePathname();
  const linkClass = (href: string) => `flex flex-col items-center gap-1 text-[10px] ${pathname === href ? "text-white" : "text-gray-500"}`;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-end justify-around border-t border-zinc-800 bg-black/90 px-4 pb-3 pt-2 backdrop-blur-md md:hidden">
      <Link href="/" className={linkClass("/")}><House className="h-5 w-5" strokeWidth={1.7} />Home</Link>
      <Link href="/nodes" className={linkClass("/nodes")}><Compass className="h-5 w-5" strokeWidth={1.7} />Nodes</Link>
      <AddCheckInButton userId={userId} currentXp={currentXp} compact className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#f7f8fa] bg-[#111114] p-0 text-2xl font-light text-white shadow-xl transition-transform active:scale-90" />
      <Link href="/search" className={linkClass("/search")}><Search className="h-5 w-5" strokeWidth={1.7} />Buscar</Link>
      <Link href="/profile" className={linkClass("/profile")}><User className="h-5 w-5" strokeWidth={1.7} />Perfil</Link>
    </nav>
  );
}
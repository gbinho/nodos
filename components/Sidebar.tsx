"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, House, LogOut, Search, Settings, Sparkles, User } from "lucide-react";
import type { ProfileRow } from "@/lib/database.types";
import { createSupabaseClient } from "@/lib/supabase";
import { displayName } from "@/lib/checkins";

type SidebarProps = {
  profile: ProfileRow | null;
};

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const name = displayName(profile);

  async function logout() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-5 left-5 z-40 hidden w-56 flex-col rounded-[28px] bg-[#101114] px-4 py-6 text-white md:flex lg:inset-y-7 lg:left-7 lg:min-h-[calc(100vh-3.5rem)] lg:rounded-l-[28px] lg:rounded-r-none">
      <Link href="/" className="px-3 text-lg font-semibold tracking-[-0.06em] text-white">
        nodos<span className="text-white">.</span>
      </Link>

      <Link href="/" className="mt-9 flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-xs font-medium text-[#111114] transition hover:bg-gray-200">
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        Novo check-in
      </Link>

      <p className="mb-2 mt-9 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">Workspace</p>
      <nav className="flex flex-col gap-1.5">
        <Link href="/" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${pathname === "/" ? "bg-[#202229] text-white" : "text-gray-400 hover:bg-[#1a1b20] hover:text-white"}`}>
          <House className="h-4 w-4" strokeWidth={1.7} />
          Home
        </Link>
        <Link href="/nodes" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${pathname === "/nodes" ? "bg-[#202229] text-white" : "text-gray-400 hover:bg-[#1a1b20] hover:text-white"}`}>
          <Compass className="h-4 w-4" strokeWidth={1.7} />
          Explorar Nodes
        </Link>
        <Link href="/search" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${pathname === "/search" ? "bg-[#202229] text-white" : "text-gray-400 hover:bg-[#1a1b20] hover:text-white"}`}>
          <Search className="h-4 w-4" strokeWidth={1.7} />
          Buscar pessoas
        </Link>
      </nav>

      <p className="mb-2 mt-8 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">Você</p>
      <nav className="flex flex-col gap-1.5">
        <Link href="/profile" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${pathname === "/profile" ? "bg-[#202229] text-white" : "text-gray-400 hover:bg-[#1a1b20] hover:text-white"}`}>
          <User className="h-4 w-4" strokeWidth={1.7} />
          Meu perfil
        </Link>
        <Link href="/settings" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${pathname === "/settings" ? "bg-[#202229] text-white" : "text-gray-400 hover:bg-[#1a1b20] hover:text-white"}`}>
          <Settings className="h-4 w-4" strokeWidth={1.7} />
          Configurações
        </Link>
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="mb-4 flex items-center gap-3 px-2">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#202229]">
            <User className="h-4 w-4 text-gray-400" strokeWidth={1.25} />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-white">@{name}</p>
          <p className="text-[11px] text-gray-500">{profile?.total_xp ?? 0} XP</p>
        </div>
      </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition hover:bg-[#1a1b20] hover:text-white"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        Sair da conta
      </button>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
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
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-800 px-5 py-8">
      <Link href="/" className="text-xs tracking-[0.28em] text-white">
        NODOS
      </Link>

      <div className="mt-10 flex items-center gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-10 w-10 rounded-full border border-gray-800 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-800">
            <User className="h-4 w-4 text-gray-400" strokeWidth={1.25} />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{name}</p>
          <p className="text-xs text-gray-400">{profile?.total_xp ?? 0} XP</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-col gap-3">
        <Link
          href="/"
          className={pathname === "/" ? "text-sm text-white" : "text-sm text-gray-400 hover:text-white"}
        >
          Home (Feed)
        </Link>
        <Link
          href="/profile"
          className={
            pathname === "/profile" ? "text-sm text-white" : "text-sm text-gray-400 hover:text-white"
          }
        >
          Meu Perfil
        </Link>
        <Link
          href="/nodes"
          className={pathname === "/nodes" ? "text-sm text-white" : "text-sm text-gray-400 hover:text-white"}
        >
          Explorar Nodes
        </Link>
        <Link
          href="/settings"
          className={pathname === "/settings" ? "text-sm text-white" : "text-sm text-gray-400 hover:text-white"}
        >
          Configurações
        </Link>
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-auto flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        Sair
      </button>
    </aside>
  );
}

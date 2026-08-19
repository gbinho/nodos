import { User } from "lucide-react";
import type { Profile } from "@/lib/profile";

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <header className="flex items-center gap-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-gray-800">
        <User className="h-8 w-8 text-gray-400" strokeWidth={1.25} />
      </div>
      <div>
        <h1 className="text-2xl font-medium tracking-tight">{profile.displayName}</h1>
        <p className="mt-1 text-sm text-gray-400">{profile.subtitle}</p>
        <p className="mt-3 text-sm text-gray-400">
          {profile.xp} XP • Nível {profile.level}
        </p>
        <p className="mt-0.5 text-sm text-gray-400">{profile.rank ?? "Sem patente"}</p>
      </div>
    </header>
  );
}

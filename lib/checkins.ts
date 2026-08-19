import type { CheckinRow, ProfileRow } from "@/lib/database.types";

export type CheckinWithProfile = CheckinRow & {
  profiles: Pick<ProfileRow, "username" | "avatar_url" | "email"> | null;
};

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function displayName(profile: Pick<ProfileRow, "username" | "email"> | null) {
  return profile?.username || profile?.email?.split("@")[0] || "usuário";
}

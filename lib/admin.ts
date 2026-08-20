import type { ProfileRow } from "@/lib/database.types";

export function isAdmin(user: Pick<ProfileRow, "username" | "is_admin"> | null | undefined) {
  return Boolean(user?.is_admin || user?.username?.toLowerCase() === "gabriel");
}

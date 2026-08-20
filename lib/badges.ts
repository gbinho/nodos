import type { BadgeRow, CheckinRow, UserBadgeRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function getCurrentStreak(checkins: Pick<CheckinRow, "created_at">[]) {
  const activeDays = new Set(checkins.map((checkin) => dateKey(new Date(checkin.created_at))));
  const today = new Date();
  let streak = 0;
  const startOffset = activeDays.has(dateKey(today)) ? 0 : -1;

  for (let offset = startOffset; activeDays.has(dateKey(addDays(today, offset))); offset -= 1) {
    streak += 1;
  }

  return streak;
}

export async function checkAndAwardBadges(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const [{ data: profile }, { data: checkins }, { data: badges }, { data: ownedBadges }] = await Promise.all([
    supabase.from("profiles").select("total_xp").eq("id", userId).maybeSingle(),
    supabase.from("checkins").select("created_at, time_invested_minutes").eq("user_id", userId),
    supabase.from("badges").select("*").order("req_value", { ascending: true }),
    supabase.from("user_badges").select("*").eq("user_id", userId),
  ]);

  const userCheckins = (checkins ?? []) as Pick<CheckinRow, "created_at" | "time_invested_minutes">[];
  const availableBadges = (badges ?? []) as BadgeRow[];
  const unlocked = (ownedBadges ?? []) as UserBadgeRow[];
  const unlockedIds = new Set(unlocked.map((badge) => badge.badge_id));
  const progress = {
    checkins_count: userCheckins.length,
    total_hours: userCheckins.reduce((total, checkin) => total + checkin.time_invested_minutes, 0) / 60,
    streak_days: getCurrentStreak(userCheckins),
    total_xp: profile?.total_xp ?? 0,
  };
  const eligible = availableBadges.filter(
    (badge) => !unlockedIds.has(badge.id) && progress[badge.req_type] >= badge.req_value,
  );

  if (eligible.length === 0) return [];

  const { data: inserted, error } = await supabase
    .from("user_badges")
    .insert(eligible.map((badge) => ({ user_id: userId, badge_id: badge.id })))
    .select("*");

  if (error) return [];
  return (inserted ?? []) as UserBadgeRow[];
}
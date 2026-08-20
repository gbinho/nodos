import { createSupabaseServerClient } from "@/lib/supabase-server";
import { HobbyHeatmapClient } from "@/components/HobbyHeatmapClient";
import type { CheckinRow } from "@/lib/database.types";

type HobbyHeatmapProps = {
  userId: string;
};

export async function HobbyHeatmap({ userId }: HobbyHeatmapProps) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("checkins")
    .select("created_at, time_invested_minutes")
    .eq("user_id", userId);

  return <HobbyHeatmapClient checkins={(data ?? []) as Pick<CheckinRow, "created_at" | "time_invested_minutes">[]} error={error?.message ?? null} />;
}
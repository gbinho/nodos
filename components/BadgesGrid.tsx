import { Footprints, Flame, LockKeyhole, Timer, Trophy } from "lucide-react";
import type { BadgeRow, UserBadgeRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const icons = { footprints: Footprints, flame: Flame, timer: Timer, trophy: Trophy } as const;

function formatUnlockedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export async function BadgesGrid({ userId }: { userId: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: badges, error: badgesError }, { data: userBadges, error: userBadgesError }] = await Promise.all([
    supabase.from("badges").select("*").order("req_value", { ascending: true }),
    supabase.from("user_badges").select("*").eq("user_id", userId),
  ]);

  if (badgesError || userBadgesError) {
    return (
      <section className="border border-gray-800 p-6">
        <p className="text-xs tracking-[0.18em] text-gray-500">CONQUISTAS</p>
        <p className="mt-4 text-sm text-gray-400">Execute a migration de badges para ativar suas conquistas.</p>
      </section>
    );
  }

  const unlockedByBadge = new Map(
    ((userBadges ?? []) as UserBadgeRow[]).map((badge) => [badge.badge_id, badge.unlocked_at]),
  );

  return (
    <section className="border border-gray-800 bg-gray-950 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-gray-500">CONQUISTAS</p>
          <h2 className="mt-2 text-xl font-medium">Badges desbloqueáveis</h2>
        </div>
        <p className="text-sm text-gray-500">{unlockedByBadge.size}/{badges?.length ?? 0}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {((badges ?? []) as BadgeRow[]).map((badge) => {
          const unlockedAt = unlockedByBadge.get(badge.id);
          const Icon = icons[badge.icon_name as keyof typeof icons] ?? Trophy;
          return (
            <article
              key={badge.id}
              title={unlockedAt ? `Conquistado em ${formatUnlockedAt(unlockedAt)}` : `${badge.title}: ${badge.description}`}
              className={`relative border p-4 ${unlockedAt ? "border-gray-500 bg-gray-900" : "border-gray-800 opacity-30 grayscale"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon className="h-6 w-6 text-gray-200" strokeWidth={1.35} />
                {!unlockedAt ? <LockKeyhole className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.5} /> : null}
              </div>
              <h3 className="mt-5 text-sm font-medium text-gray-200">{badge.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{badge.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
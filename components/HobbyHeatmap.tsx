import { createSupabaseServerClient } from "@/lib/supabase-server";

type HobbyHeatmapProps = {
  userId: string;
};

type DayCell = {
  date: Date;
  key: string;
  minutes: number;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function cellClass(minutes: number) {
  if (minutes === 0) return "border border-gray-800 bg-gray-900";
  if (minutes <= 30) return "bg-gray-700";
  if (minutes <= 60) return "bg-gray-400";
  return "bg-white";
}

function currentStreak(activeDays: Set<string>, today: Date) {
  const todayKey = dateKey(today);
  const startOffset = activeDays.has(todayKey) ? 0 : -1;
  let streak = 0;

  for (let offset = startOffset; activeDays.has(dateKey(addDays(today, offset))); offset -= 1) {
    streak += 1;
  }

  return streak;
}

export async function HobbyHeatmap({ userId }: HobbyHeatmapProps) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("checkins")
    .select("created_at, time_invested_minutes")
    .eq("user_id", userId);

  if (error) {
    return (
      <section className="border border-gray-800 p-6">
        <p className="text-xs tracking-[0.18em] text-gray-500">CONSISTÊNCIA</p>
        <p className="mt-4 text-sm text-gray-400">Não foi possível carregar sua consistência.</p>
      </section>
    );
  }

  const minutesByDay = new Map<string, number>();
  for (const checkin of data ?? []) {
    const key = dateKey(new Date(checkin.created_at));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + checkin.time_invested_minutes);
  }

  const today = new Date();
  const firstDay = addDays(today, -89);
  const gridStart = addDays(firstDay, -firstDay.getUTCDay());
  const lastDay = addDays(today, 90 - 1);
  const gridEnd = addDays(lastDay, 6 - lastDay.getUTCDay());
  const days: DayCell[] = [];

  for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) {
    const key = dateKey(date);
    days.push({ date, key, minutes: minutesByDay.get(key) ?? 0 });
  }

  const activeDays = new Set([...minutesByDay].filter(([, minutes]) => minutes > 0).map(([key]) => key));
  const totalActiveDays = [...activeDays].filter((key) => {
    const date = new Date(`${key}T00:00:00.000Z`);
    return date >= new Date(`${dateKey(firstDay)}T00:00:00.000Z`) && date <= today;
  }).length;

  return (
    <section className="border border-gray-800 bg-gray-950 p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs tracking-[0.18em] text-gray-500">CONSISTÊNCIA</p>
          <h2 className="mt-2 text-xl font-medium">Últimos 90 dias</h2>
        </div>
        <div className="flex gap-5 text-sm text-gray-400">
          <p><span className="text-white">{currentStreak(activeDays, today)}</span> dias de sequência</p>
          <p><span className="text-white">{totalActiveDays}</span> dias ativos</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-1">
        <div
          className="grid min-w-[560px] grid-rows-7 grid-flow-col gap-1"
          aria-label="Heatmap dos últimos 90 dias"
        >
          {days.map(({ date, key, minutes }) => (
            <div
              key={key}
              title={`${minutes} minutos investidos em ${formatDate(date)}`}
              aria-label={`${minutes} minutos investidos em ${formatDate(date)}`}
              className={`h-3.5 w-3.5 rounded-[2px] ${cellClass(minutes)}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-gray-500">
        <span>Menos</span>
        <span className="h-3.5 w-3.5 rounded-[2px] border border-gray-800 bg-gray-900" />
        <span className="h-3.5 w-3.5 rounded-[2px] bg-gray-700" />
        <span className="h-3.5 w-3.5 rounded-[2px] bg-gray-400" />
        <span className="h-3.5 w-3.5 rounded-[2px] bg-white" />
        <span>Mais</span>
      </div>
    </section>
  );
}
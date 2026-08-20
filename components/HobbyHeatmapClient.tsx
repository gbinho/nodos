"use client";

import { useMemo, useState } from "react";
import type { CheckinRow } from "@/lib/database.types";

type CheckinActivity = Pick<CheckinRow, "created_at" | "time_invested_minutes" | "hobby_tag">;
type ViewMode = "month" | "year" | "all";
type DayCell = { date: Date; key: string; minutes: number; hobbies: string[]; empty?: boolean };

const hobbyColors: Record<string, string> = {
  "Programação": "#3b82f6",
  Homelab: "#a855f7",
  "Impressão 3D": "#f97316",
  Ciclismo: "#22c55e",
  Leitura: "#eab308",
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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
  let streak = 0;
  for (let date = today; activeDays.has(dateKey(date)); date = addDays(date, -1)) streak += 1;
  return streak;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

export function HobbyHeatmapClient({ checkins, error }: { checkins: CheckinActivity[]; error: string | null }) {
  const [view, setView] = useState<ViewMode>("year");
  const today = new Date();
  const todayKey = dateKey(today);
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth();

  const activityByDay = useMemo(() => {
    const result = new Map<string, { minutes: number; hobbies: Set<string> }>();
    for (const checkin of checkins) {
      const key = dateKey(new Date(checkin.created_at));
      const day = result.get(key) ?? { minutes: 0, hobbies: new Set<string>() };
      day.minutes += checkin.time_invested_minutes;
      if (checkin.hobby_tag) day.hobbies.add(checkin.hobby_tag);
      result.set(key, day);
    }
    return result;
  }, [checkins]);

  const { days, activeDays } = useMemo(() => {
    const start = view === "month"
      ? new Date(Date.UTC(currentYear, currentMonth, 1))
      : view === "year"
        ? new Date(Date.UTC(currentYear, 0, 1))
        : new Date(Date.UTC(2026, 0, 1));
    const actualDays: DayCell[] = [];
    for (let date = start; date <= new Date(`${todayKey}T00:00:00.000Z`); date = addDays(date, 1)) {
      const key = dateKey(date);
      const activity = activityByDay.get(key);
      actualDays.push({ date, key, minutes: activity?.minutes ?? 0, hobbies: [...(activity?.hobbies ?? [])] });
    }
    const leadingEmpty = actualDays[0].date.getUTCDay();
    const cells: DayCell[] = Array.from({ length: leadingEmpty }, (_, index) => ({
      date: addDays(start, index - leadingEmpty),
      key: `empty-${index}`,
      minutes: 0,
      hobbies: [],
      empty: true,
    }));
    return {
      days: [...cells, ...actualDays],
      rangeStart: start,
      activeDays: new Set(actualDays.filter((day) => day.minutes > 0).map((day) => day.key)),
    };
  }, [activityByDay, currentMonth, currentYear, todayKey, view]);

  if (error) {
    return <section className="border border-gray-800 p-6"><p className="text-xs tracking-[0.18em] text-gray-500">CONSISTÊNCIA</p><p className="mt-4 text-sm text-gray-400">Não foi possível carregar sua consistência.</p></section>;
  }

  const columns = Math.ceil(days.length / 7);
  const totalActiveDays = [...activeDays].length;
  const monthLabels = days.reduce<Array<{ label: string; column: number }>>((labels, day, index) => {
    if (day.empty || day.date.getUTCDate() !== 1) return labels;
    const column = Math.floor(index / 7) + 1;
    if (!labels.some((item) => item.column === column)) labels.push({ label: formatMonth(day.date), column });
    return labels;
  }, []);
  const title = view === "month" ? "Mês atual" : view === "year" ? `Ano ${currentYear}` : `Desde 2026`;

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><p className="text-xs tracking-[0.18em] text-gray-500">CONSISTÊNCIA</p><h2 className="mt-2 text-xl font-medium">{title}</h2></div>
        <div className="flex flex-wrap gap-1 border border-gray-800 p-1 text-xs">
          {([ ["month", "Mês"], ["year", "Ano"], ["all", "Desde 2026"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setView(value)} className={`px-2.5 py-1.5 ${view === value ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}>{label}</button>)}
        </div>
      </div>
      <div className="mt-5 flex gap-5 text-sm text-gray-400"><p><span className="text-white">{currentStreak(activeDays, today)}</span> dias de sequência</p><p><span className="text-white">{totalActiveDays}</span> dias ativos</p></div>
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="min-w-[360px]" style={{ width: `${columns * 17}px` }}>
          <div className="grid h-5 gap-1 text-[10px] capitalize text-gray-500" style={{ gridTemplateColumns: `repeat(${columns}, 16px)` }}>
            {monthLabels.map((month) => <span key={`${month.label}-${month.column}`} style={{ gridColumn: month.column }}>{month.label}</span>)}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${columns}, 16px)` }} aria-label={`Atividade de ${title}`}>
            {days.map(({ date, key, minutes, hobbies, empty }) => {
              const colors = [...new Set(hobbies)].map((hobby) => hobbyColors[hobby] ?? "#d4d4d8");
              const background = colors.length === 1 ? colors[0] : colors.length > 1 ? `conic-gradient(${colors.map((color, index) => `${color} ${(index / colors.length) * 100}% ${((index + 1) / colors.length) * 100}%`).join(", ")})` : undefined;
              return empty ? <span key={key} aria-hidden="true" className="h-3.5 w-3.5" /> : <span key={key} title={`${minutes} minutos investidos em ${formatDate(date)}${hobbies.length ? ` · ${hobbies.join(", ")}` : ""}`} aria-label={`${minutes} minutos investidos em ${formatDate(date)}`} className={`h-3.5 w-3.5 rounded-[2px] ${colors.length ? "" : cellClass(minutes)}`} style={background ? { background } : undefined} />;
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-gray-500"><span>Menos</span><span className="h-3.5 w-3.5 rounded-[2px] border border-gray-800 bg-gray-900" /><span className="h-3.5 w-3.5 rounded-[2px] bg-gray-700" /><span className="h-3.5 w-3.5 rounded-[2px] bg-gray-400" /><span className="h-3.5 w-3.5 rounded-[2px] bg-white" /><span>Mais</span></div>
    </section>
  );
}
import { displayName, formatMinutes, formatWhen, type CheckinWithProfile } from "@/lib/checkins";

export function CheckinCard({ checkin }: { checkin: CheckinWithProfile }) {
  const name = displayName(checkin.profiles);

  return (
    <article className="border border-gray-800">
      {checkin.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={checkin.image_url} alt="" className="max-h-80 w-full object-cover" />
      ) : null}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-white">{name}</p>
          <p className="text-xs text-gray-400">{formatWhen(checkin.created_at)}</p>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {checkin.hobby_tag ?? "Hobby"} · {formatMinutes(checkin.time_invested_minutes)}
        </p>
        {checkin.description ? (
          <p className="mt-3 text-sm text-gray-400">{checkin.description}</p>
        ) : null}
      </div>
    </article>
  );
}

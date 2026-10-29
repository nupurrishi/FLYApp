import { MapPin, Pencil } from "lucide-react";
import StatusPill from "@/components/common/StatusPill";
import { categoryLabel } from "@/components/schedule/categories";
import { formatDay, formatTimeRange } from "@/lib/show-time";

export default function TimelineView({ items, canManage, onEdit }) {
  return (
    <ol className="relative ml-2 border-l border-brand-line pl-5 sm:ml-4 sm:pl-7">
      {items.map((item) => (
        <li key={item.id} className="relative pb-7 last:pb-0">
          <span
            className={`absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border sm:-left-[35px] ${
              item.status === "in_progress"
                ? "border-brand-purple bg-brand-purple"
                : item.status === "completed"
                  ? "border-black/20 bg-black/20"
                  : "border-brand-gold bg-white"
            }`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-purple">{formatDay(item.date)}</p>
            <StatusPill status={item.status} />
          </div>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-[20px] leading-tight text-brand-black">{item.title}</p>
              <p className="text-[12px] text-black/55">
                {formatTimeRange(item.start_time, item.end_time)} · {categoryLabel(item.category)}
              </p>
              {item.location && (
                <p className="mt-1 flex items-center gap-1 text-[12px] text-black/45">
                  <MapPin className="h-3 w-3" /> {item.location}
                </p>
              )}
              {item.instructions && (
                <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-black/55">{item.instructions}</p>
              )}
            </div>
            {canManage && (
              <button
                onClick={() => onEdit(item)}
                className="text-black/30 transition hover:text-brand-purple"
                aria-label={`Edit ${item.title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
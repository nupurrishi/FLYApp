import { MapPin, Pencil } from "lucide-react";
import StatusPill from "@/components/common/StatusPill";
import { categoryLabel } from "@/components/schedule/categories";
import { formatTime } from "@/lib/show-time";

export default function ScheduleCard({ item, canManage, onEdit }) {
  return (
    <article className="flex gap-3 border-b border-brand-line bg-white px-4 py-4 last:border-b-0 sm:gap-5">
      <div className="w-14 shrink-0 sm:w-20">
        <p className="font-heading text-[16px] leading-tight text-brand-black">
          {formatTime(item.start_time) || "—"}
        </p>
        {item.end_time && (
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-black/35">{formatTime(item.end_time)}</p>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold leading-snug text-brand-black">{item.title}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-brand-purple">
              {categoryLabel(item.category)}
            </p>
          </div>
          <StatusPill status={item.status} />
        </div>
        {item.location && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-black/50">
            <MapPin className="h-3 w-3 shrink-0" />
            {item.location}
          </p>
        )}
        {item.description && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/55">{item.description}</p>
        )}
        {item.instructions && (
          <p className="mt-2 border-l-2 border-brand-gold pl-2.5 text-[12px] leading-relaxed text-black/60">
            {item.instructions}
          </p>
        )}
        {(item.assigned_emails || []).length > 0 && (
          <p className="mt-2 text-[11px] text-black/40">{item.assigned_emails.length} assigned</p>
        )}
      </div>
      {canManage && onEdit && (
        <button
          onClick={() => onEdit(item)}
          className="h-8 w-8 shrink-0 text-black/30 transition hover:text-brand-purple"
          aria-label={`Edit ${item.title}`}
        >
          <Pencil className="ml-auto h-3.5 w-3.5" />
        </button>
      )}
    </article>
  );
}
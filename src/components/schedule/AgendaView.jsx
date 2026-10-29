import ScheduleCard from "@/components/schedule/ScheduleCard";
import { formatLongDay } from "@/lib/show-time";

export default function AgendaView({ items, canManage, onEdit }) {
  const groups = items.reduce((acc, item) => {
    const key = item.date || "Unscheduled";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  const days = Object.keys(groups).sort();

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day}>
          <div className="mb-2 flex items-center gap-3">
            <h3 className="font-heading text-[19px] text-brand-black">{formatLongDay(day)}</h3>
            <span className="h-px flex-1 bg-brand-line" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-black/30">
              {groups[day].length} item{groups[day].length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="border border-brand-line">
            {groups[day].map((item) => (
              <ScheduleCard key={item.id} item={item} canManage={canManage} onEdit={onEdit} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
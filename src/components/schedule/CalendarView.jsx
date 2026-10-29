import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarView({ items, selectedDate, onSelectDate }) {
  const first = items[0]?.date || new Date().toISOString().slice(0, 10);
  const [cursor, setCursor] = useState(() => {
    const [y, m] = first.split("-");
    return { year: Number(y), month: Number(m) - 1 };
  });

  const byDay = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      map[item.date] = (map[item.date] || 0) + 1;
    });
    return map;
  }, [items]);

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const startWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const shift = (delta) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="border border-brand-line bg-white">
      <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="text-black/40 hover:text-brand-purple">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-heading text-[18px] text-brand-black">{monthLabel}</p>
        <button onClick={() => shift(1)} aria-label="Next month" className="text-black/40 hover:text-brand-purple">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-brand-line bg-brand-bone/60">
        {WEEKDAYS.map((day, i) => (
          <span key={`${day}-${i}`} className="py-2 text-center text-[9px] uppercase tracking-[0.14em] text-black/35">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="aspect-square" />;
          const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = byDay[iso] || 0;
          const selected = selectedDate === iso;
          return (
            <button
              key={iso}
              onClick={() => onSelectDate(selected ? null : iso)}
              className={`relative flex aspect-square flex-col items-center justify-center border-b border-r border-brand-line text-[12px] transition last:border-r-0 ${
                selected ? "bg-brand-purple text-white" : count ? "text-brand-black hover:bg-brand-bone" : "text-black/35"
              }`}
            >
              {day}
              {count > 0 && (
                <span className={`mt-1 h-1 w-1 rounded-full ${selected ? "bg-brand-gold" : "bg-brand-purple"}`} />
              )}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <button
          onClick={() => onSelectDate(null)}
          className="w-full px-4 py-2 text-left text-[11px] uppercase tracking-[0.16em] text-brand-purple"
        >
          Showing {selectedDate} · clear filter
        </button>
      )}
    </div>
  );
}
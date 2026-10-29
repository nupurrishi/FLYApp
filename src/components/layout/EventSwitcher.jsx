import { ChevronDown } from "lucide-react";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";

export default function EventSwitcher({ tone = "dark" }) {
  const { events, activeEvent, selectEvent } = useWorkspace();
  if (!events.length) return null;

  const dark = tone === "dark";
  return (
    <div className="relative">
      <label className="sr-only" htmlFor="event-switcher">
        Active event
      </label>
      <select
        id="event-switcher"
        value={activeEvent?.id || ""}
        onChange={(e) => selectEvent(e.target.value)}
        className={
          dark
            ? "w-full appearance-none truncate border border-white/15 bg-white/5 py-2.5 pl-3 pr-9 text-[13px] text-white/85 outline-none transition hover:border-white/30 focus:border-brand-gold"
            : "w-full appearance-none truncate border border-brand-line bg-white py-2.5 pl-3 pr-9 text-[13px] text-brand-black outline-none focus:border-brand-purple"
        }
      >
        {events.map((event) => (
          <option key={event.id} value={event.id} className="text-brand-black">
            {event.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
          dark ? "text-white/40" : "text-black/40"
        }`}
      />
    </div>
  );
}
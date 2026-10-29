import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import StatusPill from "@/components/common/StatusPill";
import { Image } from "@/components/ui/image";
import { formatRange } from "@/lib/show-time";

export default function EventCard({ event }) {
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="group flex flex-col border border-brand-line bg-white transition hover:border-brand-purple"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-bone">
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.name}
            className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
            fittingType="fill"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-black">
            <span className="font-heading text-3xl tracking-[0.3em] text-white/25">FLY</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusPill status={event.status} className="bg-white/90" />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 py-4">
        <p className="label-eyebrow text-brand-purple">{formatRange(event.start_date, event.end_date)}</p>
        <h3 className="mt-1.5 font-heading text-[23px] leading-tight text-brand-black">{event.name}</h3>
        {event.tagline && <p className="mt-1 text-[12.5px] italic text-black/45">{event.tagline}</p>}
        <p className="mt-2 flex items-center gap-1 text-[12px] text-black/50">
          <MapPin className="h-3 w-3" />
          {[event.venue_name, event.city].filter(Boolean).join(" · ") || "Venue to be confirmed"}
        </p>
        <span className="mt-4 flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-brand-black group-hover:text-brand-purple">
          Open workspace <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
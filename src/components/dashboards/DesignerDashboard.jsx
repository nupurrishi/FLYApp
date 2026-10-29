import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Images, Megaphone, Scissors, Users } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import Stat from "@/components/common/Stat";
import StatusPill from "@/components/common/StatusPill";
import ScheduleCard from "@/components/schedule/ScheduleCard";
import { getDesignerDashboard } from "@/lib/server-fns";
import { formatRange, formatTimeRange } from "@/lib/show-time";

export default function DesignerDashboard({ event }) {
  const { data, isLoading } = useQuery({
    queryKey: ["designer-dashboard", event.id],
    queryFn: () => getDesignerDashboard({ data: { event_id: event.id } }),
  });

  if (isLoading) return <Loading label="Loading your studio" />;

  return (
    <div className="space-y-6">
      <header className="border-b border-brand-line pb-5">
        <p className="label-eyebrow text-brand-purple">Designer studio</p>
        <h1 className="mt-1.5 font-heading text-[32px] font-medium leading-tight text-brand-black sm:text-[38px]">
          {event.name}
        </h1>
        <p className="mt-1.5 text-[12.5px] text-black/55">
          {formatRange(event.start_date, event.end_date)} · {event.venue_name || event.city}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill status={event.status} />
          {event.show_status === "live" && <StatusPill status="live" />}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Collections" value={data?.collections?.length ?? 0} />
        <Stat label="Looks" value={data?.looks?.length ?? 0} accent />
        <Stat label="Models" value={data?.models?.length ?? 0} />
        <Stat label="Needs attention" value={data?.missing?.length ?? 0} hint="Missing images or prep" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="font-heading text-[22px] text-brand-black">Upcoming for you</h2>
            <Link to="/schedule" className="text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
              Full schedule
            </Link>
          </div>
          {data?.upcoming?.length ? (
            <div className="border border-brand-line">
              {data.upcoming.map((item) => (
                <ScheduleCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState title="No scheduled activity yet" description="Rehearsals, fittings and call times will appear here." />
          )}
        </section>

        <section className="border border-brand-line bg-white p-5">
          <p className="label-eyebrow flex items-center gap-1.5 text-black/40">
            <Scissors className="h-3 w-3 text-brand-purple" /> Upcoming fittings
          </p>
          {data?.fittings?.length ? (
            <ul className="mt-3 space-y-3">
              {data.fittings.slice(0, 4).map((fitting) => (
                <li key={fitting.id} className="border-b border-brand-line pb-2.5 last:border-b-0 last:pb-0">
                  <p className="text-[13px] font-bold text-brand-black">{fitting.title}</p>
                  <p className="text-[12px] text-black/55">
                    {fitting.date} · {formatTimeRange(fitting.start_time, fitting.end_time)}
                  </p>
                  {fitting.location && <p className="text-[11.5px] text-black/45">{fitting.location}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-black/45">No fittings booked yet.</p>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="font-heading text-[22px] text-brand-black">Looks needing attention</h2>
            <Link to="/lookbook" className="text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
              Open lookbook
            </Link>
          </div>
          {data?.missing?.length ? (
            <div className="border border-brand-line bg-white">
              {data.missing.slice(0, 6).map((look) => (
                <div key={look.id} className="flex items-center justify-between gap-3 border-b border-brand-line px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-brand-black">
                      {look.number ? `${look.number} · ` : ""}
                      {look.name}
                    </p>
                    <p className="text-[11px] text-black/45">
                      {!(look.images || []).length ? "No reference images" : "Preparation incomplete"}
                    </p>
                  </div>
                  <StatusPill status={look.prep_status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Images} title="Every look is complete" description="All your looks have reference images and are marked ready." />
          )}
        </section>

        <section>
          <h2 className="mb-2 font-heading text-[22px] text-brand-black">Assigned models</h2>
          {data?.assignments?.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.assignments.map((assignment) => {
                const look = data.looks.find((l) => l.id === assignment.look_id);
                return (
                  <div key={assignment.id} className="border border-brand-line bg-white px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[13px] text-brand-black">
                      <Users className="h-3 w-3 text-brand-purple" />
                      {assignment.model_name || assignment.model_email}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-black/45">{look?.name}</p>
                    <StatusPill status={assignment.status} className="mt-1.5" />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Users} title="No models assigned" description="Assign models to your looks from the lookbook." />
          )}

          {data?.announcements?.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 flex items-center gap-1.5 font-heading text-[22px] text-brand-black">
                <Megaphone className="h-4 w-4 text-brand-gold" /> Announcements
              </h2>
              <div className="space-y-2">
                {data.announcements.map((note) => (
                  <article key={note.id} className="border border-brand-line bg-white px-4 py-3">
                    <p className="text-[13px] font-bold text-brand-black">{note.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-black/55">{note.message}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
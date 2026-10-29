import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Images, MapPin, Sparkles } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import StatusPill from "@/components/common/StatusPill";
import ScheduleCard from "@/components/schedule/ScheduleCard";
import { Image } from "@/components/ui/image";
import { getModelDashboard, toggleTask } from "@/lib/server-fns";
import { daysUntil, formatRange, formatTimeRange, localStamp, zoneLabel } from "@/lib/show-time";

export default function ModelDashboard({ event }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["model-dashboard", event.id],
    queryFn: () => getModelDashboard({ data: { event_id: event.id } }),
  });
  const taskMutation = useMutation({
    mutationFn: ({ id, done }) => toggleTask({ data: { id, done } }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  if (isLoading) return <Loading label="Preparing your call sheet" />;
  const countdown = daysUntil(event.start_date);
  const stamp = localStamp(new Date(), event.timezone);
  const liveNow = data?.currentSegment;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden bg-brand-black">
        {event.cover_image && (
          <Image src={event.cover_image} alt="" className="absolute inset-0 h-full w-full opacity-30" fittingType="fill" />
        )}
        <div className="relative bg-gradient-to-t from-brand-black via-brand-black/85 to-brand-black/40 px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={event.status} />
            {event.show_status === "live" && <StatusPill status="live" />}
          </div>
          <h1 className="mt-3 font-heading text-[32px] font-light leading-tight text-white sm:text-[42px]">
            {event.name}
          </h1>
          <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-brand-gold">
            {formatRange(event.start_date, event.end_date)}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[12.5px] text-white/55">
            {event.venue_name && <span>{event.venue_name}</span>}
            {event.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {event.city}
              </span>
            )}
            {countdown !== null && countdown >= 0 && (
              <span className="text-white/80">
                {countdown === 0 ? "Show day" : `${countdown} day${countdown === 1 ? "" : "s"} to show`}
              </span>
            )}
          </p>
        </div>
      </section>

      {liveNow && (
        <section className="border-l-2 border-brand-purple bg-white px-4 py-3">
          <p className="label-eyebrow text-brand-purple">Live now</p>
          <p className="mt-1 font-heading text-xl text-brand-black">{liveNow.title}</p>
          <Link to="/live" className="mt-1 inline-flex text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
            View the running order →
          </Link>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="border-l-2 border-brand-gold bg-white p-5 lg:col-span-2">
          <p className="label-eyebrow text-black/40">Next call time</p>
          {data?.nextCall ? (
            <>
              <p className="mt-2 font-heading text-[26px] leading-tight text-brand-black">{data.nextCall.title}</p>
              <p className="mt-1 text-[13px] text-black/60">
                {data.nextCall.date} · {formatTimeRange(data.nextCall.start_time, data.nextCall.end_time)}
                {data.nextCall.location ? ` · ${data.nextCall.location}` : ""}
              </p>
              {data.nextCall.instructions && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-black/55">{data.nextCall.instructions}</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-[13px] text-black/45">No upcoming call times. Your producer will publish them here.</p>
          )}
        </section>

        <section className="border border-brand-line bg-white p-5">
          <p className="label-eyebrow flex items-center gap-1.5 text-black/40">
            <Sparkles className="h-3 w-3 text-brand-purple" /> Hair & makeup
          </p>
          {data?.hairMakeup?.length ? (
            <div className="mt-2 space-y-3">
              {data.hairMakeup.slice(0, 2).map((appt) => (
                <div key={appt.id}>
                  <p className="text-[13px] font-bold text-brand-black">{appt.date}</p>
                  <p className="text-[12px] text-black/55">
                    {formatTimeRange(appt.start_time, appt.end_time)}
                    {appt.station ? ` · ${appt.station}` : ""}
                  </p>
                  {appt.artist && <p className="text-[11.5px] text-black/45">Artist: {appt.artist}</p>}
                </div>
              ))}
              <Link to="/hair-makeup" className="inline-flex text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
                All appointments →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-black/45">No appointment scheduled yet.</p>
          )}
        </section>
      </div>

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-heading text-[22px] text-brand-black">Today's schedule</h2>
          <Link to="/schedule" className="text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
            Full schedule
          </Link>
        </div>
        {data?.todayItems?.length ? (
          <div className="border border-brand-line">
            {data.todayItems.map((item) => (
              <ScheduleCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock3}
            title="Nothing scheduled today"
            description={`Your next listed activity is ${data?.nextCall ? `${data.nextCall.title} on ${data.nextCall.date}` : "not scheduled yet"}.`}
          />
        )}
        <p className="mt-2 text-[11px] text-black/30">Times shown in {zoneLabel(event.timezone)} · now {stamp.slice(11)}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="font-heading text-[22px] text-brand-black">Your looks</h2>
            <Link to="/lookbook" className="text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
              Lookbook
            </Link>
          </div>
          {data?.looks?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {data.looks.slice(0, 4).map(({ look, assignment }) => (
                <Link
                  key={look.id}
                  to="/lookbook"
                  className="group border border-brand-line bg-white"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-brand-bone">
                    {look.images?.[0] ? (
                      <Image src={look.images[0]} alt={look.name} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" fittingType="fill" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-black/20">
                        <Images className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-brand-purple">{look.designer_name}</p>
                    <p className="truncate font-heading text-[17px] text-brand-black">{look.name}</p>
                    <StatusPill status={assignment.status} className="mt-1.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Images} title="No looks assigned yet" description="Designers will assign your looks before fittings." />
          )}
        </section>

        <section>
          <h2 className="mb-2 font-heading text-[22px] text-brand-black">Readiness</h2>
          {data?.tasks?.length ? (
            <div className="border border-brand-line bg-white">
              {data.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => taskMutation.mutate({ id: task.id, done: !task.done })}
                  className="flex w-full items-center gap-3 border-b border-brand-line px-4 py-3 text-left last:border-b-0"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                      task.done ? "border-brand-purple bg-brand-purple text-white" : "border-black/20 text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] ${task.done ? "text-black/35 line-through" : "text-brand-black"}`}>
                      {task.title}
                    </span>
                    {task.due_date && <span className="text-[11px] text-black/40">Due {task.due_date}</span>}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="All clear" description="No acknowledgement or preparation tasks assigned to you." />
          )}

          {data?.announcements?.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 font-heading text-[22px] text-brand-black">Announcements</h2>
              <div className="space-y-2">
                {data.announcements.map((note) => (
                  <article key={note.id} className="border border-brand-line bg-white px-4 py-3">
                    <p className="text-[13px] font-bold text-brand-black">{note.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-black/55">{note.message}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-black/30">From the production team</p>
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
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CalendarPlus, Megaphone, Radio, Users } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import Stat from "@/components/common/Stat";
import StatusPill from "@/components/common/StatusPill";
import ScheduleCard from "@/components/schedule/ScheduleCard";
import { Button } from "@/components/ui/button";
import { getAdminDashboard } from "@/lib/server-fns";
import { formatRange, relativeTime, zoneLabel } from "@/lib/show-time";

export default function AdminDashboard({ event }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard", event.id],
    queryFn: () => getAdminDashboard({ data: { event_id: event.id } }),
    refetchInterval: 45_000,
  });

  if (isLoading) return <Loading label="Loading production overview" />;
  const counts = data?.counts || {};
  const readyPct = counts.looks ? Math.round((counts.readyLooks / counts.looks) * 100) : 0;
  const hmaPct = counts.hma ? Math.round((counts.hmaDone / counts.hma) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="border-b border-brand-line pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-eyebrow text-brand-purple">Production control</p>
            <h1 className="mt-1.5 font-heading text-[32px] font-medium leading-tight text-brand-black sm:text-[38px]">
              {event.name}
            </h1>
            <p className="mt-1.5 text-[12.5px] text-black/55">
              {formatRange(event.start_date, event.end_date)} · {event.venue_name || event.city || "Venue TBC"} ·{" "}
              {zoneLabel(event.timezone)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill status={event.status} />
              <StatusPill status={event.show_status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-none bg-brand-purple hover:bg-brand-black">
              <Link to="/live">
                <Radio className="mr-1.5 h-3.5 w-3.5" /> Show control
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-none border-brand-line">
              <Link to="/admin">
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Manage team
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Models" value={counts.models ?? 0} hint={`${counts.invited ?? 0} invited`} />
        <Stat label="Designers" value={counts.designers ?? 0} />
        <Stat label="Looks ready" value={`${readyPct}%`} hint={`${counts.readyLooks ?? 0} of ${counts.looks ?? 0}`} accent />
        <Stat label="Hair & makeup" value={`${hmaPct}%`} hint={`${counts.hmaDone ?? 0} of ${counts.hma ?? 0} complete`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="border border-brand-line bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="label-eyebrow text-black/40">Running order</p>
            <Link to="/live" className="text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
              Open control →
            </Link>
          </div>
          {data?.currentSegment ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-purple">On stage now</p>
              <p className="font-heading text-[26px] leading-tight text-brand-black">{data.currentSegment.title}</p>
              <p className="text-[12px] text-black/50">
                {data.currentSegment.designer_name}
                {data.currentSegment.collection_name ? ` · ${data.currentSegment.collection_name}` : ""}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-black/45">
              {counts.segments ? "The show has not started." : "No segments in the running order yet."}
            </p>
          )}
          {data?.nextSegment && (
            <div className="mt-4 border-t border-brand-line pt-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-gold">Up next</p>
              <p className="text-[15px] text-brand-black">{data.nextSegment.title}</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-black/50">
            <span>{counts.segmentsDone ?? 0} of {counts.segments ?? 0} segments complete</span>
          </div>
        </section>

        <section className="border border-brand-line bg-white p-5">
          <p className="label-eyebrow flex items-center gap-1.5 text-black/40">
            <AlertTriangle className="h-3 w-3 text-brand-gold" /> Needs attention
          </p>
          <ul className="mt-3 space-y-3 text-[13px]">
            <li className="flex items-center justify-between gap-2">
              <span className="text-black/60">Looks missing references</span>
              <span className="font-bold text-brand-black">{counts.missingLooks ?? 0}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-black/60">Invited, not yet active</span>
              <span className="font-bold text-brand-black">{counts.invited ?? 0}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-black/60">New applications</span>
              <span className="font-bold text-brand-black">{counts.applications ?? 0}</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-black/60">Upcoming schedule items</span>
              <span className="font-bold text-brand-black">{counts.scheduleUpcoming ?? 0}</span>
            </li>
          </ul>
          <div className="mt-4 grid gap-2">
            <Link to="/schedule" className="flex items-center justify-between border border-brand-line px-3 py-2 text-[12px] text-black/70 hover:border-brand-purple hover:text-brand-purple">
              Add schedule item <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/admin/announcements" className="flex items-center justify-between border border-brand-line px-3 py-2 text-[12px] text-black/70 hover:border-brand-purple hover:text-brand-purple">
              <span className="flex items-center gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Announcements & opportunities</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/admin" className="flex items-center justify-between border border-brand-line px-3 py-2 text-[12px] text-black/70 hover:border-brand-purple hover:text-brand-purple">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Team & assignments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="font-heading text-[22px] text-brand-black">Today</h2>
            <Link to="/schedule" className="text-[11px] uppercase tracking-[0.16em] text-brand-purple hover:underline">
              Schedule
            </Link>
          </div>
          {data?.todayItems?.length ? (
            <div className="border border-brand-line">
              {data.todayItems.map((item) => (
                <ScheduleCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing scheduled today" description="Add call times, fittings and rehearsals from the schedule." />
          )}
        </section>

        <section>
          <h2 className="mb-2 font-heading text-[22px] text-brand-black">Recent activity</h2>
          {data?.audit?.length ? (
            <div className="border border-brand-line bg-white">
              {data.audit.map((entry) => (
                <div key={entry.id} className="border-b border-brand-line px-4 py-3 last:border-b-0">
                  <p className="text-[13px] text-brand-black">
                    {entry.action}
                    {entry.target ? ` — ${entry.target}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-black/40">
                    {entry.actor_name} · {relativeTime(entry.created_date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No activity recorded yet" description="Event changes are logged here for the production team." />
          )}
        </section>
      </div>
    </div>
  );
}
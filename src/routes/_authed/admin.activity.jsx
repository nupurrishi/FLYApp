import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import AdminTabs from "@/components/admin/AdminTabs";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import { getAdminWorkspace } from "@/lib/server-fns";
import { relativeTime } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/admin/activity")({
  head: () => ({ meta: [{ title: "Activity · Fly Showcase" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  return <EventGate>{(event) => <ActivityContent event={event} />}</EventGate>;
}

function ActivityContent({ event }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspace", event.id],
    queryFn: () => getAdminWorkspace({ data: { event_id: event.id } }),
  });

  return (
    <div>
      <PageHeader
        eyebrow={`${event.name} · audit trail`}
        title="Activity"
        description="Administrative actions recorded for this event."
      />
      <AdminTabs />

      {isLoading ? (
        <Loading label="Loading activity" />
      ) : (data?.audit || []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="No activity yet" description="Changes to the event will be recorded here." />
      ) : (
        <div className="border border-brand-line bg-white">
          {data.audit.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-line px-4 py-3 last:border-b-0">
              <div>
                <p className="text-[13px] text-brand-black">
                  {entry.action}
                  {entry.target ? <span className="text-black/50"> — {entry.target}</span> : null}
                </p>
                <p className="text-[11px] text-black/40">
                  {entry.actor_name} · {entry.actor_email}
                  {entry.detail ? ` · ${entry.detail}` : ""}
                </p>
              </div>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-black/30">{relativeTime(entry.created_date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
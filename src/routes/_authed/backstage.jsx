import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import ReadinessTasks from "@/components/admin/ReadinessTasks";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { getOperationsWorkspace } from "@/lib/server-fns";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authed/backstage")({
  head: () => ({ meta: [{ title: "Backstage Readiness · Fly Showcase" }] }),
  component: BackstagePage,
});

function BackstagePage() {
  return <EventGate>{(event) => <BackstageContent event={event} />}</EventGate>;
}

function BackstageContent({ event }) {
  const { role } = useWorkspace();
  const allowed = role === "admin" || role === "backstage_manager";
  const query = useQuery({
    queryKey: ["operations-workspace", event.id],
    queryFn: () => getOperationsWorkspace({ data: { event_id: event.id } }),
    enabled: allowed,
  });

  if (!allowed) {
    return <EmptyState icon={ListChecks} title="Backstage manager access required" description="Ask an event admin to add you as a backstage manager." />;
  }

  return (
    <div>
      <PageHeader eyebrow={`${event.name} · backstage`} title="Readiness tasks" description="Assign and track model preparation tasks for this event." />
      {query.isLoading ? <Loading label="Loading backstage tasks" /> : query.error ? (
        <EmptyState icon={ListChecks} title="Tasks could not be loaded" description={query.error.message || "Try again in a moment."} />
      ) : (
        <ReadinessTasks event={event} models={query.data?.models || []} tasks={query.data?.tasks || []} />
      )}
    </div>
  );
}

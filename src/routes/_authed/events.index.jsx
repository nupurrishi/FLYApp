import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import EventCard from "@/components/events/EventCard";
import EventFormDialog from "@/components/events/EventFormDialog";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/events/")({
  head: () => ({ meta: [{ title: "Events · Fly Showcase" }] }),
  component: EventsPage,
});

function EventsPage() {
  const { events, isLoading, isAdmin } = useWorkspace();

  return (
    <div>
      <PageHeader
        eyebrow="Productions"
        title="Events"
        description="Every Fly Showcase production you are part of — with its own schedule, collections, team and running order."
        actions={
          isAdmin ? (
            <EventFormDialog
              trigger={
                <Button className="rounded-none bg-brand-black hover:bg-brand-purple">
                  <Plus className="mr-1.5 h-4 w-4" /> New event
                </Button>
              }
            />
          ) : null
        }
      />

      {isLoading ? (
        <Loading label="Loading events" />
      ) : events.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No events yet"
          description={
            isAdmin
              ? "Create your first event to begin building the production."
              : "Your production team will add you to an event soon."
          }
        />
      )}
    </div>
  );
}
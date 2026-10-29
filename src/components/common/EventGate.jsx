import { Link } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Button } from "@/components/ui/button";

// Renders the page for the visitor's active event, with the shared loading and
// "no event yet" states.
export default function EventGate({ children }) {
  const { activeEvent, isLoading, isAdmin, events } = useWorkspace();

  if (isLoading) return <Loading label="Loading your event" />;

  if (!activeEvent) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title={events.length ? "Select an event" : isAdmin ? "No events yet" : "You're not on an event yet"}
        description={
          isAdmin
            ? "Create the first Fly Showcase event to start building schedules, collections and the running order."
            : "Your production team will add you to an event. You'll get a notification as soon as you're assigned."
        }
        action={
          isAdmin ? (
            <Button asChild className="rounded-none bg-brand-black hover:bg-brand-purple">
              <Link to="/events">Go to events</Link>
            </Button>
          ) : null
        }
      />
    );
  }

  return children(activeEvent);
}
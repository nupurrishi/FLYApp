import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CalendarDays, Images, Pencil, Radio, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Loading from "@/components/common/Loading";
import Stat from "@/components/common/Stat";
import StatusPill from "@/components/common/StatusPill";
import EventFormDialog from "@/components/events/EventFormDialog";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { deleteEvent, setEventStatus } from "@/lib/manage-fns";
import { getEventWorkspace } from "@/lib/server-fns";
import { formatRange } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/events/$eventId")({
  head: () => ({ meta: [{ title: "Event · Fly Showcase" }] }),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = useParams({ from: "/_authed/events/$eventId" });
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["event-workspace", eventId],
    queryFn: () => getEventWorkspace({ data: { event_id: eventId } }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }) => setEventStatus({ data: { id: eventId, status } }),
    onSuccess: () => {
      toast.success("Event updated");
      queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(err?.message || "Could not update the event"),
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteEvent({ data: { id: eventId } }),
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries();
      window.location.href = "/events";
    },
  });

  if (isLoading) return <Loading label="Opening event" />;
  if (error || !data) {
    return (
      <div className="border border-brand-line bg-white px-6 py-12 text-center">
        <p className="font-heading text-2xl text-brand-black">This event is not available to you</p>
        <p className="mt-2 text-[13px] text-black/50">
          You may have been removed from the event, or it may no longer exist.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-none border-brand-line">
          <Link to="/events">Back to events</Link>
        </Button>
      </div>
    );
  }

  const { event, counts, role } = data;
  const canManage = role === "admin";

  return (
    <div>
      <div className="relative mb-6 overflow-hidden bg-brand-black">
        {event.cover_image && (
          <Image src={event.cover_image} alt="" className="absolute inset-0 h-full w-full opacity-35" fittingType="fill" />
        )}
        <div className="relative bg-gradient-to-t from-brand-black via-brand-black/80 to-brand-black/40 px-5 py-8 sm:px-8">
          <div className="flex flex-wrap gap-2">
            <StatusPill status={event.status} />
            <StatusPill status={event.show_status} />
          </div>
          <h1 className="mt-3 font-heading text-[30px] font-light leading-tight text-white sm:text-[42px]">{event.name}</h1>
          {event.tagline && <p className="mt-1 text-[13px] italic text-brand-gold">{event.tagline}</p>}
          <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-white/60">
            {formatRange(event.start_date, event.end_date)}
          </p>
          <p className="mt-1 text-[12.5px] text-white/50">
            {[event.venue_name, event.venue_address, event.city].filter(Boolean).join(" · ")}
          </p>
          {event.description && (
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-white/65">{event.description}</p>
          )}
        </div>
      </div>

      {canManage && (
        <div className="mb-6 flex flex-wrap gap-2">
          <EventFormDialog
            event={event}
            trigger={
              <Button size="sm" variant="outline" className="rounded-none border-brand-line">
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit event
              </Button>
            }
          />
          {event.status !== "published" && event.status !== "active" && (
            <Button
              size="sm"
              className="rounded-none bg-brand-black hover:bg-brand-purple"
              onClick={() => statusMutation.mutate({ status: "published" })}
            >
              Publish event
            </Button>
          )}
          {event.status !== "archived" && (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="outline" className="rounded-none border-brand-line">
                  <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
                </Button>
              }
              title="Archive this event?"
              description="The event stays in the system but is marked archived. Participants keep their records."
              confirmLabel="Archive event"
              onConfirm={() => statusMutation.mutate({ status: "archived" })}
            />
          )}
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="ghost" className="rounded-none text-red-600 hover:bg-red-50">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            }
            title="Delete this event permanently?"
            description="This removes the event with its schedule, collections, looks, appointments and running order. This cannot be undone."
            confirmLabel="Delete permanently"
            destructive
            onConfirm={() => removeMutation.mutate()}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Models" value={counts.models} />
        <Stat label="Designers" value={counts.designers} />
        <Stat label="Looks" value={counts.looks} accent />
        <Stat label="Segments" value={counts.segments} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/schedule", label: "Schedule", icon: CalendarDays },
          { to: "/lookbook", label: "Lookbook", icon: Images },
          { to: "/live", label: "Live show", icon: Radio },
          { to: canManage ? "/admin" : "/profile", label: canManage ? "Team" : "Your profile", icon: Users },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 border border-brand-line bg-white px-4 py-4 text-[13px] text-brand-black transition hover:border-brand-purple hover:text-brand-purple"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>

      {event.notes && (
        <div className="mt-6 border-l-2 border-brand-gold bg-white px-4 py-3">
          <p className="label-eyebrow text-black/40">Production notes</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-black/60">{event.notes}</p>
        </div>
      )}
    </div>
  );
}
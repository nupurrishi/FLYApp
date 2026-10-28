import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Scissors } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import HairMakeupFormDialog from "@/components/hairmakeup/HairMakeupFormDialog";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { setHairMakeupStatus } from "@/lib/manage-fns";
import { getHairMakeupBoard } from "@/lib/server-fns";
import { formatDay, formatTimeRange } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/hair-makeup")({
  head: () => ({ meta: [{ title: "Hair & Makeup · Fly Showcase" }] }),
  component: HairMakeupPage,
});

function HairMakeupPage() {
  return <EventGate>{(event) => <HairMakeupContent event={event} />}</EventGate>;
}

const NEXT_STATUS = { not_started: "in_progress", in_progress: "completed", completed: "not_started" };

function HairMakeupContent({ event }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState({ open: false, appointment: null });
  const { data, isLoading } = useQuery({
    queryKey: ["hair-makeup", event.id],
    queryFn: () => getHairMakeupBoard({ data: { event_id: event.id } }),
    refetchInterval: 60_000,
  });

  const status = useMutation({
    mutationFn: (appointment) =>
      setHairMakeupStatus({
        data: { id: appointment.id, status: NEXT_STATUS[appointment.status] || "not_started" },
      }),
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error) => toast.error(error?.message || "Status could not be updated"),
  });

  const role = data?.role || "model";
  const canManage = role === "admin";
  const appointments = data?.appointments || [];
  const byDate = appointments.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const completed = appointments.filter((a) => a.status === "completed").length;

  return (
    <div>
      <PageHeader
        eyebrow={event.name}
        title="Hair & Makeup"
        description={
          canManage
            ? "Book artists, assign stations and track readiness through the day."
            : "Your appointment times, stations and preparation notes."
        }
        actions={
          canManage ? (
            <Button
              className="rounded-none bg-brand-black hover:bg-brand-purple"
              onClick={() => setDialog({ open: true, appointment: null })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Book appointment
            </Button>
          ) : null
        }
      />

      {canManage && appointments.length > 0 && (
        <div className="mb-5 flex items-center gap-3 border border-brand-line bg-white px-4 py-3">
          <Scissors className="h-4 w-4 text-brand-purple" />
          <p className="text-[12.5px] text-black/60">
            {completed} of {appointments.length} appointments complete
          </p>
          <div className="ml-auto h-1.5 w-24 overflow-hidden bg-brand-line">
            <div className="h-full bg-brand-purple" style={{ width: `${(completed / appointments.length) * 100}%` }} />
          </div>
        </div>
      )}

      {isLoading ? (
        <Loading label="Loading appointments" />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={canManage ? "No appointments booked" : "No appointment scheduled for you"}
          description={
            canManage
              ? "Add hair & makeup slots so every model knows their chair, artist and call time."
              : "Your production team will publish your hair & makeup slot here."
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.keys(byDate)
            .sort()
            .map((date) => (
              <section key={date}>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="font-heading text-[20px] text-brand-black">{formatDay(date)}</h2>
                  <span className="h-px flex-1 bg-brand-line" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {byDate[date].map((appointment) => (
                    <article key={appointment.id} className="border border-brand-line bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="label-eyebrow text-brand-purple">{formatTimeRange(appointment.start_time, appointment.end_time)}</p>
                          <p className="mt-1 font-heading text-[19px] leading-tight text-brand-black">
                            {appointment.model_name || appointment.model_email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusPill status={appointment.status} />
                          {canManage && (
                            <>
                              <button
                                onClick={() => status.mutate(appointment)}
                                className="text-[10px] uppercase tracking-[0.12em] text-brand-purple hover:underline"
                                title="Advance status"
                              >
                                →
                              </button>
                              <button
                                onClick={() => setDialog({ open: true, appointment })}
                                className="text-black/30 hover:text-brand-purple"
                                aria-label="Edit appointment"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[12px] text-black/55">
                        {appointment.station && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {appointment.station}
                          </span>
                        )}
                        {appointment.artist && <span>Artist: {appointment.artist}</span>}
                      </p>
                      {appointment.instructions && (
                        <p className="mt-2 border-l-2 border-brand-gold pl-2.5 text-[12.5px] leading-relaxed text-black/60">
                          {appointment.instructions}
                        </p>
                      )}
                      {(appointment.reference_images || []).length > 0 && (
                        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
                          {appointment.reference_images.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="h-20 w-16 shrink-0 overflow-hidden border border-brand-line"
                            >
                              <Image src={url} alt="" className="h-full w-full" fittingType="fill" />
                            </a>
                          ))}
                        </div>
                      )}
                      {appointment.notes && canManage && (
                        <p className="mt-2 text-[11.5px] italic text-black/40">{appointment.notes}</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {canManage && (
        <HairMakeupFormDialog
          event={event}
          appointment={dialog.appointment}
          models={data?.models || []}
          open={dialog.open}
          onOpenChange={(open) => setDialog({ open, appointment: open ? dialog.appointment : null })}
        />
      )}
    </div>
  );
}
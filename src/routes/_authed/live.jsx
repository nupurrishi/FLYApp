import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListOrdered, Pencil, Play, Plus, RotateCcw, SkipForward, Users } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import StatusPill from "@/components/common/StatusPill";
import SegmentFormDialog from "@/components/live/SegmentFormDialog";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { advanceShow, resetShow, setSegmentStatus, setShowStatus } from "@/lib/manage-fns";
import { getAdminWorkspace, getLiveShow } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/live")({
  head: () => ({ meta: [{ title: "Live Show · Fly Showcase" }] }),
  component: LivePage,
});

function LivePage() {
  return <EventGate>{(event) => <LiveContent event={event} />}</EventGate>;
}

function LiveContent({ event }) {
  const queryClient = useQueryClient();
  const { user } = useWorkspace();
  const [dialog, setDialog] = useState({ open: false, segment: null });

  const liveQuery = useQuery({
    queryKey: ["live", event.id],
    queryFn: () => getLiveShow({ data: { event_id: event.id } }),
    refetchInterval: 15_000,
  });
  const canControl = liveQuery.data?.canControl;
  const teamQuery = useQuery({
    queryKey: ["admin-workspace", event.id],
    queryFn: () => getAdminWorkspace({ data: { event_id: event.id } }),
    enabled: !!canControl,
  });

  const mutate = (fn, success) => ({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success);
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "That action could not be completed"),
  });

  const advance = useMutation(mutate(() => advanceShow({ data: { event_id: event.id } }), "Running order advanced"));
  const reset = useMutation(mutate(() => resetShow({ data: { event_id: event.id } }), "Show progress reset"));
  const status = useMutation(
    mutate(({ id, status: next }) => setSegmentStatus({ data: { id, status: next } }), "Segment updated"),
  );
  const showStatus = useMutation(
    mutate((next) => setShowStatus({ data: { id: event.id, show_status: next } }), "Show status updated"),
  );

  if (liveQuery.isLoading) return <Loading label="Loading the running order" />;

  const data = liveQuery.data;
  const segments = data?.segments || [];
  const current = segments.find((s) => s.status === "on_stage");
  const onDeck = segments.find((s) => s.status === "on_deck");
  const next = onDeck || segments.find((s) => ["pending", "ready"].includes(s.status) && s.id !== current?.id);
  const models = teamQuery.data?.members?.filter((m) => m.role === "model") || [];

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-brand-line pb-5">
        <div>
          <p className="label-eyebrow text-brand-purple">{event.name} · running order</p>
          <h1 className="mt-1 font-heading text-[32px] font-medium leading-tight text-brand-black sm:text-[38px]">
            Live Show
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={data?.event?.show_status || "idle"} />
            <span className="text-[11.5px] text-black/45">
              {segments.filter((s) => s.status === "completed").length} of {segments.length} segments complete
            </span>
          </div>
        </div>
        {canControl && (
          <div className="flex flex-wrap gap-2">
            {data?.event?.show_status !== "live" && (
              <Button
                size="sm"
                className="rounded-none bg-brand-purple hover:bg-brand-black"
                onClick={() => showStatus.mutate("live")}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" /> Go live
              </Button>
            )}
            <Button size="sm" className="rounded-none bg-brand-black hover:bg-brand-purple" onClick={() => advance.mutate()} disabled={advance.isPending}>
              <SkipForward className="mr-1.5 h-3.5 w-3.5" /> Advance
            </Button>
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="outline" className="rounded-none border-brand-line">
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
                </Button>
              }
              title="Reset show progress?"
              description="Every segment returns to pending, the show is set to idle and the current segment is cleared."
              confirmLabel="Reset progress"
              destructive
              onConfirm={() => reset.mutate()}
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-none border-brand-line"
              onClick={() => setDialog({ open: true, segment: null })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Segment
            </Button>
          </div>
        )}
      </header>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className={`border-l-2 bg-brand-black px-5 py-6 ${current ? "border-brand-gold" : "border-brand-purple"}`}>
          <p className="label-eyebrow text-brand-gold">On stage now</p>
          {current ? (
            <>
              <p className="mt-2 font-heading text-[30px] font-light leading-tight text-white">{current.title}</p>
              <p className="mt-1 text-[12.5px] text-white/50">
                {[current.designer_name, current.collection_name].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(current.model_emails || []).length ? (
                  current.model_emails.map((email) => (
                    <span key={email} className="border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/60">
                      {email.split("@")[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-white/35">No models listed</span>
                )}
              </div>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-white/50">
              {segments.length ? "The show has not started yet." : "Add segments to build the running order."}
            </p>
          )}
        </section>

        <section className="border border-brand-line bg-white px-5 py-6">
          <p className="label-eyebrow text-black/40">Up next</p>
          {next ? (
            <>
              <p className="mt-2 font-heading text-[26px] leading-tight text-brand-black">{next.title}</p>
              <p className="mt-1 text-[12.5px] text-black/50">
                {[next.designer_name, next.collection_name].filter(Boolean).join(" · ")}
              </p>
              <StatusPill status={next.status} className="mt-3" />
            </>
          ) : (
            <p className="mt-2 text-[13px] text-black/45">Nothing queued after this.</p>
          )}
        </section>
      </div>

      <div className="mb-2 flex items-end justify-between">
        <h2 className="font-heading text-[22px] text-brand-black">Running order</h2>
        <span className="text-[10px] uppercase tracking-[0.16em] text-black/30">Updates every 15s</span>
      </div>

      {segments.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No segments yet"
          description="Build the running order so backstage knows exactly what happens next."
        />
      ) : (
        <div className="border border-brand-line bg-white">
          {segments.map((segment) => {
            const isMine = (segment.model_emails || []).includes(user?.email);
            return (
              <article
                key={segment.id}
                className={`flex flex-wrap items-center gap-3 border-b border-brand-line px-4 py-3.5 last:border-b-0 ${
                  isMine ? "bg-brand-purple/[0.04]" : ""
                }`}
              >
                <span className="w-6 shrink-0 font-heading text-[17px] text-black/25">
                  {String(segment.position || 0).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-brand-black">{segment.title}</p>
                  <p className="truncate text-[11.5px] text-black/45">
                    {[segment.designer_name, segment.collection_name].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-black/35">
                    <Users className="h-3 w-3" /> {(segment.model_emails || []).length} models
                    {isMine && <span className="ml-1 text-brand-purple">· you're in this segment</span>}
                  </p>
                </div>
                <StatusPill status={segment.status} />
                {canControl && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={segment.status}
                      onChange={(e) => status.mutate({ id: segment.id, status: e.target.value })}
                      className="h-8 border border-brand-line bg-white px-1.5 text-[11px]"
                      aria-label={`Set status for ${segment.title}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="ready">Ready</option>
                      <option value="on_deck">On deck</option>
                      <option value="on_stage">On stage</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => setDialog({ open: true, segment })}
                      className="text-black/30 hover:text-brand-purple"
                      aria-label={`Edit ${segment.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {canControl && (
        <SegmentFormDialog
          event={event}
          segment={dialog.segment}
          models={models.map((m) => ({ email: m.user_email, name: m.full_name || m.user_email }))}
          open={dialog.open}
          onOpenChange={(open) => setDialog({ open, segment: open ? dialog.segment : null })}
        />
      )}
    </div>
  );
}
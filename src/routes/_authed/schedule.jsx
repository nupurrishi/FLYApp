import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ListChecks, Plus, Rows3 } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import AgendaView from "@/components/schedule/AgendaView";
import CalendarView from "@/components/schedule/CalendarView";
import ScheduleFormDialog from "@/components/schedule/ScheduleFormDialog";
import TimelineView from "@/components/schedule/TimelineView";
import { CATEGORIES, categoryLabel } from "@/components/schedule/categories";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { getOperationsWorkspace, getSchedule } from "@/lib/server-fns";
import { zoneLabel } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/schedule")({
  head: () => ({ meta: [{ title: "Schedule · Fly Showcase" }] }),
  component: SchedulePage,
});

const VIEWS = [
  { value: "agenda", label: "Agenda", icon: ListChecks },
  { value: "timeline", label: "Timeline", icon: Rows3 },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
];

function SchedulePage() {
  const { isAdmin, user, role } = useWorkspace();
  return (
    <EventGate>
      {(event) => <ScheduleContent event={event} isAdmin={isAdmin} role={role} user={user} />}
    </EventGate>
  );
}

function ScheduleContent({ event, isAdmin, role, user }) {
  const canManage = isAdmin || role === "stage_manager";
  const [view, setView] = useState("agenda");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialog, setDialog] = useState({ open: false, item: null });

  const scheduleQuery = useQuery({
    queryKey: ["schedule", event.id],
    queryFn: () => getSchedule({ data: { event_id: event.id } }),
  });
  const teamQuery = useQuery({
    queryKey: ["operations-workspace", event.id],
    queryFn: () => getOperationsWorkspace({ data: { event_id: event.id } }),
    enabled: canManage,
  });

  const items = useMemo(() => {
    let rows = scheduleQuery.data || [];
    if (category !== "all") rows = rows.filter((item) => item.category === category);
    if (status !== "all") rows = rows.filter((item) => item.status === status);
    if (selectedDate) rows = rows.filter((item) => item.date === selectedDate);
    if (mineOnly) {
      rows = rows.filter(
        (item) => (item.assigned_emails || []).includes(user?.email) || (item.audience === "all" && !isAdmin),
      );
    }
    return rows;
  }, [scheduleQuery.data, category, status, selectedDate, mineOnly, user, isAdmin]);

  function openEditor(item) {
    setDialog({ open: true, item });
  }

  return (
    <div>
      <PageHeader
        eyebrow={event.name}
        title="Schedule"
        description="Call times, fittings, rehearsals and show-day activity — in your event's time zone."
        actions={
          canManage ? (
            <Button
              className="rounded-none bg-brand-black hover:bg-brand-purple"
              onClick={() => setDialog({ open: true, item: null })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add item
            </Button>
          ) : null
        }
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-brand-line bg-white">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                onClick={() => setView(option.value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition ${
                  view === option.value ? "bg-brand-black text-white" : "text-black/50 hover:text-brand-black"
                }`}
              >
                <option.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 border border-brand-line bg-white px-2 text-[12px] text-black/70"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 border border-brand-line bg-white px-2 text-[12px] text-black/70"
          >
            <option value="all">Any status</option>
            <option value="upcoming">Upcoming</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => setMineOnly((value) => !value)}
            className={`h-9 border px-3 text-[11px] uppercase tracking-[0.12em] transition ${
              mineOnly ? "border-brand-purple bg-brand-purple text-white" : "border-brand-line bg-white text-black/55"
            }`}
          >
            Only mine
          </button>
          {(category !== "all" || status !== "all" || selectedDate || mineOnly) && (
            <button
              onClick={() => {
                setCategory("all");
                setStatus("all");
                setSelectedDate(null);
                setMineOnly(false);
              }}
              className="text-[11px] uppercase tracking-[0.12em] text-brand-purple"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-[11px] text-black/35">
          {items.length} item{items.length === 1 ? "" : "s"} · times in {zoneLabel(event.timezone)}
          {category !== "all" ? ` · ${categoryLabel(category)}` : ""}
        </p>
      </div>

      {scheduleQuery.isLoading ? (
        <Loading label="Loading schedule" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing on the schedule"
          description={
            canManage
              ? "Add call times, fittings and rehearsals so your team knows exactly where to be."
              : "Your production team hasn't published anything for these filters yet."
          }
        />
      ) : view === "agenda" ? (
        <AgendaView items={items} canManage={canManage} onEdit={openEditor} />
      ) : view === "timeline" ? (
        <div className="border border-brand-line bg-white py-6 pr-4">
          <TimelineView items={items} canManage={canManage} onEdit={openEditor} />
        </div>
      ) : (
        <div className="space-y-4">
          <CalendarView items={scheduleQuery.data || []} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <AgendaView items={items} canManage={canManage} onEdit={openEditor} />
        </div>
      )}

      {canManage && (
        <ScheduleFormDialog
          event={event}
          item={dialog.item}
          members={teamQuery.data?.models || []}
          open={dialog.open}
          onOpenChange={(open) => setDialog({ open, item: open ? dialog.item : null })}
        />
      )}
    </div>
  );
}

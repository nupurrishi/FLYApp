import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Check } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/manage-fns";
import { getNotifications } from "@/lib/server-fns";
import { relativeTime } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Fly Showcase" }] }),
  component: NotificationsPage,
});

const TYPE_COLOR = {
  schedule: "bg-brand-purple",
  assignment: "bg-brand-gold",
  fitting: "bg-brand-gold",
  hair_makeup: "bg-brand-purple",
  announcement: "bg-brand-black",
  show: "bg-brand-purple",
  opportunity: "bg-brand-gold",
  general: "bg-black/25",
};

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 45_000,
  });

  const readOne = useMutation({
    mutationFn: (id) => markNotificationRead({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries();
    },
  });

  const rows = data?.notifications || [];
  const visible = tab === "unread" ? rows.filter((n) => !n.read) : rows;
  const unread = rows.filter((n) => !n.read).length;
  const events = data?.events || [];

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Schedule changes, assignments, fittings, announcements and show updates."
        actions={
          unread > 0 ? (
            <Button variant="outline" className="rounded-none border-brand-line" onClick={() => readAll.mutate()}>
              <Check className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex gap-2">
        {[
          { value: "all", label: `All ${rows.length ? `(${rows.length})` : ""}` },
          { value: "unread", label: `Unread ${unread ? `(${unread})` : ""}` },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTab(option.value)}
            className={`border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] ${
              tab === option.value ? "border-brand-black bg-brand-black text-white" : "border-brand-line bg-white text-black/55"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading label="Loading notifications" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={tab === "unread" ? "You're all caught up" : "No notifications yet"}
          description="Announcements, schedule changes and assignments will appear here."
        />
      ) : (
        <div className="border border-brand-line bg-white">
          {visible.map((note) => {
            const eventName = events.find((e) => e.id === note.event_id)?.name;
            return (
              <article
                key={note.id}
                className={`flex gap-3 border-b border-brand-line px-4 py-4 last:border-b-0 ${note.read ? "" : "bg-brand-purple/[0.03]"}`}
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_COLOR[note.type] || "bg-black/25"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-[13.5px] ${note.read ? "text-black/70" : "font-bold text-brand-black"}`}>{note.title}</p>
                    {eventName && <span className="text-[10px] uppercase tracking-[0.12em] text-black/30">{eventName}</span>}
                  </div>
                  {note.message && <p className="mt-1 text-[12.5px] leading-relaxed text-black/55">{note.message}</p>}
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[10.5px] uppercase tracking-[0.12em] text-black/30">{relativeTime(note.created_date)}</span>
                    {note.link && (
                      <a href={note.link} className="text-[11px] uppercase tracking-[0.12em] text-brand-purple hover:underline">
                        Open
                      </a>
                    )}
                    {!note.read && (
                      <button
                        onClick={() => readOne.mutate(note.id)}
                        className="text-[11px] uppercase tracking-[0.12em] text-black/35 hover:text-brand-black"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rows.length === 0 && !isLoading && (
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-black/35">
          <Bell className="h-3.5 w-3.5" /> Notifications are sent by the production team.
        </p>
      )}
    </div>
  );
}
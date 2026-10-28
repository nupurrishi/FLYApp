import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import AdminTabs from "@/components/admin/AdminTabs";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import FormField from "@/components/common/FormField";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendAnnouncement } from "@/lib/manage-fns";
import { getAdminWorkspace } from "@/lib/server-fns";
import { relativeTime } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/admin/announcements")({
  head: () => ({ meta: [{ title: "Announcements · Fly Showcase" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return <EventGate>{(event) => <AnnouncementsContent event={event} />}</EventGate>;
}

function AnnouncementsContent({ event }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", message: "", audience: "all", pinned: false });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspace", event.id],
    queryFn: () => getAdminWorkspace({ data: { event_id: event.id } }),
  });

  const send = useMutation({
    mutationFn: () => sendAnnouncement({ data: { ...form, event_id: event.id } }),
    onSuccess: () => {
      toast.success("Announcement sent");
      setForm({ title: "", message: "", audience: "all", pinned: false });
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "The announcement could not be sent"),
  });

  return (
    <div>
      <PageHeader
        eyebrow={`${event.name} · communications`}
        title="Announcements"
        description="Send an update to everyone on the event, or just the models or designers."
      />
      <AdminTabs />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form
          className="space-y-4 border border-brand-line bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.message.trim()) {
              toast.error("Add a title and a message");
              return;
            }
            send.mutate();
          }}
        >
          <FormField label="Title" required>
            <Input
              className="h-11 rounded-none border-brand-line bg-white"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Call time moved to 3:00 PM"
            />
          </FormField>
          <FormField label="Message" required>
            <Textarea
              className="min-h-28 rounded-none border-brand-line bg-white"
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Be at the venue by 2:30 PM in full hair and makeup."
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Audience">
              <select
                className="h-11 w-full rounded-none border border-brand-line bg-white px-3 text-sm"
                value={form.audience}
                onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
              >
                <option value="all">Everyone</option>
                <option value="models">Models only</option>
                <option value="designers">Designers only</option>
              </select>
            </FormField>
            <label className="mt-6 flex items-center gap-2 text-[12.5px] text-black/60">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))}
                className="h-3.5 w-3.5 accent-[#81247C]"
              />
              Pin to the top
            </label>
          </div>
          <Button type="submit" disabled={send.isPending} className="w-full rounded-none bg-brand-black hover:bg-brand-purple">
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1.5 h-4 w-4" /> Send announcement</>}
          </Button>
        </form>

        <section>
          <h2 className="mb-2 font-heading text-[20px] text-brand-black">Sent announcements</h2>
          {isLoading ? (
            <Loading label="Loading announcements" />
          ) : (data?.announcements || []).length === 0 ? (
            <EmptyState icon={Megaphone} title="Nothing sent yet" description="Announcements appear here once delivered." />
          ) : (
            <div className="border border-brand-line bg-white">
              {data.announcements.map((note) => (
                <article key={note.id} className="border-b border-brand-line px-4 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-brand-black">{note.title}</p>
                    <StatusPill status={note.audience === "all" ? "active" : note.audience === "models" ? "published" : "ready"} />
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-black/60">{note.message}</p>
                  <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-black/30">
                    {note.audience} · {relativeTime(note.created_date)}
                    {note.pinned ? " · pinned" : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
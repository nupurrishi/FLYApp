import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, ListChecks, Radio, Scissors } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { sendAnnouncement } from "@/lib/manage-fns";

const shortcuts = {
  stage_manager: [
    { to: "/schedule", title: "Production schedule", description: "Coordinate calls, rehearsals, fittings and show-day timing.", icon: CalendarDays },
    { to: "/live", title: "Running order", description: "Prepare segments and control the live runway sequence.", icon: Radio },
  ],
  backstage_manager: [
    { to: "/backstage", title: "Readiness tasks", description: "Assign and track the final details each model needs to complete.", icon: ListChecks },
    { to: "/hair-makeup", title: "Hair & makeup", description: "Coordinate artists, stations, appointments and backstage notes.", icon: Scissors },
  ],
};

export default function OperationsDashboard({ event, role }) {
  const queryClient = useQueryClient();
  const actions = shortcuts[role] || [];
  const title = role === "stage_manager" ? "Stage operations" : "Backstage operations";
  const [announcement, setAnnouncement] = useState({ title: "", message: "", audience: "all" });
  const publish = useMutation({
    mutationFn: () => sendAnnouncement({ data: { ...announcement, event_id: event.id } }),
    onSuccess: () => {
      toast.success("Announcement sent to the event team");
      setAnnouncement({ title: "", message: "", audience: "all" });
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "The announcement could not be sent"),
  });

  return (
    <div>
      <PageHeader
        eyebrow={`${event.name} · ${role === "stage_manager" ? "stage team" : "backstage team"}`}
        title={title}
        description="Your event workspace is ready. Open an operations area to coordinate the team."
      />
      <section className="grid gap-3 sm:grid-cols-2" aria-label="Operations shortcuts">
        {actions.map(({ to, title: actionTitle, description, icon: Icon }) => (
          <Link key={to} to={to} className="group border border-brand-line bg-white p-5 transition hover:border-brand-purple">
            <Icon className="h-5 w-5 text-brand-purple" aria-hidden="true" />
            <h2 className="mt-4 flex items-center gap-2 font-heading text-[22px] text-brand-black">
              {actionTitle}<ArrowUpRight className="h-4 w-4 text-brand-purple" aria-hidden="true" />
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-black/55">{description}</p>
          </Link>
        ))}
      </section>
      <form
        className="mt-6 border border-brand-line bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!announcement.title.trim() || !announcement.message.trim()) {
            toast.error("Add a title and message before sending");
            return;
          }
          publish.mutate();
        }}
      >
        <h2 className="font-heading text-[22px] text-brand-black">Team announcement</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
          <input
            aria-label="Announcement title"
            value={announcement.title}
            onChange={(e) => setAnnouncement((value) => ({ ...value, title: e.target.value }))}
            maxLength={160}
            required
            placeholder="Title"
            className="h-10 border border-brand-line px-3 text-sm"
          />
          <select
            aria-label="Announcement audience"
            value={announcement.audience}
            onChange={(e) => setAnnouncement((value) => ({ ...value, audience: e.target.value }))}
            className="h-10 border border-brand-line bg-white px-3 text-sm"
          >
            <option value="all">Everyone</option>
            <option value="models">Models</option>
            <option value="designers">Designers</option>
          </select>
        </div>
        <textarea
          aria-label="Announcement message"
          value={announcement.message}
          onChange={(e) => setAnnouncement((value) => ({ ...value, message: e.target.value }))}
          maxLength={2000}
          required
          rows={3}
          placeholder="Share a clear event update…"
          className="mt-3 w-full border border-brand-line px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={publish.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
            {publish.isPending ? "Sending…" : "Send announcement"}
          </Button>
        </div>
      </form>
    </div>
  );
}

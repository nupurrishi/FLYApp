import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import AdminTabs from "@/components/admin/AdminTabs";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import { setApplicationStatus } from "@/lib/manage-fns";
import { getAdminWorkspace } from "@/lib/server-fns";
import { relativeTime } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/admin/applications")({
  head: () => ({ meta: [{ title: "Applications · Fly Showcase" }] }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return <EventGate>{(event) => <ApplicationsContent event={event} />}</EventGate>;
}

function ApplicationsContent({ event }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspace", event.id],
    queryFn: () => getAdminWorkspace({ data: { event_id: event.id } }),
  });

  const update = useMutation({
    mutationFn: ({ id, status }) => setApplicationStatus({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Application updated");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "The application could not be updated"),
  });

  const applications = data?.applications || [];

  return (
    <div>
      <PageHeader
        eyebrow={`${event.name} · casting`}
        title="Applications"
        description="Review everyone who applied to your published opportunities."
      />
      <AdminTabs />

      {isLoading ? (
        <Loading label="Loading applications" />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Publish a casting call from the opportunities page to start receiving applications."
        />
      ) : (
        <div className="border border-brand-line bg-white">
          {applications.map((application) => (
            <article key={application.id} className="border-b border-brand-line px-4 py-4 last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-brand-black">{application.full_name}</p>
                  <p className="text-[11.5px] text-black/45">{application.user_email}</p>
                  <p className="mt-1 text-[12.5px] text-brand-purple">{application.opportunity_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={application.status} />
                  <select
                    value={application.status}
                    onChange={(e) => update.mutate({ id: application.id, status: e.target.value })}
                    className="h-8 border border-brand-line bg-white px-1.5 text-[11px]"
                    aria-label="Application status"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>
              {application.message && (
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-brand-gold pl-3 text-[12.5px] leading-relaxed text-black/60">
                  {application.message}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-black/35">
                {application.portfolio_url && (
                  <a href={application.portfolio_url} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline">
                    Portfolio
                  </a>
                )}
                <span>{relativeTime(application.created_date)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
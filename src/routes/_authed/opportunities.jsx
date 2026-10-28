import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Compass, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import ApplyDialog from "@/components/opportunities/ApplyDialog";
import OpportunityFormDialog from "@/components/opportunities/OpportunityFormDialog";
import { Button } from "@/components/ui/button";
import { deleteOpportunity, saveOpportunity } from "@/lib/manage-fns";
import { getOpportunities } from "@/lib/server-fns";
import { formatLongDay } from "@/lib/show-time";

export const Route = createFileRoute("/_authed/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities · Fly Showcase" }] }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState({ open: false, opportunity: null });
  const [applying, setApplying] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => getOpportunities(),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteOpportunity({ data: { id } }),
    onSuccess: () => {
      toast.success("Opportunity deleted");
      queryClient.invalidateQueries();
    },
  });
  const close = useMutation({
    mutationFn: ({ opportunity, status }) => saveOpportunity({ data: { ...opportunity, status } }),
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error) => toast.error(error?.message || "The opportunity could not be updated"),
  });

  const isAdmin = data?.isAdmin;
  const opportunities = data?.opportunities || [];
  const applications = data?.applications || [];

  return (
    <div>
      <PageHeader
        eyebrow="Casting & participation"
        title="Opportunities"
        description="Casting calls, designer participation and future Fly Showcase productions."
        actions={
          isAdmin ? (
            <Button
              className="rounded-none bg-brand-black hover:bg-brand-purple"
              onClick={() => setEditing({ open: true, opportunity: null })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New opportunity
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <Loading label="Loading opportunities" />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No open opportunities"
          description={isAdmin ? "Publish a casting call to start collecting applications." : "New casting calls will appear here."}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {opportunities.map((opportunity) => {
            const applied = applications.find((a) => a.opportunity_id === opportunity.id);
            return (
              <article key={opportunity.id} className="flex flex-col border border-brand-line bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="label-eyebrow text-brand-purple">{opportunity.organization || "Fly Showcase"}</p>
                    <h2 className="mt-1 font-heading text-[23px] leading-tight text-brand-black">{opportunity.title}</h2>
                  </div>
                  <StatusPill status={opportunity.status} />
                </div>
                {opportunity.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-black/60">{opportunity.description}</p>
                )}
                {opportunity.requirements && (
                  <div className="mt-3">
                    <p className="label-eyebrow text-black/35">Requirements</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-black/60">{opportunity.requirements}</p>
                  </div>
                )}
                {opportunity.instructions && (
                  <div className="mt-3">
                    <p className="label-eyebrow text-black/35">How to apply</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-black/60">{opportunity.instructions}</p>
                  </div>
                )}
                <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[11.5px] text-black/45">
                  {opportunity.deadline && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> Closes {formatLongDay(opportunity.deadline)}
                    </span>
                  )}
                  {opportunity.contact && <span>{opportunity.contact}</span>}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-brand-line pt-3">
                  {applied ? (
                    <span className="flex items-center gap-2 text-[11.5px] text-black/50">
                      Applied <StatusPill status={applied.status} />
                    </span>
                  ) : opportunity.status === "open" && opportunity.applications_enabled ? (
                    <Button size="sm" className="rounded-none bg-brand-black hover:bg-brand-purple" onClick={() => setApplying(opportunity)}>
                      Apply now
                    </Button>
                  ) : (
                    <span className="text-[11.5px] text-black/40">Applications closed</span>
                  )}
                  {isAdmin && (
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => setEditing({ open: true, opportunity })} className="text-black/35 hover:text-brand-purple" aria-label="Edit opportunity">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => close.mutate({ opportunity, status: opportunity.status === "open" ? "closed" : "open" })}
                        className="text-[10px] uppercase tracking-[0.12em] text-black/40 hover:text-brand-purple"
                      >
                        {opportunity.status === "open" ? "Close" : "Reopen"}
                      </button>
                      <ConfirmDialog
                        trigger={
                          <button className="text-black/35 hover:text-red-600" aria-label="Delete opportunity">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        }
                        title="Delete this opportunity?"
                        description="The opportunity and every application attached to it will be removed."
                        confirmLabel="Delete"
                        destructive
                        onConfirm={() => remove.mutate(opportunity.id)}
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {applications.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-heading text-[22px] text-brand-black">Your applications</h2>
          <div className="border border-brand-line bg-white">
            {applications.map((application) => (
              <div key={application.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-line px-4 py-3 last:border-b-0">
                <div>
                  <p className="text-[13px] text-brand-black">{application.opportunity_title}</p>
                  <p className="text-[11px] text-black/40">{application.portfolio_url || "No link provided"}</p>
                </div>
                <StatusPill status={application.status} />
              </div>
            ))}
          </div>
          {isAdmin && (
            <Link to="/admin/applications" className="mt-2 inline-flex text-[11px] uppercase tracking-[0.14em] text-brand-purple hover:underline">
              Review all applications →
            </Link>
          )}
        </section>
      )}

      {isAdmin && (
        <OpportunityFormDialog
          opportunity={editing.opportunity}
          open={editing.open}
          onOpenChange={(open) => setEditing({ open, opportunity: open ? editing.opportunity : null })}
        />
      )}
      {applying && (
        <ApplyDialog opportunity={applying} open onOpenChange={(open) => !open && setApplying(null)} />
      )}
    </div>
  );
}
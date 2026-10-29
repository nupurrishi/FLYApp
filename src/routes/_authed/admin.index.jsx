import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AdminTabs from "@/components/admin/AdminTabs";
import MemberFormDialog from "@/components/admin/MemberFormDialog";
import ReadinessTasks from "@/components/admin/ReadinessTasks";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import StatusPill from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { removeMember, saveMember } from "@/lib/manage-fns";
import { getAdminWorkspace } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/admin/")({
  head: () => ({ meta: [{ title: "Admin Management · Fly Showcase" }] }),
  component: AdminTeamPage,
});

function AdminTeamPage() {
  return <EventGate>{(event) => <TeamContent event={event} />}</EventGate>;
}

function TeamContent({ event }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState({ open: false, member: null });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-workspace", event.id],
    queryFn: () => getAdminWorkspace({ data: { event_id: event.id } }),
  });

  const changeRole = useMutation({
    mutationFn: ({ member, role }) =>
      saveMember({
        data: {
          id: member.id,
          event_id: member.event_id,
          user_email: member.user_email,
          full_name: member.full_name,
          phone: member.phone || "",
          status: member.status,
          notes: member.notes || "",
          role,
        },
      }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "The role could not be changed"),
  });

  const remove = useMutation({
    mutationFn: (id) => removeMember({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed from event");
      queryClient.invalidateQueries();
    },
  });

  const members = data?.members || [];
  const models = members.filter((m) => m.role === "model");
  const designers = members.filter((m) => m.role === "designer");
  const stageManagers = members.filter((m) => m.role === "stage_manager");
  const backstageManagers = members.filter((m) => m.role === "backstage_manager");

  return (
    <div>
      <PageHeader
        eyebrow={`${event.name} · production team`}
        title="Admin Management"
        description="Who is on the event, what they can do, and the tasks they still owe."
        actions={
          <Button className="rounded-none bg-brand-black hover:bg-brand-purple" onClick={() => setDialog({ open: true, member: null })}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Add member
          </Button>
        }
      />
      <AdminTabs />

      {isLoading ? (
        <Loading label="Loading team" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Models", value: models.length },
              { label: "Designers", value: designers.length },
              { label: "Stage managers", value: stageManagers.length },
              { label: "Backstage managers", value: backstageManagers.length },
              { label: "Invited", value: members.filter((m) => m.status === "invited").length },
            ].map((stat) => (
              <div key={stat.label} className="border border-brand-line bg-white px-4 py-3">
                <p className="label-eyebrow text-black/40">{stat.label}</p>
                <p className="mt-1 font-heading text-[26px] leading-none text-brand-black">{stat.value}</p>
              </div>
            ))}
          </div>

          {members.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No one on this event yet"
              description="Add models and designers to build the production team."
              action={
                <Button className="rounded-none bg-brand-black hover:bg-brand-purple" onClick={() => setDialog({ open: true, member: null })}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add the first member
                </Button>
              }
            />
          ) : (
            <section className="border border-brand-line bg-white">
              {members.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center gap-3 border-b border-brand-line px-4 py-3 last:border-b-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-black text-[11px] font-bold text-brand-gold">
                    {(member.full_name || member.user_email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-brand-black">{member.full_name || member.user_email}</p>
                    <p className="truncate text-[11.5px] text-black/40">{member.user_email}</p>
                  </div>
                  <StatusPill status={member.status} />
                  <select
                    value={member.role}
                    onChange={(e) => changeRole.mutate({ member, role: e.target.value })}
                    className="h-8 border border-brand-line bg-white px-1.5 text-[11px] capitalize"
                    aria-label={`Role for ${member.full_name || member.user_email}`}
                  >
                    <option value="model">Model</option>
                    <option value="designer">Designer</option>
                    <option value="stage_manager">Stage Manager</option>
                    <option value="backstage_manager">Backstage Manager</option>
                  </select>
                  <button
                    onClick={() => setDialog({ open: true, member })}
                    className="text-black/30 hover:text-brand-purple"
                    aria-label="Edit member"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <ConfirmDialog
                    trigger={
                      <button className="text-black/30 hover:text-red-600" aria-label="Remove member">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    }
                    title="Remove this person from the event?"
                    description="They lose access to this event's schedule, looks and appointments. Their account stays active."
                    confirmLabel="Remove from event"
                    destructive
                    onConfirm={() => remove.mutate(member.id)}
                  />
                </div>
              ))}
            </section>
          )}

          <ReadinessTasks event={event} models={models} tasks={data?.tasks || []} />

          <MemberFormDialog
            event={event}
            member={dialog.member}
            users={data?.users || []}
            members={members}
            open={dialog.open}
            onOpenChange={(open) => setDialog({ open, member: open ? dialog.member : null })}
          />
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import StatusPill from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { deleteAssignment, saveAssignment, setAssignmentStatus } from "@/lib/manage-fns";

const DETAILS = [
  ["description", "Garment"],
  ["styling_instructions", "Styling"],
  ["accessories", "Accessories"],
  ["footwear", "Footwear"],
  ["fitting_notes", "Fitting notes"],
  ["notes", "Operational notes"],
];

export default function LookDetailDialog({ look, collections, models, role, canManage, user, onEdit, onClose }) {
  const queryClient = useQueryClient();
  const [active, setActive] = useState(0);
  const [modelEmail, setModelEmail] = useState("");

  const assign = useMutation({
    mutationFn: () =>
      saveAssignment({
        data: {
          event_id: look.event_id,
          look_id: look.id,
          model_email: modelEmail,
          model_name: models.find((m) => m.user_email === modelEmail)?.full_name || modelEmail,
        },
      }),
    onSuccess: () => {
      toast.success("Model assigned");
      setModelEmail("");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "Could not assign the model"),
  });

  const unassign = useMutation({
    mutationFn: (id) => deleteAssignment({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const confirm = useMutation({
    mutationFn: (assignment) => setAssignmentStatus({ data: { id: assignment.id, status: "confirmed" } }),
    onSuccess: () => {
      toast.success("Look confirmed");
      queryClient.invalidateQueries();
    },
  });

  const images = look.images || [];
  const collection = collections.find((c) => c.id === look.collection_id);
  const myAssignment = (look.assignments || []).find((a) => a.model_email === user?.email);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-none border-brand-line p-0">
        <div className="grid md:grid-cols-2">
          <div className="bg-brand-bone">
            <div className="aspect-[3/4] w-full overflow-hidden bg-brand-bone">
              {images[active] ? (
                <Image src={images[active]} alt={look.name} className="h-full w-full" fittingType="fill" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-black/25">
                  <span className="font-heading text-3xl tracking-[0.3em]">FLY</span>
                  <span className="text-[10px] uppercase tracking-[0.18em]">No reference image</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-1.5 p-2">
                {images.map((url, index) => (
                  <button
                    key={url}
                    onClick={() => setActive(index)}
                    className={`h-14 w-11 overflow-hidden border ${index === active ? "border-brand-purple" : "border-transparent"}`}
                  >
                    <Image src={url} alt="" className="h-full w-full" fittingType="fill" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5">
            <DialogHeader className="text-left">
              <p className="label-eyebrow text-brand-purple">
                {look.designer_name || "Designer"}
                {collection ? ` · ${collection.name}` : ""}
              </p>
              <DialogTitle className="mt-1 font-heading text-[26px] font-medium leading-tight text-brand-black">
                {look.number ? `${look.number} · ` : ""}
                {look.name}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill status={look.prep_status} />
              {myAssignment && <StatusPill status={myAssignment.status} />}
            </div>

            <dl className="mt-4 space-y-3">
              {DETAILS.filter(([key]) => look[key]).map(([key, label]) => (
                <div key={key}>
                  <dt className="label-eyebrow text-black/35">{label}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-black/65">{look[key]}</dd>
                </div>
              ))}
            </dl>

            {role === "model" && myAssignment && myAssignment.status === "assigned" && (
              <Button
                size="sm"
                onClick={() => confirm.mutate(myAssignment)}
                className="mt-4 w-full rounded-none bg-brand-purple hover:bg-brand-black"
              >
                <Check className="mr-1.5 h-3.5 w-3.5" /> Confirm this look
              </Button>
            )}

            {canManage && (
              <div className="mt-5 border-t border-brand-line pt-4">
                <div className="flex items-center justify-between">
                  <p className="label-eyebrow text-black/40">Assigned models</p>
                  <button onClick={onEdit} className="flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-brand-purple">
                    <Pencil className="h-3 w-3" /> Edit look
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {(look.assignments || []).length === 0 && (
                    <p className="text-[12px] text-black/40">No model assigned yet.</p>
                  )}
                  {(look.assignments || []).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between gap-2 border border-brand-line px-2.5 py-1.5">
                      <span className="truncate text-[12.5px] text-brand-black">
                        {assignment.model_name || assignment.model_email}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusPill status={assignment.status} />
                        <button
                          onClick={() => unassign.mutate(assignment.id)}
                          className="text-black/25 hover:text-red-600"
                          aria-label="Remove assignment"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {models.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    <select
                      value={modelEmail}
                      onChange={(e) => setModelEmail(e.target.value)}
                      className="h-9 flex-1 border border-brand-line bg-white px-2 text-[12px]"
                    >
                      <option value="">Assign a model…</option>
                      {models.map((model) => (
                        <option key={model.user_email} value={model.user_email}>
                          {model.full_name || model.user_email}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!modelEmail || assign.isPending}
                      onClick={() => assign.mutate()}
                      className="rounded-none bg-brand-black hover:bg-brand-purple"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
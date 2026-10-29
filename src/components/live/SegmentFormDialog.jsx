import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteSegment, saveSegment } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

export default function SegmentFormDialog({ event, segment, models, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      title: "",
      designer_name: "",
      collection_name: "",
      model_emails: [],
      duration_min: 5,
      notes: "",
      status: "pending",
      ...(segment || {}),
    });
  }, [open, segment]);

  const save = useMutation({
    mutationFn: () =>
      saveSegment({
        data: {
          ...form,
          id: segment?.id,
          event_id: event.id,
          duration_min: Number(form.duration_min) || 0,
          model_emails: form.model_emails || [],
        },
      }),
    onSuccess: () => {
      toast.success(segment ? "Segment updated" : "Segment added");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The segment could not be saved"),
  });

  const remove = useMutation({
    mutationFn: () => deleteSegment({ data: { id: segment.id } }),
    onSuccess: () => {
      toast.success("Segment removed");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const toggleModel = (email) =>
    setForm((prev) => {
      const list = prev.model_emails || [];
      return {
        ...prev,
        model_emails: list.includes(email) ? list.filter((e) => e !== email) : [...list, email],
      };
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {segment ? "Edit segment" : "Add segment"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title?.trim()) {
              toast.error("Give the segment a title");
              return;
            }
            save.mutate();
          }}
        >
          <FormField label="Segment title" required>
            <Input className={inputClass} value={form.title || ""} onChange={set("title")} placeholder="Opening — Artmosphere" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Designer">
              <Input className={inputClass} value={form.designer_name || ""} onChange={set("designer_name")} />
            </FormField>
            <FormField label="Collection">
              <Input className={inputClass} value={form.collection_name || ""} onChange={set("collection_name")} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Running order position">
              <Input type="number" min="1" className={inputClass} value={form.position ?? ""} onChange={set("position")} placeholder="Auto" />
            </FormField>
            <FormField label="Duration (minutes)">
              <Input type="number" min="0" className={inputClass} value={form.duration_min ?? ""} onChange={set("duration_min")} />
            </FormField>
          </div>
          <FormField label="Status">
            <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
              <option value="on_deck">On deck</option>
              <option value="on_stage">On stage</option>
              <option value="completed">Completed</option>
            </select>
          </FormField>
          {models.length > 0 && (
            <div>
              <p className="label-eyebrow mb-2 text-black/45">Models in this segment</p>
              <div className="max-h-40 overflow-y-auto border border-brand-line">
                {models.map((model) => (
                  <label
                    key={model.email}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-brand-line px-3 py-2 text-[12.5px] last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={(form.model_emails || []).includes(model.email)}
                      onChange={() => toggleModel(model.email)}
                      className="h-3.5 w-3.5 accent-[#81247C]"
                    />
                    <span className="flex-1 text-brand-black">{model.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <FormField label="Notes">
            <Textarea className="min-h-16 rounded-none border-brand-line bg-white" value={form.notes || ""} onChange={set("notes")} />
          </FormField>
          <div className="flex items-center justify-between gap-2 pt-2">
            {segment ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" className="rounded-none text-red-600 hover:bg-red-50">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                }
                title="Remove this segment?"
                description="It will be removed from the running order."
                confirmLabel="Remove"
                destructive
                onConfirm={() => remove.mutate()}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save segment"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
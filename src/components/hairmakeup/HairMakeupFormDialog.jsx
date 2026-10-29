import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FormField from "@/components/common/FormField";
import ImageListField from "@/components/common/ImageListField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteHairMakeup, saveHairMakeup } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

export default function HairMakeupFormDialog({ event, appointment, models, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      model_email: models[0]?.email || "",
      model_name: models[0]?.name || "",
      date: event.start_date,
      start_time: "",
      end_time: "",
      station: "",
      artist: "",
      instructions: "",
      reference_images: [],
      status: "not_started",
      notes: "",
      ...(appointment || {}),
    });
  }, [open, appointment, models, event.start_date]);

  const save = useMutation({
    mutationFn: () =>
      saveHairMakeup({
        data: {
          ...form,
          id: appointment?.id,
          event_id: event.id,
          reference_images: form.reference_images || [],
        },
      }),
    onSuccess: () => {
      toast.success(appointment ? "Appointment updated" : "Appointment booked");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The appointment could not be saved"),
  });

  const remove = useMutation({
    mutationFn: () => deleteHairMakeup({ data: { id: appointment.id } }),
    onSuccess: () => {
      toast.success("Appointment removed");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {appointment ? "Edit appointment" : "Book hair & makeup"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.model_email || !form.date) {
              toast.error("Choose a model and a date");
              return;
            }
            save.mutate();
          }}
        >
          <FormField label="Model" required>
            <select
              className={`${inputClass} w-full px-3 text-sm`}
              value={form.model_email || ""}
              onChange={(e) => {
                const model = models.find((m) => m.email === e.target.value);
                setForm((prev) => ({ ...prev, model_email: e.target.value, model_name: model?.name || "" }));
              }}
            >
              {models.length === 0 && <option value="">No models on this event yet</option>}
              {models.map((model) => (
                <option key={model.email} value={model.email}>
                  {model.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Date" required>
              <Input type="date" className={inputClass} value={form.date || ""} onChange={set("date")} />
            </FormField>
            <FormField label="Start">
              <Input type="time" className={inputClass} value={form.start_time || ""} onChange={set("start_time")} />
            </FormField>
            <FormField label="End">
              <Input type="time" className={inputClass} value={form.end_time || ""} onChange={set("end_time")} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Station">
              <Input className={inputClass} value={form.station || ""} onChange={set("station")} placeholder="Chair 3 — backstage left" />
            </FormField>
            <FormField label="Artist">
              <Input className={inputClass} value={form.artist || ""} onChange={set("artist")} placeholder="Artist or lead" />
            </FormField>
          </div>
          <FormField label="Status">
            <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </FormField>
          <FormField label="Instructions" hint="Visible to the model and the production team">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.instructions || ""} onChange={set("instructions")} />
          </FormField>
          <ImageListField
            label="Reference images"
            eventId={event?.id}
            value={form.reference_images || []}
            onChange={(reference_images) => setForm((prev) => ({ ...prev, reference_images }))}
          />
          <FormField label="Private notes">
            <Textarea className="min-h-16 rounded-none border-brand-line bg-white" value={form.notes || ""} onChange={set("notes")} />
          </FormField>
          <div className="flex items-center justify-between gap-2 pt-2">
            {appointment ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" className="rounded-none text-red-600 hover:bg-red-50">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                }
                title="Remove this appointment?"
                description="The model will no longer see this hair & makeup slot."
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
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

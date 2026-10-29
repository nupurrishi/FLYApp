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
import { CATEGORIES } from "@/components/schedule/categories";
import { deleteScheduleItem, saveScheduleItem } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

const blank = {
  title: "",
  date: "",
  start_time: "",
  end_time: "",
  category: "call_time",
  status: "upcoming",
  location: "",
  description: "",
  instructions: "",
  audience: "all",
  assigned_emails: [],
};

export default function ScheduleFormDialog({ event, item, members = [], open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (!open) return;
    setForm({ ...blank, ...(item || {}), assigned_emails: item?.assigned_emails || [] });
  }, [open, item]);

  const save = useMutation({
    mutationFn: () =>
      saveScheduleItem({
        data: {
          ...form,
          id: item?.id,
          event_id: event.id,
          timezone: event.timezone,
          assigned_emails: form.assigned_emails.filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success(item ? "Schedule updated" : "Schedule item added");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The schedule item could not be saved"),
  });

  const remove = useMutation({
    mutationFn: () => deleteScheduleItem({ data: { id: item.id } }),
    onSuccess: () => {
      toast.success("Schedule item deleted");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const toggleEmail = (email) =>
    setForm((prev) => ({
      ...prev,
      assigned_emails: prev.assigned_emails.includes(email)
        ? prev.assigned_emails.filter((e) => e !== email)
        : [...prev.assigned_emails, email],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {item ? "Edit schedule item" : "Add schedule item"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.date) {
              toast.error("A title and a date are required");
              return;
            }
            save.mutate();
          }}
        >
          <FormField label="Title" required>
            <Input className={inputClass} value={form.title} onChange={set("title")} placeholder="Model call time" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Date" required>
              <Input type="date" className={inputClass} value={form.date} onChange={set("date")} />
            </FormField>
            <FormField label="Start">
              <Input type="time" className={inputClass} value={form.start_time || ""} onChange={set("start_time")} />
            </FormField>
            <FormField label="End">
              <Input type="time" className={inputClass} value={form.end_time || ""} onChange={set("end_time")} />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.category} onChange={set("category")}>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FormField>
          </div>
          <FormField label="Location" hint="Room, station or address">
            <Input className={inputClass} value={form.location || ""} onChange={set("location")} />
          </FormField>
          <FormField label="Description">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.description || ""} onChange={set("description")} />
          </FormField>
          <FormField label="Operational instructions">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.instructions || ""} onChange={set("instructions")} placeholder="What should participants do or bring?" />
          </FormField>
          <FormField label="Audience">
            <select className={`${inputClass} w-full px-3 text-sm`} value={form.audience} onChange={set("audience")}>
              <option value="all">Everyone on the event</option>
              <option value="models">Models only</option>
              <option value="designers">Designers only</option>
            </select>
          </FormField>
          {members.length > 0 && (
            <div>
              <p className="label-eyebrow mb-2 text-black/45">Assign specific people (optional)</p>
              <div className="max-h-40 overflow-y-auto border border-brand-line">
                {members.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-brand-line px-3 py-2 text-[12.5px] last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={form.assigned_emails.includes(member.user_email)}
                      onChange={() => toggleEmail(member.user_email)}
                      className="h-3.5 w-3.5 accent-[#81247C]"
                    />
                    <span className="flex-1 text-brand-black">{member.full_name || member.user_email}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-black/35">{member.role}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-black/35">
                Leave empty to notify the audience above.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-2">
            {item ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" className="rounded-none text-red-600 hover:bg-red-50">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                }
                title="Delete this schedule item?"
                description="Participants will no longer see it on their schedule."
                confirmLabel="Delete"
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
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : item ? "Save changes" : "Add to schedule"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
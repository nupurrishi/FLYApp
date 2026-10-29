import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FormField from "@/components/common/FormField";
import ImageField from "@/components/common/ImageField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveEvent } from "@/lib/manage-fns";

const blank = {
  name: "",
  tagline: "",
  description: "",
  cover_image: "",
  start_date: "",
  end_date: "",
  timezone: "America/Chicago",
  venue_name: "",
  venue_address: "",
  city: "",
  status: "planning",
  notes: "",
};

const inputClass = "h-11 rounded-none border-brand-line bg-white";

export default function EventFormDialog({ event, trigger }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(event ? { ...blank, ...event } : blank);

  const save = useMutation({
    mutationFn: () => saveEvent({ data: { ...form, id: event?.id } }),
    onSuccess: () => {
      toast.success(event ? "Event updated" : "Event created");
      queryClient.invalidateQueries();
      setOpen(false);
    },
    onError: (error) => toast.error(error?.message || "The event could not be saved"),
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {event ? "Edit event" : "New Fly Showcase event"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.start_date) {
              toast.error("An event needs a name and a start date");
              return;
            }
            save.mutate();
          }}
        >
          <FormField label="Event name" required>
            <Input className={inputClass} value={form.name} onChange={set("name")} placeholder="Artmosphere — Season 7" />
          </FormField>
          <FormField label="Tagline">
            <Input className={inputClass} value={form.tagline || ""} onChange={set("tagline")} placeholder="A night of texture, movement and light" />
          </FormField>
          <FormField label="Description">
            <Textarea className="min-h-24 rounded-none border-brand-line bg-white" value={form.description || ""} onChange={set("description")} />
          </FormField>
          <ImageField label="Event artwork" value={form.cover_image} onChange={(url) => setForm((p) => ({ ...p, cover_image: url }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" required>
              <Input type="date" className={inputClass} value={form.start_date || ""} onChange={set("start_date")} />
            </FormField>
            <FormField label="End date">
              <Input type="date" className={inputClass} value={form.end_date || ""} onChange={set("end_date")} />
            </FormField>
            <FormField label="Venue">
              <Input className={inputClass} value={form.venue_name || ""} onChange={set("venue_name")} placeholder="The Grand Hall" />
            </FormField>
            <FormField label="City">
              <Input className={inputClass} value={form.city || ""} onChange={set("city")} placeholder="Dallas, TX" />
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <Input className={inputClass} value={form.venue_address || ""} onChange={set("venue_address")} />
            </FormField>
            <FormField label="Event time zone" hint="All call times are shown in this zone">
              <Input className={inputClass} value={form.timezone} onChange={set("timezone")} placeholder="America/Chicago" />
            </FormField>
            <FormField label="Status">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
                <option value="planning">Planning</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" className="rounded-none" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : event ? "Save changes" : "Create event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveOpportunity } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

export default function OpportunityFormDialog({ opportunity, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      title: "",
      description: "",
      organization: "Fly Showcase",
      requirements: "",
      deadline: "",
      status: "open",
      instructions: "",
      contact: "",
      applications_enabled: true,
      ...(opportunity || {}),
    });
  }, [open, opportunity]);

  const save = useMutation({
    mutationFn: () => saveOpportunity({ data: { ...form, id: opportunity?.id } }),
    onSuccess: () => {
      toast.success(opportunity ? "Opportunity updated" : "Opportunity published");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The opportunity could not be saved"),
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {opportunity ? "Edit opportunity" : "New opportunity"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title?.trim()) {
              toast.error("Give the opportunity a title");
              return;
            }
            save.mutate();
          }}
        >
          <FormField label="Title" required>
            <Input className={inputClass} value={form.title || ""} onChange={set("title")} placeholder="Season 7 runway model casting" />
          </FormField>
          <FormField label="Organization">
            <Input className={inputClass} value={form.organization || ""} onChange={set("organization")} />
          </FormField>
          <FormField label="Description">
            <Textarea className="min-h-24 rounded-none border-brand-line bg-white" value={form.description || ""} onChange={set("description")} />
          </FormField>
          <FormField label="Eligibility requirements">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.requirements || ""} onChange={set("requirements")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Deadline">
              <Input type="date" className={inputClass} value={form.deadline || ""} onChange={set("deadline")} />
            </FormField>
            <FormField label="Status">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>
          <FormField label="Application instructions">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.instructions || ""} onChange={set("instructions")} />
          </FormField>
          <FormField label="Contact / next steps">
            <Input className={inputClass} value={form.contact || ""} onChange={set("contact")} />
          </FormField>
          <label className="flex items-center gap-2 text-[12.5px] text-black/60">
            <input
              type="checkbox"
              checked={!!form.applications_enabled}
              onChange={(e) => setForm((prev) => ({ ...prev, applications_enabled: e.target.checked }))}
              className="h-3.5 w-3.5 accent-[#81247C]"
            />
            Accept applications through Fly Showcase
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
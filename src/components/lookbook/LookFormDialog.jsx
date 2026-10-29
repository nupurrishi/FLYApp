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
import { deleteLook, saveLook } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

const blank = {
  number: "",
  name: "",
  collection_id: "",
  images: [],
  description: "",
  accessories: "",
  footwear: "",
  styling_instructions: "",
  fitting_notes: "",
  prep_status: "draft",
  notes: "",
};

export default function LookFormDialog({ event, look, collections, designers, currentEmail, isAdmin, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...blank, designer_email: currentEmail });

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blank,
      ...(look || {}),
      images: look?.images || [],
      designer_email: look?.designer_email || (isAdmin ? designers[0]?.user_email || "" : currentEmail),
    });
  }, [open, look, isAdmin, currentEmail, designers]);

  const save = useMutation({
    mutationFn: () =>
      saveLook({
        data: {
          ...form,
          id: look?.id,
          event_id: event.id,
          collection_id: form.collection_id || undefined,
          designer_name:
            form.designer_name ||
            designers.find((d) => d.user_email === form.designer_email)?.full_name ||
            currentEmail,
        },
      }),
    onSuccess: () => {
      toast.success(look ? "Look updated" : "Look created");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The look could not be saved"),
  });

  const remove = useMutation({
    mutationFn: () => deleteLook({ data: { id: look.id } }),
    onSuccess: () => {
      toast.success("Look deleted");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">{look ? "Edit look" : "New look"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim() || !form.designer_email) {
              toast.error("A look name and designer are required");
              return;
            }
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
            <FormField label="Look no.">
              <Input className={inputClass} value={form.number || ""} onChange={set("number")} placeholder="01" />
            </FormField>
            <FormField label="Look name" required>
              <Input className={inputClass} value={form.name} onChange={set("name")} placeholder="Midnight silk column" />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Collection">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.collection_id || ""} onChange={set("collection_id")}>
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </FormField>
            {isAdmin ? (
              <FormField label="Designer">
                <select
                  className={`${inputClass} w-full px-3 text-sm`}
                  value={form.designer_email}
                  onChange={(e) => {
                    const designer = designers.find((d) => d.user_email === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      designer_email: e.target.value,
                      designer_name: designer?.full_name || "",
                    }));
                  }}
                >
                  {designers.map((designer) => (
                    <option key={designer.user_email} value={designer.user_email}>
                      {designer.full_name}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="Preparation status">
                <select className={`${inputClass} w-full px-3 text-sm`} value={form.prep_status} onChange={set("prep_status")}>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In progress</option>
                  <option value="ready">Ready</option>
                  <option value="missing">Missing information</option>
                </select>
              </FormField>
            )}
          </div>
          {isAdmin && (
            <FormField label="Preparation status">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.prep_status} onChange={set("prep_status")}>
                <option value="draft">Draft</option>
                <option value="in_progress">In progress</option>
                <option value="ready">Ready</option>
                <option value="missing">Missing information</option>
              </select>
            </FormField>
          )}
          <ImageListField eventId={event?.id} value={form.images} onChange={(images) => setForm((prev) => ({ ...prev, images }))} />
          <FormField label="Garment description">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.description || ""} onChange={set("description")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Accessories">
              <Input className={inputClass} value={form.accessories || ""} onChange={set("accessories")} placeholder="Gold cuff, drop earrings" />
            </FormField>
            <FormField label="Footwear">
              <Input className={inputClass} value={form.footwear || ""} onChange={set("footwear")} placeholder="Black stiletto, size 8" />
            </FormField>
          </div>
          <FormField label="Styling instructions">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.styling_instructions || ""} onChange={set("styling_instructions")} placeholder="How the look is worn on the runway" />
          </FormField>
          <FormField label="Fitting notes">
            <Textarea className="min-h-16 rounded-none border-brand-line bg-white" value={form.fitting_notes || ""} onChange={set("fitting_notes")} />
          </FormField>
          <FormField label="Operational notes">
            <Textarea className="min-h-16 rounded-none border-brand-line bg-white" value={form.notes || ""} onChange={set("notes")} />
          </FormField>
          <div className="flex items-center justify-between gap-2 pt-2">
            {look ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="ghost" className="rounded-none text-red-600 hover:bg-red-50">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete look
                  </Button>
                }
                title="Delete this look?"
                description="The look and its model assignments will be removed from the lookbook."
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
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : look ? "Save look" : "Create look"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

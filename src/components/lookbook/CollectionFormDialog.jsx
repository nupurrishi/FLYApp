import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FormField from "@/components/common/FormField";
import ImageField from "@/components/common/ImageField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveCollection } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

export default function CollectionFormDialog({ event, collection, designers, currentEmail, isAdmin, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", season: "", description: "", cover_image: "", status: "draft", designer_email: "" });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: "",
      season: "",
      description: "",
      cover_image: "",
      status: "draft",
      designer_email: currentEmail,
      ...(collection || {}),
    });
  }, [open, collection, currentEmail]);

  const save = useMutation({
    mutationFn: () =>
      saveCollection({
        data: {
          ...form,
          id: collection?.id,
          event_id: event.id,
          designer_name:
            designers.find((d) => d.user_email === form.designer_email)?.full_name || currentEmail,
        },
      }),
    onSuccess: () => {
      toast.success(collection ? "Collection updated" : "Collection created");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The collection could not be saved"),
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {collection ? "Edit collection" : "New collection"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Give the collection a name");
              return;
            }
            save.mutate();
          }}
        >
          <FormField label="Collection name" required>
            <Input className={inputClass} value={form.name} onChange={set("name")} placeholder="Artmosphere" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Season">
              <Input className={inputClass} value={form.season || ""} onChange={set("season")} placeholder="Fall / Winter 2026" />
            </FormField>
            <FormField label="Status">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
                <option value="draft">Draft</option>
                <option value="in_progress">In progress</option>
                <option value="ready">Ready</option>
              </select>
            </FormField>
          </div>
          {isAdmin && (
            <FormField label="Designer">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.designer_email} onChange={set("designer_email")}>
                {designers.map((designer) => (
                  <option key={designer.user_email} value={designer.user_email}>
                    {designer.full_name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <ImageField label="Collection cover" value={form.cover_image} onChange={(url) => setForm((p) => ({ ...p, cover_image: url }))} />
          <FormField label="Description">
            <Textarea className="min-h-20 rounded-none border-brand-line bg-white" value={form.description || ""} onChange={set("description")} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
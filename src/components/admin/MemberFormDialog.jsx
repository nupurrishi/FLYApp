import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inviteToApp, saveMember } from "@/lib/manage-fns";

const inputClass = "h-11 rounded-none border-brand-line bg-white";

export default function MemberFormDialog({ event, member, users, members, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      user_email: "",
      full_name: "",
      role: "model",
      phone: "",
      status: "invited",
      notes: "",
      ...(member || {}),
    });
  }, [open, member]);

  const existingEmails = new Set(members.map((m) => m.user_email));
  const availableUsers = users.filter((user) => !existingEmails.has(user.email) || user.email === member?.user_email);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, id: member?.id, event_id: event.id };
      const record = await saveMember({ data: payload });
      if (!users.some((user) => user.email === form.user_email)) {
        await inviteToApp({ data: { email: form.user_email } }).catch(() => null);
      }
      return record;
    },
    onSuccess: () => {
      toast.success(member ? "Team member updated" : "Team member added");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "The team member could not be saved"),
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">
            {member ? "Edit team member" : "Add team member"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.user_email?.includes("@")) {
              toast.error("Enter a valid email address");
              return;
            }
            save.mutate();
          }}
        >
          {!member && availableUsers.length > 0 && (
            <FormField label="Existing app user" hint="Or enter a new email below to invite someone">
              <select
                className={`${inputClass} w-full px-3 text-sm`}
                value=""
                onChange={(e) => {
                  const user = users.find((u) => u.email === e.target.value);
                  if (!user) return;
                  setForm((prev) => ({ ...prev, user_email: user.email, full_name: user.full_name }));
                }}
              >
                <option value="">Choose a user…</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.full_name} · {user.email}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" required>
              <Input
                type="email"
                className={inputClass}
                value={form.user_email || ""}
                onChange={set("user_email")}
                disabled={!!member}
                placeholder="name@email.com"
              />
            </FormField>
            <FormField label="Full name">
              <Input className={inputClass} value={form.full_name || ""} onChange={set("full_name")} />
            </FormField>
            <FormField label="Role" required>
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.role} onChange={set("role")}>
                <option value="model">Model</option>
                <option value="designer">Designer</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select className={`${inputClass} w-full px-3 text-sm`} value={form.status} onChange={set("status")}>
                <option value="invited">Invited</option>
                <option value="active">Active</option>
              </select>
            </FormField>
            <FormField label="Phone" className="sm:col-span-2">
              <Input className={inputClass} value={form.phone || ""} onChange={set("phone")} />
            </FormField>
          </div>
          <p className="text-[11px] leading-relaxed text-black/40">
            New emails receive an app invitation. Event roles control what they can see — models see only their own
            schedule, looks and appointments.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : member ? "Save changes" : "Add to event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
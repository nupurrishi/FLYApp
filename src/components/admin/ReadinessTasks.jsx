import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { deleteTask, saveTask } from "@/lib/manage-fns";
import { toggleTask } from "@/lib/server-fns";

export default function ReadinessTasks({ event, models, tasks }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ user_email: "", title: "", due_date: "" });

  const create = useMutation({
    mutationFn: () => saveTask({ data: { ...form, event_id: event.id, kind: "prep" } }),
    onSuccess: () => {
      toast.success("Task assigned");
      setForm({ user_email: "", title: "", due_date: "" });
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error?.message || "The task could not be created"),
  });
  const remove = useMutation({
    mutationFn: (id) => deleteTask({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const done = useMutation({
    mutationFn: ({ id, done: value }) => toggleTask({ data: { id, done: value } }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <section className="border border-brand-line bg-white">
      <div className="flex items-center gap-2 border-b border-brand-line px-4 py-3">
        <ListChecks className="h-4 w-4 text-brand-purple" />
        <h2 className="text-[13px] font-bold text-brand-black">Readiness tasks</h2>
      </div>
      <form
        className="grid gap-2 border-b border-brand-line px-4 py-3 sm:grid-cols-[1fr_1.4fr_130px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.user_email || !form.title.trim()) {
            toast.error("Choose a model and describe the task");
            return;
          }
          create.mutate();
        }}
      >
        <select
          value={form.user_email}
          onChange={(e) => setForm((prev) => ({ ...prev, user_email: e.target.value }))}
          className="h-9 border border-brand-line bg-white px-2 text-[12px]"
        >
          <option value="">Model…</option>
          {models.map((model) => (
            <option key={model.user_email} value={model.user_email}>
              {model.full_name || model.user_email}
            </option>
          ))}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Confirm measurements / bring shoes…"
          className="h-9 border border-brand-line bg-white px-2 text-[12px]"
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
          className="h-9 border border-brand-line bg-white px-2 text-[12px]"
        />
        <Button type="submit" size="sm" className="h-9 rounded-none bg-brand-black hover:bg-brand-purple">
          Assign
        </Button>
      </form>
      {tasks.length === 0 ? (
        <p className="px-4 py-4 text-[12.5px] text-black/40">No readiness tasks assigned yet.</p>
      ) : (
        <div>
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2.5 border-b border-brand-line px-4 py-2.5 last:border-b-0">
              <button
                onClick={() => done.mutate({ id: task.id, done: !task.done })}
                className={`flex h-4 w-4 items-center justify-center border ${
                  task.done ? "border-brand-purple bg-brand-purple text-white" : "border-black/20 text-transparent"
                }`}
                aria-label="Toggle task"
              >
                <Check className="h-2.5 w-2.5" />
              </button>
              <span className={`min-w-0 flex-1 truncate text-[12.5px] ${task.done ? "text-black/35 line-through" : "text-brand-black"}`}>
                {task.title}
              </span>
              <span className="hidden text-[11px] text-black/40 sm:block">{task.user_email.split("@")[0]}</span>
              {task.due_date && <span className="text-[11px] text-black/35">{task.due_date}</span>}
              <ConfirmDialog
                trigger={
                  <button className="text-black/25 hover:text-red-600" aria-label={`Delete task: ${task.title}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                }
                title="Delete this readiness task?"
                description="The task will be removed from this event and the model’s task list."
                confirmLabel="Delete task"
                destructive
                onConfirm={() => remove.mutate(task.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

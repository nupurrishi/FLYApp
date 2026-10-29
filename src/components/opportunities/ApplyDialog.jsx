import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyToOpportunity } from "@/lib/manage-fns";

export default function ApplyDialog({ opportunity, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const apply = useMutation({
    mutationFn: () =>
      applyToOpportunity({
        data: { opportunity_id: opportunity.id, message, portfolio_url: portfolio || "" },
      }),
    onSuccess: () => {
      toast.success("Application submitted");
      setMessage("");
      setPortfolio("");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || "Your application could not be submitted"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-none border-brand-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium">Apply — {opportunity?.title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim().length < 10) {
              toast.error("Tell the team a little about yourself (at least 10 characters)");
              return;
            }
            apply.mutate();
          }}
        >
          <FormField label="Why you'd like to take part" required>
            <Textarea
              className="min-h-28 rounded-none border-brand-line bg-white"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A short introduction, experience and what you'd bring to the show."
            />
          </FormField>
          <FormField label="Portfolio or Instagram link">
            <Input
              className="h-11 rounded-none border-brand-line bg-white"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={apply.isPending} className="rounded-none bg-brand-black hover:bg-brand-purple">
              {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
}
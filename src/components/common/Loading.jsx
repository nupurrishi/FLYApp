import { Loader2 } from "lucide-react";

export default function Loading({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-[12px] uppercase tracking-[0.2em] text-black/40">
      <Loader2 className="h-4 w-4 animate-spin text-brand-purple" />
      {label}
    </div>
  );
}
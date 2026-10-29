import { Sparkles } from "lucide-react";

export default function EmptyState({ icon: Icon = Sparkles, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-brand-line bg-white/60 px-6 py-14 text-center">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-brand-line bg-white text-brand-purple">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-heading text-xl text-brand-black">{title}</p>
      {description && <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-black/50">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
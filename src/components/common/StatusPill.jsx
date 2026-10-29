const TONES = {
  planning: "border-black/10 bg-black/[0.04] text-black/55",
  published: "border-brand-purple/25 bg-brand-purple/[0.07] text-brand-purple",
  active: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  completed: "border-black/10 bg-black/[0.04] text-black/45",
  archived: "border-black/10 bg-black/[0.03] text-black/35",
  upcoming: "border-black/10 bg-black/[0.04] text-black/55",
  in_progress: "border-brand-gold/40 bg-brand-gold/15 text-[#7a5a10]",
  cancelled: "border-red-600/20 bg-red-50 text-red-700",
  ready: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  pending: "border-black/10 bg-black/[0.04] text-black/50",
  on_deck: "border-brand-gold/50 bg-brand-gold/20 text-[#6f5310]",
  on_stage: "border-brand-purple bg-brand-purple text-white",
  draft: "border-black/10 bg-black/[0.04] text-black/50",
  missing: "border-red-600/20 bg-red-50 text-red-700",
  not_started: "border-black/10 bg-black/[0.04] text-black/45",
  assigned: "border-black/10 bg-black/[0.04] text-black/55",
  confirmed: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  fitted: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  open: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  closed: "border-black/10 bg-black/[0.04] text-black/45",
  submitted: "border-brand-purple/25 bg-brand-purple/[0.07] text-brand-purple",
  reviewing: "border-brand-gold/40 bg-brand-gold/15 text-[#7a5a10]",
  accepted: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  declined: "border-red-600/20 bg-red-50 text-red-700",
  invited: "border-brand-gold/40 bg-brand-gold/15 text-[#7a5a10]",
  live: "border-brand-purple bg-brand-purple text-white",
  idle: "border-black/10 bg-black/[0.04] text-black/45",
  ended: "border-black/10 bg-black/[0.04] text-black/45",
};

const LABELS = {
  on_deck: "On Deck",
  on_stage: "On Stage",
  in_progress: "In Progress",
  not_started: "Not Started",
  call_time: "Call Time",
  hair_makeup: "Hair & Makeup",
};

export const statusLabel = (status) =>
  LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : "");

export default function StatusPill({ status, className = "" }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.14em] ${
        TONES[status] || "border-black/10 bg-black/[0.04] text-black/55"
      } ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}
import StatusPill from "@/components/common/StatusPill";
import { Image } from "@/components/ui/image";

export default function LookCard({ look, onOpen }) {
  const cover = look.images?.[0];
  return (
    <button onClick={() => onOpen(look)} className="group block text-left">
      <div className="relative aspect-[3/4] overflow-hidden border border-brand-line bg-brand-bone">
        {cover ? (
          <Image
            src={cover}
            alt={look.name}
            className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
            fittingType="fill"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-black/25">
            <span className="font-heading text-2xl tracking-[0.25em]">FLY</span>
            <span className="text-[9px] uppercase tracking-[0.18em]">No image</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
          <span className="text-[10px] uppercase tracking-[0.16em] text-white">View look</span>
        </div>
        {look.number && (
          <span className="absolute left-2 top-2 bg-brand-black/80 px-1.5 py-0.5 font-heading text-[11px] text-brand-gold">
            {look.number}
          </span>
        )}
      </div>
      <div className="px-1 pb-1 pt-2.5">
        <p className="text-[9.5px] uppercase tracking-[0.16em] text-brand-purple">{look.designer_name || "Designer"}</p>
        <p className="truncate font-heading text-[17px] leading-tight text-brand-black">{look.name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusPill status={look.prep_status} />
          {look.assignments?.length > 0 && (
            <span className="text-[10px] uppercase tracking-[0.12em] text-black/35">
              {look.assignments.length} model{look.assignments.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
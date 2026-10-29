import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/api/uploadClient";
import { Image } from "@/components/ui/image";

export default function ImageField({ value, onChange, label = "Image", eventId, requireEvent = false }) {
  const [busy, setBusy] = useState(false);

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, eventId));
      toast.success("Image uploaded");
    } catch {
      toast.error("That image could not be uploaded. Try a JPG or PNG under 8 MB.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="label-eyebrow mb-2 text-black/45">{label}</p>
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-brand-line bg-brand-bone">
          {value ? (
            <Image src={value} alt="" className="h-full w-full" fittingType="fill" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-black/20">
              <ImagePlus className="h-5 w-5" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {requireEvent && !eventId && <p className="max-w-56 text-xs text-black/55">Save the event first, then add event artwork.</p>}
          <label className="inline-flex cursor-pointer items-center gap-2 border border-brand-line bg-white px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-black/60 transition hover:border-brand-purple hover:text-brand-purple">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {busy ? "Uploading" : value ? "Replace" : "Upload"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={pick} disabled={busy || (requireEvent && !eventId)} />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-black/35 hover:text-red-600"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
